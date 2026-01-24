import { Image } from 'expo-image';
import { TouchableOpacity, Platform, StyleSheet, Alert } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const handleCameraPress = () => {
    router.push('/camera');
  };

  const handleInfoPress = () => {
    Alert.alert(
      'About SnapShroom',
      'SnapShroom is an AI-powered mushroom identification app that helps you safely identify edible and poisonous mushrooms using your phone camera.\n\nFeatures:\n• Real-time species identification\n• Toxicity analysis\n• Habitat suitability assessment\n• Comprehensive risk evaluation\n• Safety recommendations\n\n⚠️ WARNING: This app is for educational purposes only. Always consult with mycological experts before consuming wild mushrooms.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#4CAF50', dark: '#2E7D32' }}
      headerImage={
        <Ionicons name="leaf" size={120} color="rgba(255,255,255,0.3)" style={styles.headerIcon} />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.mainTitle}>🍄 SnapShroom</ThemedText>
        <ThemedText style={styles.subtitle}>AI Mushroom Identification</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Main Camera Button */}
      <ThemedView style={styles.cameraSection}>
        <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
          <Ionicons name="camera" size={60} color="white" />
          <ThemedText style={styles.cameraButtonText}>Identify Mushroom</ThemedText>
          <ThemedText style={styles.cameraButtonSubtext}>
            Take a photo to analyze
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Features */}
      <ThemedView style={styles.featuresSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Features</ThemedText>

        <ThemedView style={styles.featureGrid}>
          <ThemedView style={styles.featureItem}>
            <Ionicons name="leaf" size={32} color="#4CAF50" />
            <ThemedText style={styles.featureTitle}>Species ID</ThemedText>
            <ThemedText style={styles.featureText}>
              Identify mushroom species with AI
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
            <ThemedText style={styles.featureTitle}>Safety Check</ThemedText>
            <ThemedText style={styles.featureText}>
              Assess edibility and toxicity
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.featureItem}>
            <Ionicons name="location" size={32} color="#4CAF50" />
            <ThemedText style={styles.featureTitle}>Habitat Analysis</ThemedText>
            <ThemedText style={styles.featureText}>
              Check environmental suitability
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.featureItem}>
            <Ionicons name="warning" size={32} color="#FF9800" />
            <ThemedText style={styles.featureTitle}>Risk Assessment</ThemedText>
            <ThemedText style={styles.featureText}>
              Comprehensive safety evaluation
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Safety Warning */}
      <ThemedView style={styles.warningSection}>
        <Ionicons name="warning" size={24} color="#FF9800" />
        <ThemedText style={styles.warningTitle}>Important Safety Notice</ThemedText>
        <ThemedText style={styles.warningText}>
          This app provides AI-assisted identification but is not infallible.
          Always consult with certified mycologists before consuming wild mushrooms.
          Some poisonous species can be deadly.
        </ThemedText>
        <TouchableOpacity style={styles.infoButton} onPress={handleInfoPress}>
          <ThemedText style={styles.infoButtonText}>Learn More</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Getting Started */}
      <ThemedView style={styles.gettingStartedSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Getting Started</ThemedText>
        <ThemedView style={styles.stepList}>
          <ThemedView style={styles.stepItem}>
            <ThemedText style={styles.stepNumber}>1</ThemedText>
            <ThemedText style={styles.stepText}>
              Ensure you have a stable internet connection for analysis
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.stepItem}>
            <ThemedText style={styles.stepNumber}>2</ThemedText>
            <ThemedText style={styles.stepText}>
              Find a mushroom in good lighting conditions
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.stepItem}>
            <ThemedText style={styles.stepNumber}>3</ThemedText>
            <ThemedText style={styles.stepText}>
              Take a clear photo focusing on the mushroom's features
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.stepItem}>
            <ThemedText style={styles.stepNumber}>4</ThemedText>
            <ThemedText style={styles.stepText}>
              Review the analysis results and safety recommendations
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  headerIcon: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    marginLeft: -60,
  },
  cameraSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  cameraButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  warningSection: {
    backgroundColor: '#FFF3E0',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 15,
  },
  infoButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  infoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  gettingStartedSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  stepList: {
    gap: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumber: {
    backgroundColor: '#4CAF50',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    marginRight: 15,
    paddingTop: 2,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },
});
