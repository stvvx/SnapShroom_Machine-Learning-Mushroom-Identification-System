// app/login.tsx
import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = async () => {
    clearError();

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Password is required');
      return;
    }

    try {
      await login({ email, password });
      router.replace('/');
    } catch {
      // ❗ error already handled by AuthContext
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset will be available soon.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <Ionicons name="leaf" size={64} color="#7BA05B" />
          <ThemedText style={styles.title}>SnapShroom</ThemedText>
          <ThemedText style={styles.subtitle}>Welcome back</ThemedText>
        </ThemedView>

        <ThemedView style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#D32F2F" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#7BA05B" />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#7BA05B" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#7BA05B"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <ThemedText style={styles.forgotPasswordText}>
              Forgot Password?
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                Login
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => {
              clearError();
              router.push('/register');
            }}
            disabled={isLoading}
          >
            <ThemedText style={styles.switchModeText}>
              Don’t have an account? Sign up
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>OR</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.replace('/')}
            disabled={isLoading}
          >
            <ThemedText style={styles.guestButtonText}>
              Continue as Guest
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFA' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  header: { alignItems: 'center', paddingBottom: 40 },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4A5D3E',
    marginTop: 16,
  },
  subtitle: { fontSize: 16, color: '#6B7C61', marginTop: 8 },

  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { color: '#D32F2F', fontSize: 14, flex: 1 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E5DF',
  },
  input: { flex: 1, fontSize: 16, marginLeft: 12 },

  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: {
    color: '#7BA05B',
    fontSize: 14,
    fontWeight: '500',
  },

  submitButton: {
    backgroundColor: '#7BA05B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: { backgroundColor: '#B5C9A7' },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  switchMode: { alignItems: 'center', marginBottom: 24 },
  switchModeText: {
    color: '#7BA05B',
    fontSize: 14,
    fontWeight: '500',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E5DF' },
  dividerText: { marginHorizontal: 16, color: '#6B7C61' },

  guestButton: { alignItems: 'center', paddingVertical: 14 },
  guestButtonText: { color: '#6B7C61', fontSize: 14 },

  footer: { paddingTop: 24, alignItems: 'center' },
  footerText: {
    fontSize: 12,
    color: '#6B7C61',
    textAlign: 'center',
    lineHeight: 16,
  },
});
