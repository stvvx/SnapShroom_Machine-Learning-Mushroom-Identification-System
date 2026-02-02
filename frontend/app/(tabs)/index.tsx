import { Image } from 'expo-image';
import { TouchableOpacity, StyleSheet, Alert, ScrollView, View, Dimensions, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { testConnection } from '@/utils/api';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import HamburgerMenu from '@/components/HamburgerMenu';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;

// Hero carousel images
const HERO_SLIDES = [
  { uri: 'https://www.researchgate.net/publication/341757075/figure/fig2/AS:896856825536518@1590838738580/Copelandia-Panaeolus-cyanescens.ppm' },
  { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Copelandia_cyanescens.jpg' },
  { uri: 'https://images.unsplash.com/photo-1528518290605-1fcc8dcca204?q=80&w=1200&auto=format&fit=crop' },
  { uri: 'https://i.ytimg.com/vi/_q1qCJ39fS0/maxresdefault.jpg' },
];

// Feature cards
const FEATURES = [
  {
    id: 1,
    icon: 'camera',
    title: 'AI Recognition',
    description: 'Instant mushroom identification using advanced AI',
    color: '#7BA05B',
  },
  {
    id: 2,
    icon: 'shield-checkmark',
    title: 'Safety First',
    description: 'Comprehensive safety information for every species',
    color: '#5A8040',
  },
  {
    id: 3,
    icon: 'library',
    title: '10K+ Species',
    description: 'Extensive database with detailed information',
    color: '#8FB569',
  },
  {
    id: 4,
    icon: 'trending-up',
    title: '99% Accuracy',
    description: 'Trained on millions of mushroom images',
    color: '#6B9449',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const { user, isLoading: authLoading, logout } = useAuth();
  const isLoggedIn = !!user;

  // Hero carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Redirect to login when not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    }
  }, [user, authLoading, router]);

  const handleCameraPress = () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Login Required',
        'Please log in to use the camera feature',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.replace('/(auth)') }
        ]
      );
      return;
    }
    router.push('/(tabs)/camera');
  };

  const handleInfoPress = () => {
    Alert.alert(
      'About SnapShroom',
      'SnapShroom is an AI-powered mushroom identification app that helps you safely identify mushrooms using your phone camera.\n\n⚠️ WARNING: This app is for educational purposes only. Never consume mushrooms based solely on app identification.',
      [{ text: 'OK' }]
    );
  };

  const handleTestConnection = async () => {
    if (!isLoggedIn) return;
    setConnectionStatus('testing');
    setConnectionMessage('Testing connection...');
    try {
      const connected = await testConnection();
      setConnectionStatus(connected ? 'connected' : 'failed');
      setConnectionMessage(connected ? 'Backend connection successful' : 'Backend not responding');
    } catch (error: any) {
      setConnectionStatus('failed');
      setConnectionMessage(`Connection failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try { 
      await logout(); 
    } catch (err) { 
      console.error('Logout error:', err); 
    }
  };

  // Header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#7BA05B', '#5A8040']} style={styles.loadingGradient}>
          <Ionicons name="leaf" size={64} color="#FFFFFF" />
          <ThemedText style={styles.loadingText}>Loading SnapShroom...</ThemedText>
        </LinearGradient>
      </View>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <View style={styles.container}>
      {/* Floating Header with Hamburger Menu */}
      <Animated.View style={[styles.floatingHeader, { backgroundColor: headerOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(45, 62, 45, 0)', 'rgba(45, 62, 45, 0.98)'],
      }) }]}>
        <View style={styles.headerContent}>
          <HamburgerMenu />
          <View style={styles.logoContainer}>
            <ThemedText style={styles.logoText}>SnapShroom</ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.heroImageContainer, { opacity: fadeAnim }]}>
            <Image 
              source={HERO_SLIDES[currentSlide]}
              style={styles.heroImage}
              contentFit="cover"
              transition={500}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
              style={styles.heroGradient}
            />
          </Animated.View>

          <View style={styles.heroContent}>
            <View style={styles.welcomeBadge}>
              <Ionicons name="sparkles" size={14} color="#FFD700" />
              <ThemedText style={styles.welcomeText} numberOfLines={1}>
                Welcome, {user?.name || user?.username || 'Explorer'}
              </ThemedText>
            </View>

            <ThemedText style={styles.heroTitle}>
              Discover & Identify{'\n'}Mushrooms with AI
            </ThemedText>
            
            <ThemedText style={styles.heroSubtitle}>
              Explore 10,000+ species with 99% accuracy using machine learning
            </ThemedText>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCameraPress}>
                <LinearGradient colors={['#7BA05B', '#5A8040']} style={styles.buttonGradient}>
                  <Ionicons name="camera" size={20} color="white" />
                  <ThemedText style={styles.primaryButtonText}>Start Identifying</ThemedText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleInfoPress}>
                <ThemedText style={styles.secondaryButtonText}>Learn More</ThemedText>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Slide Indicators */}
            <View style={styles.slideIndicators}>
              {HERO_SLIDES.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.indicator, 
                    currentSlide === index && styles.activeIndicator
                  ]} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>10K+</ThemedText>
            <ThemedText style={styles.statLabel}>Species</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>99%</ThemedText>
            <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>1M+</ThemedText>
            <ThemedText style={styles.statLabel}>Users</ThemedText>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionLabel}>FEATURES</ThemedText>
            <ThemedText style={styles.sectionTitle}>Why Choose SnapShroom</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Advanced AI technology meets comprehensive mushroom knowledge
            </ThemedText>
          </View>

          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View 
                key={feature.id} 
                style={styles.featureCard}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                  <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                </View>
                <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                <ThemedText style={styles.featureDescription}>{feature.description}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionLabel}>HOW IT WORKS</ThemedText>
            <ThemedText style={styles.sectionTitle}>Three Simple Steps</ThemedText>
          </View>

          <View style={styles.stepsContainer}>
            {[
              {
                number: '1',
                title: 'Take a Photo',
                description: 'Capture clear images of the mushroom from multiple angles'
              },
              {
                number: '2',
                title: 'AI Analysis',
                description: 'Our AI instantly analyzes and identifies the species'
              },
              {
                number: '3',
                title: 'Learn & Explore',
                description: 'Get detailed information, safety tips, and more'
              }
            ].map((step) => (
              <View key={step.number} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>{step.number}</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
                  <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Safety Notice */}
        <View style={styles.safetySection}>
          <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.safetyCard}>
            <View style={styles.safetyIconContainer}>
              <Ionicons name="warning" size={28} color="#D97706" />
            </View>
            <View style={styles.safetyContent}>
              <ThemedText style={styles.safetyTitle}>Safety First</ThemedText>
              <ThemedText style={styles.safetyText}>
                Never consume any mushroom based solely on app identification. Always consult multiple sources and experts before consuming wild mushrooms.
              </ThemedText>
            </View>
          </LinearGradient>
        </View>

        {/* System Status */}
        <View style={styles.systemSection}>
          <View style={styles.systemCard}>
            <View style={styles.systemHeader}>
              <View style={styles.systemTitleContainer}>
                <Ionicons name="pulse" size={22} color="#7BA05B" />
                <ThemedText style={styles.systemTitle}>System Status</ThemedText>
              </View>
              <View style={[
                styles.statusBadge,
                connectionStatus === 'connected' && styles.statusConnected,
                connectionStatus === 'failed' && styles.statusFailed,
              ]}>
                <View style={[
                  styles.statusDot,
                  connectionStatus === 'connected' && styles.dotConnected,
                  connectionStatus === 'failed' && styles.dotFailed,
                ]} />
                <ThemedText style={styles.statusText}>
                  {connectionStatus === 'connected' ? 'Online' : 
                   connectionStatus === 'failed' ? 'Offline' : 'Ready'}
                </ThemedText>
              </View>
            </View>

            {connectionMessage ? (
              <ThemedText style={styles.systemMessage}>{connectionMessage}</ThemedText>
            ) : null}

            <TouchableOpacity 
              style={styles.testButton} 
              onPress={handleTestConnection}
              disabled={connectionStatus === 'testing'}
            >
              <ThemedText style={styles.testButtonText}>
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <Ionicons name="leaf" size={28} color="#7BA05B" />
              <ThemedText style={styles.footerTitle}>SnapShroom</ThemedText>
              <ThemedText style={styles.footerTagline}>
                AI-Powered Mushroom Identification
              </ThemedText>
            </View>

            <ThemedText style={styles.copyright}>
              © 2026 SnapShroom. All rights reserved.
            </ThemedText>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
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
  },
  loadingGradient: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: isSmallScreen ? 50 : 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 8 : 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  logoText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '800',
    color: '#E6F4FE',
    letterSpacing: -0.5,
  },
  navMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    padding: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7BA05B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Hero Section
  heroSection: {
    height: isSmallScreen ? height * 0.82 : height * 0.85,
    position: 'relative',
  },
  heroImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: isSmallScreen ? 16 : 24,
    paddingBottom: isSmallScreen ? 60 : 50,
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: isSmallScreen ? 6 : 8,
    paddingHorizontal: isSmallScreen ? 10 : 12,
    borderRadius: 20,
    marginBottom: 16,
    maxWidth: isSmallScreen ? '90%' : '85%',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  heroTitle: {
    fontSize: isSmallScreen ? 30 : 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: isSmallScreen ? 36 : 56,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: isSmallScreen ? 20 : 24,
    marginBottom: 20,
    maxWidth: '95%',
  },
  heroActions: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 15 : 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 16 : 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: isSmallScreen ? 15 : 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 16 : 16,
    fontWeight: '600',
  },
  slideIndicators: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: isSmallScreen ? 24 : 32,
    paddingHorizontal: isSmallScreen ? 16 : 24,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isSmallScreen ? 26 : 32,
    fontWeight: '800',
    color: '#3A4D33',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isSmallScreen ? 11 : 13,
    color: '#6B7C61',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5E5',
  },

  // Features Section
  featuresSection: {
    paddingVertical: isSmallScreen ? 40 : 60,
    paddingHorizontal: isSmallScreen ? 16 : 24,
    backgroundColor: '#F8FAF6',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 32 : 48,
    paddingHorizontal: isSmallScreen ? 10 : 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7BA05B',
    letterSpacing: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 26 : 32,
    fontWeight: '800',
    color: '#3A4D33',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#6B7C61',
    textAlign: 'center',
    maxWidth: isSmallScreen ? '100%' : 500,
    lineHeight: isSmallScreen ? 20 : 24,
    paddingHorizontal: isSmallScreen ? 10 : 0,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: isSmallScreen ? 20 : 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#3A4D33',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: '#6B7C61',
    textAlign: 'center',
    lineHeight: 18,
  },

  // How It Works Section
  howItWorksSection: {
    paddingVertical: isSmallScreen ? 40 : 60,
    paddingHorizontal: isSmallScreen ? 16 : 24,
    backgroundColor: '#FFFFFF',
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    flexDirection: 'row',
    gap: isSmallScreen ? 14 : 20,
    padding: isSmallScreen ? 18 : 24,
    backgroundColor: '#F8FAF6',
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#7BA05B',
  },
  stepNumber: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7BA05B',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#3A4D33',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6B7C61',
    lineHeight: 18,
  },

  // Safety Section
  safetySection: {
    paddingVertical: isSmallScreen ? 32 : 40,
    paddingHorizontal: isSmallScreen ? 16 : 24,
    backgroundColor: '#F8FAF6',
  },
  safetyCard: {
    flexDirection: 'row',
    padding: isSmallScreen ? 18 : 24,
    borderRadius: 16,
    gap: isSmallScreen ? 14 : 20,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  safetyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  safetyText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },

  // System Section
  systemSection: {
    paddingVertical: isSmallScreen ? 32 : 40,
    paddingHorizontal: isSmallScreen ? 16 : 24,
    backgroundColor: '#FFFFFF',
  },
  systemCard: {
    backgroundColor: '#F8FAF6',
    padding: isSmallScreen ? 18 : 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EDE0',
  },
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  systemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  systemTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#3A4D33',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(107, 124, 97, 0.1)',
  },
  statusConnected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#6B7C61',
  },
  dotConnected: {
    backgroundColor: '#22C55E',
  },
  dotFailed: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7C61',
  },
  systemMessage: {
    fontSize: 13,
    color: '#6B7C61',
    marginBottom: 14,
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: '#7BA05B',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footer: {
    backgroundColor: '#3A4D33',
    paddingVertical: isSmallScreen ? 36 : 48,
    paddingHorizontal: isSmallScreen ? 16 : 24,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerBrand: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerTitle: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 6,
  },
  footerTagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  copyright: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});