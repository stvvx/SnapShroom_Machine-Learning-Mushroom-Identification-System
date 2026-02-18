// Check if image contains a mushroom
const checkForMushroom = async (base64: string, photoUri?: string): Promise<{ isMushroom: boolean; confidence: number }> => {
  try {
    // Clean base64 string (remove data:image/jpeg;base64, prefix if present)
    let cleanBase64 = base64 || '';
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1];
    }
    // Build API URL from environment variables
    const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP || '192.168.1.102';
    const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || '5000';
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
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
  Animated,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cornerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for capture button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scan line animation
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Corner pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      let blobData: Blob | null = null;
      // Debug: Log incoming data
      console.log('[Cloudinary] base64 length:', base64 ? base64.length : 0);
      console.log('[Cloudinary] photoUri:', photoUri);

      // Clean base64 string (remove data:image/jpeg;base64, prefix if present)
      let uploadResponse = null;
      const uploadPreset = CLOUDINARY_UPLOAD_PRESET || 'snapshroom';
      console.log('📤 Uploading to Cloudinary with preset:', uploadPreset);

      // Always use base64 data URL for mobile (Expo Go)
      try {
        let blobData: Blob | null = null;
        // Debug: Log incoming data
        console.log('[Cloudinary] base64 length:', base64 ? base64.length : 0);
        console.log('[Cloudinary] photoUri:', photoUri);
        // Clean base64 string (remove data:image/jpeg;base64, prefix if present)
        let cleanBase64 = base64 || '';
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        // Debug: Print first 100 chars of base64
        console.log('[Cloudinary] base64 preview:', cleanBase64.slice(0, 100));
        let uploadResponse = null;
        const uploadPreset = CLOUDINARY_UPLOAD_PRESET || 'snapshroom';
        console.log('📤 Uploading to Cloudinary with preset:', uploadPreset);
        // Always use base64 data URL for mobile (Expo Go)
        if (cleanBase64) {
          const formData = new FormData();
          formData.append('file', `data:image/jpeg;base64,${cleanBase64}`);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', 'snapshroom/mushroom-captures');
          for (let pair of (formData as any)._parts || []) {
            console.log('[Cloudinary] FormData part:', pair[0], typeof pair[1] === 'string' ? pair[1].slice(0, 100) : pair[1]);
          }
          uploadResponse = await fetch(CLOUDINARY_API_URL, {
            method: 'POST',
            body: formData,
          });
        } else {
          throw new Error('No valid image data to upload.');
        }
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text();
          console.error('❌ Cloudinary error response:', errorData);
          throw new Error(`Cloudinary upload failed: ${uploadResponse.status}`);
        }
        const data = await uploadResponse.json();
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
      // Build API URL from environment variables
      const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP || '192.168.1.102';
      const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || '5000';
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
      
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

        if (!photo?.base64 && !photo?.uri) {
          setIsLoading(false);
          Alert.alert('Error', 'No image data found. Please retake the photo.');
          return;
        }
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

  // Pick image from gallery
  const pickImage = async () => {
    if (isLoading) return;

    try {
      // Request permission for media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload mushroom images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      
      if (asset?.base64 || asset?.uri) {
        if (!asset?.base64 && !asset?.uri) {
          setIsLoading(false);
          Alert.alert('Error', 'No image data found. Please select another image.');
          return;
        }
        setIsLoading(true);
        console.log('📁 Image picked from gallery, checking for mushroom...');
        // Check if image contains a mushroom
        const { isMushroom, confidence } = await checkForMushroom(asset.base64 || '', asset.uri);
        if (!isMushroom || confidence < 0.3) {
          setIsLoading(false);
          Alert.alert(
            'No Mushroom Detected',
            'Please select an image with a clearly visible mushroom. Tips:\n\n• Choose a photo with good lighting\n• Ensure the mushroom fills most of the frame\n• Avoid blurry or distant photos',
            [
              {
                text: 'Try Again',
                onPress: () => pickImage(),
                style: 'default',
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
          return;
        }
        console.log('✅ Mushroom detected in uploaded image with confidence:', confidence);
        // Upload to Cloudinary
        const cloudinaryData = await uploadToCloudinary(asset.base64 || '', asset.uri);
        // Navigate to prediction screen with the uploaded image
        router.push({
          pathname: '/prediction',
          params: {
            imageUri: asset.uri,
            imageBase64: asset.base64 || '',
            cloudinaryUrl: cloudinaryData.cloudinaryUrl,
            cloudinaryId: cloudinaryData.cloudinaryId,
          },
        });
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to process the selected image. Please try again.'
      );
    } finally {
      setIsLoading(false);
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
        <LinearGradient
          colors={['#0A1A0F', '#0F1F0F', '#1A2D1A']}
          style={styles.examplesContainer}
        >
          <LinearGradient
            colors={['rgba(123, 160, 91, 0.15)', 'rgba(15, 31, 15, 0.95)']}
            style={styles.examplesHeader}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <LinearGradient
                colors={['rgba(123, 160, 91, 0.3)', 'rgba(123, 160, 91, 0.15)']}
                style={styles.headerButtonGradient}
              >
                <Ionicons name="arrow-back" size={26} color="#7BA05B" />
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="leaf" size={24} color="#7BA05B" />
              <Text style={styles.examplesTitle}>Capture Guide</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowExamples(false)} 
              style={styles.headerButton}
            >
              <LinearGradient
                colors={['rgba(123, 160, 91, 0.4)', 'rgba(123, 160, 91, 0.2)']}
                style={styles.headerButtonGradient}
              >
                <Ionicons name="camera" size={26} color="#7BA05B" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

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
              style={styles.startCameraButtonContainer}
              onPress={() => setShowExamples(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#7BA05B', '#6A8F4D', '#5A7E40']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startCameraButton}
              >
                <Ionicons name="camera" size={26} color="white" />
                <Text style={styles.startCameraButtonText}>Start Capturing</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="arrow-forward" size={22} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Upload Button */}
            <TouchableOpacity
              style={styles.uploadButtonContainer}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(123, 160, 91, 0.8)', 'rgba(106, 143, 77, 0.8)', 'rgba(90, 126, 64, 0.8)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.uploadButton}
              >
                <Ionicons name="images" size={26} color="white" />
                <Text style={styles.uploadButtonText}>Upload from Gallery</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="cloud-upload" size={22} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
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
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.3)', 'transparent']}
              style={styles.topBar}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="arrow-back" size={28} color="white" />
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Ionicons name="leaf" size={26} color="#7BA05B" />
                <Text style={styles.titleText}>SnapShroom</Text>
              </View>
              <TouchableOpacity
                style={styles.tipsButton}
                onPress={() => setShowExamples(true)}
              >
                <LinearGradient
                  colors={['rgba(123, 160, 91, 0.7)', 'rgba(123, 160, 91, 0.5)']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="help-circle" size={28} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            {/* Center targeting guide */}
            <View style={styles.targetingGuide}>
              <View style={styles.targetSquare}>
                {/* Animated corners */}
                <Animated.View style={[styles.cornerTL, { opacity: cornerAnim }]} />
                <Animated.View style={[styles.cornerTR, { opacity: cornerAnim }]} />
                <Animated.View style={[styles.cornerBL, { opacity: cornerAnim }]} />
                <Animated.View style={[styles.cornerBR, { opacity: cornerAnim }]} />
                
                {/* Scanning line effect */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-120, 120],
                        }),
                      }],
                    },
                  ]}
                />
                
                <Ionicons name="leaf" size={52} color="rgba(123, 160, 91, 0.7)" style={{ marginBottom: 14, zIndex: 2 }} />
                <Text style={styles.guideText}>Center the mushroom</Text>
                <Text style={styles.guideSubtext}>Fill the frame for best results</Text>
              </View>
            </View>

            {/* Bottom controls */}
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.7)']}
              style={styles.bottomBar}
            >
              <View style={styles.instructions}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
                  style={styles.instructionsGradient}
                >
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
                </LinearGradient>
              </View>

              <Animated.View style={{ transform: [{ scale: isLoading ? 1 : pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
                  onPress={takePicture}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={isLoading ? ['#556B4F', '#445A3F'] : ['#7BA05B', '#6A8F4D', '#5A7E40']}
                    style={styles.captureButtonGradient}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="white" />
                        <Text style={styles.loadingButtonText}>Processing...</Text>
                      </View>
                    ) : (
                      <View style={styles.captureButtonInner}>
                        <Ionicons name="camera" size={40} color="white" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Gallery Upload Button */}
              <TouchableOpacity
                style={[styles.galleryButton, isLoading && styles.captureButtonDisabled]}
                onPress={pickImage}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isLoading ? ['rgba(85, 107, 79, 0.8)', 'rgba(68, 90, 63, 0.8)'] : ['rgba(123, 160, 91, 0.9)', 'rgba(106, 143, 77, 0.9)']}
                  style={styles.galleryButtonGradient}
                >
                  <Ionicons name="images" size={24} color="white" />
                  <Text style={styles.galleryButtonText}>
                    {isLoading ? 'Processing...' : 'Upload from Gallery'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.captureHint}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.7)']}
                  style={styles.captureHintGradient}
                >
                  <Ionicons name="finger-print" size={16} color="white" />
                  <Text style={styles.hintText}>
                    {isLoading ? 'Processing...' : 'Tap to capture or upload'}
                  </Text>
                </LinearGradient>
              </View>
            </LinearGradient>
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
    paddingTop: 40,
  },
  examplesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(123, 160, 91, 0.3)',
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  headerButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.4)',
    borderRadius: 24,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  examplesTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E6F4FE',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    gap: 16,
    backgroundColor: 'rgba(123, 160, 91, 0.08)',
    padding: 18,
    borderRadius: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#7BA05B',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 160, 91, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.3)',
  },
  tipText: {
    fontSize: 15,
    color: '#C8D8C8',
    flex: 1,
    lineHeight: 22,
    fontWeight: '600',
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
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(123, 160, 91, 0.3)',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#E6F4FE',
    marginBottom: 8,
    letterSpacing: 0.3,
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
  startCameraButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startCameraButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 14,
  },
  startCameraButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    marginLeft: 4,
  },
  uploadButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  uploadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 14,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    paddingBottom: 24,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.4)',
    borderRadius: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tipsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  targetingGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetSquare: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: 'rgba(123, 160, 91, 0.6)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(123, 160, 91, 0.08)',
    position: 'relative',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: '#7BA05B',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: '#7BA05B',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: '#7BA05B',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: '#7BA05B',
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(123, 160, 91, 0.6)',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 2,
  },
  guideSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
    zIndex: 2,
  },
  bottomBar: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  instructions: {
    borderRadius: 16,
    marginBottom: 28,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  instructionsGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.4)',
    borderRadius: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  captureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  captureButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
  },
  captureButtonDisabled: {
    backgroundColor: '#556B4F',
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  captureHintGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.5)',
    borderRadius: 28,
  },
  hintText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  galleryButton: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  galleryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  galleryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});