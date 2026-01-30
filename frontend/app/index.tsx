// Entry: landing (Sign Up only) when not logged in; redirect to home when logged in
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Logged in → go to homepage (tabs)
  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  const handleSignUp = () => {
    router.replace('/(auth)/login');
  };

  // Still loading auth state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Ionicons name="leaf" size={48} color="#7BA05B" style={styles.icon} />
        <Text style={styles.loadingText}>SnapShroom</Text>
      </View>
    );
  }

  // Logged out: landing page with Sign Up button only
  if (!user) {
    return (
      <View style={styles.container}>
        <Ionicons name="leaf" size={64} color="#7BA05B" style={styles.icon} />
        <Text style={styles.title}>SnapShroom</Text>
        <Text style={styles.subtitle}>AI-powered mushroom identification</Text>
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} activeOpacity={0.8}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
    padding: 24,
  },
  icon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A5D3E',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A5D3E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7C61',
    textAlign: 'center',
    marginBottom: 48,
  },
  signUpButton: {
    backgroundColor: '#7BA05B',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
