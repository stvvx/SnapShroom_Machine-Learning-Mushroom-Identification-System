import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Mushroom examples for user guidance
const MUSHROOM_EXAMPLES = [
  {
    id: 1,
    title: 'Button Mushroom',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&h=150&fit=crop',
    tips: 'Show the cap clearly',
  },
  {
    id: 2,
    title: 'Shiitake',
    imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1267ae5b?w=150&h=150&fit=crop',
    tips: 'Capture full specimen',
  },
  {
    id: 3,
    title: 'Oyster',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=150&h=150&fit=crop',
    tips: 'Include gills in frame',
  },
  {
    id: 4,
    title: 'Portobello',
    imageUrl: 'https://images.unsplash.com/photo-1585238341710-4b4e6b405f88?w=150&h=150&fit=crop',
    tips: 'Good lighting helps',
  },
];

// CLOUDINARY CONFIGURATION (from environment variables)
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'snapshroom';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

if (!CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️ EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is not set in .env file');
}

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Upload image to Cloudinary
  const uploadToCloudinary = async (base64: string, photoUri?: string) => {
    try {
      let blobData: Blob;

      // Try base64 first (native)
      if (base64) {
        console.log('📦 Using base64 method for camera upload');
        try {
          // Convert base64 to Uint8Array to avoid Buffer reference
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blobData = new Blob([bytes], { type: 'image/jpeg' });
        } catch (base64Error) {
          console.warn('⚠️ Failed to process base64, trying URI fallback:', base64Error);
          if (photoUri) {
            const response = await fetch(photoUri);
            blobData = await response.blob();
          } else {
            throw new Error('No base64 or URI available');
          }
        }
      } else if (photoUri) {
        // Fallback to URI method (web)
        console.log('📦 Using URI method for camera upload');
        const response = await fetch(photoUri);
        blobData = await response.blob();
      } else {
        throw new Error('No image data available');
      }

      console.log('✅ Blob created:', {
        size: blobData.size,
        type: blobData.type,
      });

      const uploadPreset = CLOUDINARY_UPLOAD_PRESET || 'snapshroom';
      console.log('📤 Uploading to Cloudinary with preset:', uploadPreset);

      const formData = new FormData();
      formData.append('file', blobData, 'mushroom.jpg');
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'snapshroom/mushroom-captures');

      const response = await fetch(CLOUDINARY_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Cloudinary error response:', errorData);
        throw new Error(`Cloudinary upload failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Cloudinary upload successful:', {
        url: data.secure_url,
        public_id: data.public_id,
      });

      return {
        cloudinaryUrl: data.secure_url,
        cloudinaryId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw error;
    }
  };

  // Check if image contains a mushroom
  const checkForMushroom = async (base64: string, photoUri?: string): Promise<{ isMushroom: boolean; confidence: number }> => {
    try {
      console.log('🔍 Checking if image contains a mushroom...');
      
      let cleanBase64 = base64 || '';
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000/api';
      
      const response = await fetch(`${apiUrl}/toxicity/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: cleanBase64,
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ Mushroom detection failed:', response.status);
        // If detection fails, allow proceeding (fail-open approach)
        return { isMushroom: true, confidence: 0.5 };
      }

      const data = await response.json();
      console.log('Detection result:', data);

      // Check if detection found objects with mushroom confidence
      const hasMushroom = data.detection_results?.detected === true || 
                         (data.objects && data.objects.length > 0);
      const confidence = data.confidence || 0;

      return {
        isMushroom: hasMushroom,
        confidence: confidence
      };
    } catch (error) {
      console.error('❌ Mushroom detection error:', error);
      // If detection fails, allow proceeding (fail-open approach)
      return { isMushroom: true, confidence: 0.5 };
    }
  };

  // Take picture and upload
  const takePicture = async () => {
    if (cameraRef.current && !isLoading) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          exif: false,
        });

        if (photo?.base64 || photo?.uri) {
          console.log('📸 Photo captured, checking for mushroom...');
          
          // Check if image contains a mushroom
          const { isMushroom, confidence } = await checkForMushroom(photo.base64 || '', photo.uri);
          
          if (!isMushroom || confidence < 0.3) {
            setIsLoading(false);
            Alert.alert(
              'No Mushroom Detected',
              'Please make sure the mushroom is clearly visible in the frame. Tips:\n\n• Focus on the mushroom cap\n• Ensure good lighting\n• Fill most of the frame with the mushroom\n• Avoid blurry photos',
              [
                {
                  text: 'Try Again',
                  onPress: () => console.log('Retaking photo'),
                  style: 'default',
                },
              ]
            );
            return;
          }

          console.log('✅ Mushroom detected with confidence:', confidence);

          // Upload to Cloudinary
          const cloudinaryData = await uploadToCloudinary(photo.base64 || '', photo.uri);

          // Navigate to prediction screen with the captured image
          router.push({
            pathname: '/prediction',
            params: {
              imageUri: photo.uri,
              imageBase64: photo.base64 || '',
              cloudinaryUrl: cloudinaryData.cloudinaryUrl,
              cloudinaryId: cloudinaryData.cloudinaryId,
            },
          });
        }
      } catch (error) {
        console.error('❌ Error taking picture:', error);
        Alert.alert(
          'Error',
          'Failed to capture or upload image. Please make sure Cloudinary is configured correctly.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Request permission handler
  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7BA05B" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={80} color="#666" />
        <Text style={styles.title}>Camera Access Required</Text>
        <Text style={styles.text}>
          This app needs camera access to identify mushrooms from photos.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {showExamples ? (
        // Mushroom Examples View
        <View style={styles.examplesContainer}>
          <View style={styles.examplesHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#E6F4FE" />
            </TouchableOpacity>
            <Text style={styles.examplesTitle}>Capture Guide</Text>
            <TouchableOpacity onPress={() => setShowExamples(false)}>
              <Ionicons name="camera" size={28} color="#7BA05B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.examplesScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.guideSection}>
              <Text style={styles.guideSectionTitle}>Perfect Capture Tips</Text>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#7BA05B" />
                <Text style={styles.tipText}>Good lighting - natural daylight is best</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#7BA05B" />
                <Text style={styles.tipText}>Focus clearly on the mushroom cap</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#7BA05B" />
                <Text style={styles.tipText}>Include the gills and stem if possible</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#7BA05B" />
                <Text style={styles.tipText}>Show surrounding habitat for context</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color="#7BA05B" />
                <Text style={styles.tipText}>Avoid shadows and glare</Text>
              </View>
            </View>

            <View style={styles.examplesGrid}>
              <Text style={styles.examplesGridTitle}>Example Captures</Text>
              {MUSHROOM_EXAMPLES.map((mushroom) => (
                <View key={mushroom.id} style={styles.exampleCard}>
                  <Image
                    source={{ uri: mushroom.imageUrl }}
                    style={styles.exampleImage}
                  />
                  <View style={styles.exampleInfo}>
                    <Text style={styles.exampleTitle}>{mushroom.title}</Text>
                    <Text style={styles.exampleTip}>💡 {mushroom.tips}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.startCameraButton}
              onPress={() => setShowExamples(false)}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.startCameraButtonText}>Start Capturing</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        // Camera View
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="picture"
          />
          <View style={styles.overlay}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.titleText}>Capture Mushroom</Text>
              <TouchableOpacity
                style={styles.tipsButton}
                onPress={() => setShowExamples(true)}
              >
                <Ionicons name="help-circle" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {/* Center targeting guide */}
            <View style={styles.targetingGuide}>
              <View style={styles.targetSquare}>
                <Ionicons name="scan" size={40} color="rgba(255,255,255,0.7)" />
                <Text style={styles.guideText}>Center the mushroom</Text>
              </View>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomBar}>
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                  📸 Ensure good lighting{'\n'}🎯 Keep mushroom in focus{'\n'}🌿 Include some background
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <View style={styles.captureButtonInner}>
                    <Ionicons name="camera" size={32} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.captureHint}>
                <Text style={styles.hintText}>
                  {isLoading ? 'Processing...' : 'Tap to capture'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2D1E',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },

  // Examples View Styles
  examplesContainer: {
    flex: 1,
    backgroundColor: '#1E2D1E',
    paddingTop: 40,
  },
  examplesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3E2D',
  },
  examplesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E6F4FE',
  },
  examplesScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  guideSection: {
    marginTop: 24,
    marginBottom: 28,
  },
  guideSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A8B89D',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#C8D8C8',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  examplesGrid: {
    marginBottom: 28,
  },
  examplesGridTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A8B89D',
    marginBottom: 16,
  },
  exampleCard: {
    flexDirection: 'row',
    backgroundColor: '#2D3E2D',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3D4E3D',
  },
  exampleImage: {
    width: 120,
    height: 120,
  },
  exampleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6F4FE',
    marginBottom: 8,
  },
  exampleTip: {
    fontSize: 13,
    color: '#A8B89D',
  },
  startCameraButton: {
    backgroundColor: '#7BA05B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
    gap: 8,
  },
  startCameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Camera View Styles
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 160, 91, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  targetingGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetSquare: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: 'rgba(123, 160, 91, 0.8)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  guideText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  bottomBar: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  instructionText: {
    color: 'white',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'left',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7BA05B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureHint: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  text: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 20,
  },
  title: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#7BA05B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7BA05B',
  },
  secondaryButtonText: {
    color: '#7BA05B',
    fontSize: 16,
    fontWeight: '600',
  },
});
