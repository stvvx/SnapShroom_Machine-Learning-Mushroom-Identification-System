import { Image } from 'expo-image';
import { TouchableOpacity, Platform, StyleSheet, Alert, ScrollView, View, Dimensions } from 'react-native';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { testConnection } from '@/utils/api';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext'; 

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

// Blog data
const blogs = [
  {
    id: 1,
    title: "Mushroom Spawn",
    subtitle: "Grow your own mushrooms",
    image: "https://images.unsplash.com/photo-1598244829089-c81c44449371?w=800&q=80",
  },
  {
    id: 2,
    title: "Fruiting Kits",
    subtitle: "Grow mushrooms at home",
    image: "https://images.unsplash.com/photo-1595587637401-f8f5e1e5d0f3?w=800&q=80",
  },
  {
    id: 3,
    title: "Workshops & Certifications",
    subtitle: "Learn with experts",
    image: "https://images.unsplash.com/photo-1611917775446-bdf8c27929ea?w=800&q=80",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check login status on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setIsLoggedIn(true);
      } else {
        // If not logged in, redirect to login screen
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If using AuthContext (recommended approach)
  // const { user, loading } = useAuth();
  
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.replace('/login');
  //   }
  // }, [user, loading]);

  const handleCameraPress = () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Login Required',
        'Please log in to use the camera feature',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    router.push('/camera');
  };

  const handleInfoPress = () => {
    Alert.alert(
      'About SnapShroom',
      'SnapShroom is an AI-powered mushroom identification app that helps you safely identify edible and poisonous mushrooms using your phone camera.\n\nFeatures:\n• Real-time species identification\n• Toxicity analysis\n• Habitat suitability assessment\n• Comprehensive risk evaluation\n• Safety recommendations\n\n⚠️ WARNING: This app is for educational purposes only. Always consult with mycological experts before consuming wild mushrooms.',
      [{ text: 'OK' }]
    );
  };

  const handleTestConnection = async () => {
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'Please log in to test the connection');
      return;
    }
    
    setConnectionStatus('testing');
    setConnectionMessage('Testing connection to backend...');
    
    try {
      const connected = await testConnection();
      if (connected) {
        setConnectionStatus('connected');
        setConnectionMessage('✅ Backend connection successful!');
      } else {
        setConnectionStatus('failed');
        setConnectionMessage('❌ Backend not responding. Check if server is running.');
      }
    } catch (error: any) {
      setConnectionStatus('failed');
      setConnectionMessage(`❌ Connection failed: ${error.message || 'Cannot reach backend server'}`);
    }
  };

  const handleBlogPress = (blogId: number) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Login Required',
        'Please log in to access blog posts',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    Alert.alert('Blog Post', `Opening blog post ${blogId}...`, [{ text: 'OK' }]);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setIsLoggedIn(false);
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="leaf" size={64} color="#7BA05B" />
        <ThemedText style={styles.loadingText}>Loading SnapShroom...</ThemedText>
      </View>
    );
  }

  // Don't render the home screen if not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Navigation */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={28} color="#7BA05B" />
          <ThemedText style={styles.logoText}>SnapShroom</ThemedText>
        </View>
        <View style={styles.navMenu}>
          <TouchableOpacity onPress={handleInfoPress}>
            <ThemedText style={styles.navItem}>About</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCameraPress}>
            <ThemedText style={styles.navItem}>Identify</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <ThemedText style={styles.navItem}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeSection}>
        <ThemedText style={styles.welcomeText}>Welcome back! Ready to identify some mushrooms?</ThemedText>
      </View>

      {/* Rest of your existing components remain the same */}
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <View style={styles.heroTextSection}>
            <ThemedText style={styles.heroTitle}>
              Welcome to SnapShroom's AI-powered mushroom identification app
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Here you'll find resources to safely identify and learn about mushrooms using cutting-edge AI technology
            </ThemedText>
            <TouchableOpacity style={styles.heroButton} onPress={handleCameraPress}>
              <Ionicons name="camera" size={20} color="white" />
              <ThemedText style={styles.heroButtonText}>Start Identifying</ThemedText>
            </TouchableOpacity>
          </View>
          {!isSmallScreen && (
            <View style={styles.heroImageSection}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80" }} 
                style={styles.heroImage}
                contentFit="cover"
              />
            </View>
          )}
        </View>
      </View>

      {/* Blog Section */}
      <View style={styles.blogSection}>
        <ThemedText style={styles.sectionTitle}>Explore Mushroom Knowledge</ThemedText>
        <View style={styles.blogGrid}>
          {blogs.map((blog) => (
            <TouchableOpacity 
              key={blog.id} 
              style={styles.blogCard}
              onPress={() => handleBlogPress(blog.id)}
            >
              <Image 
                source={{ uri: blog.image }} 
                style={styles.blogImage}
                contentFit="cover"
              />
              <View style={styles.blogTextOverlay}>
                <ThemedText style={styles.blogTitle}>{blog.title}</ThemedText>
                <ThemedText style={styles.blogSubtitle}>{blog.subtitle}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <ThemedText style={styles.sectionTitle}>Why Choose SnapShroom?</ThemedText>
        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <Ionicons name="leaf" size={36} color="#7BA05B" />
            <ThemedText style={styles.featureTitle}>Species ID</ThemedText>
            <ThemedText style={styles.featureText}>
              Identify thousands of mushroom species instantly with AI
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="shield-checkmark" size={36} color="#7BA05B" />
            <ThemedText style={styles.featureTitle}>Safety First</ThemedText>
            <ThemedText style={styles.featureText}>
              Get detailed edibility and toxicity assessments
            </ThemedText>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="location" size={36} color="#7BA05B" />
            <ThemedText style={styles.featureTitle}>Habitat Info</ThemedText>
            <ThemedText style={styles.featureText}>
              Learn about environmental conditions and regions
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Connection Test */}
      <View style={styles.connectionSection}>
        <Ionicons 
          name={connectionStatus === 'connected' ? 'checkmark-circle' : 'wifi'} 
          size={28} 
          color={connectionStatus === 'connected' ? '#7BA05B' : '#A8B89D'} 
        />
        <ThemedText style={styles.connectionTitle}>Backend Connection Status</ThemedText>
        {connectionMessage ? (
          <ThemedText style={styles.connectionMessage}>{connectionMessage}</ThemedText>
        ) : (
          <ThemedText style={styles.connectionText}>
            Test if your device can reach the backend server
          </ThemedText>
        )}
        <TouchableOpacity 
          style={[
            styles.testButton, 
            connectionStatus === 'testing' && styles.testButtonDisabled
          ]} 
          onPress={handleTestConnection}
          disabled={connectionStatus === 'testing'}
        >
          <ThemedText style={styles.testButtonText}>
            {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Safety Warning */}
      <View style={styles.warningSection}>
        <Ionicons name="alert-circle-outline" size={28} color="#D4A373" />
        <ThemedText style={styles.warningTitle}>Important Safety Notice</ThemedText>
        <ThemedText style={styles.warningText}>
          This app provides AI-assisted identification but is not infallible. Always consult with certified mycologists before consuming wild mushrooms. Some poisonous species can be deadly.
        </ThemedText>
        <TouchableOpacity style={styles.warningButton} onPress={handleInfoPress}>
          <ThemedText style={styles.warningButtonText}>Learn More</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Getting Started */}
      <View style={styles.stepsSection}>
        <ThemedText style={styles.sectionTitle}>How It Works</ThemedText>
        <View style={styles.stepsList}>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <ThemedText style={styles.stepTitle}>Capture</ThemedText>
            <ThemedText style={styles.stepText}>
              Take a clear photo of the mushroom in natural lighting
            </ThemedText>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <ThemedText style={styles.stepTitle}>Analyze</ThemedText>
            <ThemedText style={styles.stepText}>
              Our AI processes the image and identifies the species
            </ThemedText>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <ThemedText style={styles.stepTitle}>Learn</ThemedText>
            <ThemedText style={styles.stepText}>
              Get detailed information about edibility and safety
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Footer Spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
  },
  loadingText: {
    fontSize: 18,
    color: '#4A5D3E',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
    color: '#4A5D3E',
  },
  navMenu: {
    flexDirection: 'row',
    gap: isSmallScreen ? 16 : 24,
  },
  navItem: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '500',
    color: '#5C6F51',
  },
  welcomeSection: {
    backgroundColor: '#E8EFE3',
    padding: isSmallScreen ? 16 : 20,
    marginHorizontal: isSmallScreen ? 16 : 20,
    marginTop: isSmallScreen ? 16 : 20,
    borderRadius: 12,
  },
  welcomeText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#4A5D3E',
    textAlign: 'center',
  },
  // ... rest of your existing styles remain the same
  heroBanner: {
    backgroundColor: '#E8EFE3',
    paddingVertical: isSmallScreen ? 30 : 60,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    marginTop: isSmallScreen ? 16 : 20,
  },
  heroContent: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    alignItems: 'center',
    gap: isSmallScreen ? 20 : 30,
  },
  heroTextSection: {
    flex: 1,
  },
  heroTitle: {
    fontSize: isSmallScreen ? 22 : 32,
    fontWeight: '700',
    color: '#3A4D33',
    lineHeight: isSmallScreen ? 30 : 42,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#5C6F51',
    lineHeight: isSmallScreen ? 20 : 24,
    marginBottom: isSmallScreen ? 20 : 28,
  },
  heroButton: {
    flexDirection: 'row',
    backgroundColor: '#7BA05B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    gap: 8,
    alignSelf: isSmallScreen ? 'stretch' : 'flex-start',
    justifyContent: 'center',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  heroImageSection: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  blogSection: {
    paddingVertical: isSmallScreen ? 30 : 60,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    backgroundColor: '#FDFCFA',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 22 : 28,
    fontWeight: '700',
    color: '#3A4D33',
    marginBottom: isSmallScreen ? 20 : 32,
    textAlign: 'center',
  },
  blogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isSmallScreen ? 'center' : 'space-between',
    gap: isSmallScreen ? 16 : 20,
  },
  blogCard: {
    width: isSmallScreen ? '100%' : '31%',
    minWidth: isSmallScreen ? 280 : 200,
    height: isSmallScreen ? 240 : 280,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  blogImage: {
    width: '100%',
    height: '100%',
  },
  blogTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
  },
  blogTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#3A4D33',
    marginBottom: 4,
  },
  blogSubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#5C6F51',
  },
  featuresSection: {
    paddingVertical: isSmallScreen ? 30 : 60,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    backgroundColor: '#F7F5F0',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: isSmallScreen ? 'center' : 'space-around',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 16 : 20,
  },
  featureCard: {
    width: isSmallScreen ? '100%' : '30%',
    minWidth: isSmallScreen ? 280 : 180,
    backgroundColor: '#FFFFFF',
    padding: isSmallScreen ? 24 : 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#3A4D33',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7C61',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
  },
  connectionSection: {
    backgroundColor: '#EDF5E8',
    marginHorizontal: isSmallScreen ? 16 : 20,
    marginVertical: isSmallScreen ? 20 : 30,
    padding: isSmallScreen ? 20 : 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectionTitle: {
    fontSize: isSmallScreen ? 17 : 20,
    fontWeight: '700',
    color: '#4A5D3E',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  connectionText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7C61',
    textAlign: 'center',
    marginBottom: 16,
  },
  connectionMessage: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#4A5D3E',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#7BA05B',
    paddingVertical: 12,
    paddingHorizontal: isSmallScreen ? 24 : 32,
    borderRadius: 24,
    width: isSmallScreen ? '100%' : 'auto',
  },
  testButtonDisabled: {
    backgroundColor: '#B5C9A7',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningSection: {
    backgroundColor: '#FFF8ED',
    marginHorizontal: isSmallScreen ? 16 : 20,
    marginVertical: isSmallScreen ? 16 : 20,
    padding: isSmallScreen ? 20 : 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0DFC5',
  },
  warningTitle: {
    fontSize: isSmallScreen ? 17 : 20,
    fontWeight: '700',
    color: '#9B6B3F',
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#7D6854',
    lineHeight: isSmallScreen ? 20 : 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningButton: {
    backgroundColor: '#D4A373',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    width: isSmallScreen ? '100%' : 'auto',
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepsSection: {
    paddingVertical: isSmallScreen ? 30 : 60,
    paddingHorizontal: isSmallScreen ? 16 : 20,
    backgroundColor: '#FDFCFA',
  },
  stepsList: {
    flexDirection: 'row',
    justifyContent: isSmallScreen ? 'center' : 'space-between',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 16 : 20,
  },
  stepCard: {
    width: isSmallScreen ? '100%' : '30%',
    minWidth: isSmallScreen ? 280 : 180,
    backgroundColor: '#FFFFFF',
    padding: isSmallScreen ? 20 : 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stepNumber: {
    backgroundColor: '#E8EFE3',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepNumberText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7BA05B',
  },
  stepTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#3A4D33',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7C61',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 18 : 20,
  },
  footer: {
    height: 30,
  },
});