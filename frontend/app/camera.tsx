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

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.12:5000/api';
      
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
        <View style={styles.loadingContent}>
          <View style={styles.mushroomIcon}>
            <Ionicons name="leaf" size={60} color="#7BA05B" />
          </View>
          <ActivityIndicator size="large" color="#7BA05B" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Initializing SnapShroom...</Text>
        </View>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="camera-outline" size={80} color="#FF6B6B" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            SnapShroom needs camera access to identify mushrooms from photos.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#7BA05B" />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={26} color="#7BA05B" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="leaf" size={24} color="#7BA05B" />
              <Text style={styles.examplesTitle}>Capture Guide</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowExamples(false)} 
              style={styles.headerButton}
            >
              <Ionicons name="camera" size={26} color="#7BA05B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.examplesScroll} showsVerticalScrollIndicator={false}>
            {/* Guide Section */}
            <View style={styles.guideSection}>
              <View style={styles.guideTitleContainer}>
                <Ionicons name="sparkles" size={24} color="#7BA05B" />
                <Text style={styles.guideSectionTitle}>Perfect Capture Tips</Text>
              </View>
              
              <View style={styles.tipsContainer}>
                <View style={styles.tipItem}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="sunny" size={18} color="#FFD700" />
                  </View>
                  <Text style={styles.tipText}>Good lighting - natural daylight is best</Text>
                </View>
                
                <View style={styles.tipItem}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="eye" size={18} color="#4DA6FF" />
                  </View>
                  <Text style={styles.tipText}>Focus clearly on the mushroom cap</Text>
                </View>
                
                <View style={styles.tipItem}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="grid" size={18} color="#9C27B0" />
                  </View>
                  <Text style={styles.tipText}>Include the gills and stem if possible</Text>
                </View>
                
                <View style={styles.tipItem}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="map" size={18} color="#7BA05B" />
                  </View>
                  <Text style={styles.tipText}>Show surrounding habitat for context</Text>
                </View>
                
                <View style={styles.tipItem}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="moon" size={18} color="#1A1A1A" />
                  </View>
                  <Text style={styles.tipText}>Avoid shadows and glare</Text>
                </View>
              </View>
            </View>

            {/* Examples Grid */}
            <View style={styles.examplesGrid}>
              <View style={styles.examplesGridTitleContainer}>
                <Ionicons name="image" size={24} color="#7BA05B" />
                <Text style={styles.examplesGridTitle}>Example Captures</Text>
              </View>
              
              {MUSHROOM_EXAMPLES.map((mushroom) => (
                <View key={mushroom.id} style={styles.exampleCard}>
                  <Image
                    source={{ uri: mushroom.imageUrl }}
                    style={styles.exampleImage}
                  />
                  <View style={styles.exampleInfo}>
                    <Text style={styles.exampleTitle}>{mushroom.title}</Text>
                    <View style={styles.exampleTipContainer}>
                      <Ionicons name="bulb" size={14} color="#FFD700" />
                      <Text style={styles.exampleTip}>{mushroom.tips}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startCameraButton}
              onPress={() => setShowExamples(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.startCameraButtonText}>Start Capturing</Text>
              <View style={styles.buttonArrow}>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
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
              <View style={styles.titleContainer}>
                <Ionicons name="leaf" size={24} color="#7BA05B" />
                <Text style={styles.titleText}>SnapShroom</Text>
              </View>
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
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Ionicons name="leaf" size={48} color="rgba(123, 160, 91, 0.6)" style={{ marginBottom: 12 }} />
                <Text style={styles.guideText}>Center the mushroom</Text>
              </View>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomBar}>
              <View style={styles.instructions}>
                <View style={styles.instructionItem}>
                  <Ionicons name="sunny" size={16} color="#FFD700" />
                  <Text style={styles.instructionText}>Good lighting</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="eye" size={16} color="#7BA05B" />
                  <Text style={styles.instructionText}>Clear focus</Text>
                </View>
                <View style={styles.instructionItem}>
                  <Ionicons name="leaf" size={16} color="#4DA6FF" />
                  <Text style={styles.instructionText}>Full specimen</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.loadingButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <View style={styles.captureButtonInner}>
                    <Ionicons name="camera" size={36} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.captureHint}>
                <Ionicons name="finger-up" size={16} color="white" />
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
    backgroundColor: '#0F1F0F',
  },
  
  // Loading & Permission States
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mushroomIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(123, 160, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7BA05B',
  },
  loadingText: {
    fontSize: 16,
    color: '#A8B89D',
    marginTop: 20,
    fontWeight: '600',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E6F4FE',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#A8B89D',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#7BA05B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    gap: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7BA05B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    gap: 10,
  },
  secondaryButtonText: {
    color: '#7BA05B',
    fontSize: 16,
    fontWeight: '600',
  },

  // Camera Container
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
    backgroundColor: '#0F1F0F',
    paddingTop: 40,
  },
  examplesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1A2D1A',
    backgroundColor: 'rgba(15, 31, 15, 0.95)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 160, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.3)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  guideTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  guideSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A8B89D',
  },
  tipsContainer: {
    gap: 14,
    backgroundColor: 'rgba(123, 160, 91, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7BA05B',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(123, 160, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#C8D8C8',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  examplesGrid: {
    marginBottom: 28,
  },
  examplesGridTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  examplesGridTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A8B89D',
  },
  exampleCard: {
    flexDirection: 'row',
    backgroundColor: '#1A2D1A',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#2D3E2D',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  exampleImage: {
    width: 120,
    height: 120,
  },
  exampleInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6F4FE',
    marginBottom: 8,
  },
  exampleTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exampleTip: {
    fontSize: 13,
    color: '#A8B89D',
    fontWeight: '500',
  },
  startCameraButton: {
    backgroundColor: '#7BA05B',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startCameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonArrow: {
    marginLeft: 4,
  },

  // Camera View Styles
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.3)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tipsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(123, 160, 91, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.6)',
  },
  targetingGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetSquare: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: 'rgba(123, 160, 91, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 160, 91, 0.05)',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#7BA05B',
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#7BA05B',
    borderTopRightRadius: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#7BA05B',
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#7BA05B',
    borderBottomRightRadius: 4,
  },
  guideText: {
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomBar: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.3)',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#7BA05B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7BA05B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(123, 160, 91, 0.3)',
  },
  captureButtonDisabled: {
    backgroundColor: '#556B4F',
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  captureHint: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.4)',
  },
  hintText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});