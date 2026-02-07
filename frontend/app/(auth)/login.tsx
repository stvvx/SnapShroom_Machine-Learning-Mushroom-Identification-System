import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  
  const passwordInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

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
      router.replace('/(tabs)');
    } catch {
      // Error already handled by AuthContext
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleEmailFocus = () => {
    setEmailFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 200);
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 200);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        {/* Background with Gradient */}
        <LinearGradient
          colors={['#F8FAF6', '#E8F0E3', '#F8FAF6']}
          style={styles.backgroundGradient}
        />

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#7BA05B', '#5A8040']}
              style={styles.logoGradient}
            >
              <Ionicons name="leaf" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <ThemedText style={styles.title}>SnapShroom</ThemedText>
          <ThemedText style={styles.subtitle}>
            Welcome back, let's identify some mushrooms
          </ThemedText>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Sign In</ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              Enter your credentials to continue
            </ThemedText>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
              </View>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
            <View
              style={[
                styles.inputContainer,
                emailFocused && styles.inputContainerFocused,
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Ionicons
                  name="mail"
                  size={20}
                  color={emailFocused ? '#7BA05B' : '#6B7C61'}
                />
              </View>
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="your.email@snapshroom.com"
                placeholderTextColor="#9CA897"
                value={email}
                onChangeText={setEmail}
                onFocus={handleEmailFocus}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  passwordInputRef.current?.focus();
                }}
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                spellCheck={false}
                accessibilityLabel="Email address input"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={isLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ThemedText style={styles.forgotPasswordText}>Forgot?</ThemedText>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputContainer,
                passwordFocused && styles.inputContainerFocused,
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={passwordFocused ? '#7BA05B' : '#6B7C61'}
                />
              </View>
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA897"
                value={password}
                onChangeText={setPassword}
                onFocus={handlePasswordFocus}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                autoComplete="password"
                textContentType="password"
                autoCorrect={false}
                spellCheck={false}
                accessibilityLabel="Password input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7C61"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityLabel="Sign in button"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={
                isLoading
                  ? ['#B5C9A7', '#A3B895']
                  : ['#7BA05B', '#5A8040']
              }
              style={styles.submitGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <ThemedText style={styles.submitButtonText}>
                    Sign In
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>OR</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Button */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.replace('/(tabs)')}
            disabled={isLoading}
            activeOpacity={0.7}
            accessibilityLabel="Continue as guest button"
            accessibilityRole="button"
          >
            <Ionicons name="person-outline" size={20} color="#7BA05B" />
            <ThemedText style={styles.guestButtonText}>
              Continue as Guest
            </ThemedText>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <ThemedText style={styles.signupText}>
              Don't have an account?{' '}
            </ThemedText>
            <TouchableOpacity
              onPress={() => {
                clearError();
                router.push('/(auth)/register');
              }}
              disabled={isLoading}
              accessibilityLabel="Navigate to sign up screen"
            >
              <ThemedText style={styles.signupLink}>Sign up</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        {!keyboardVisible && (
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              By continuing, you agree to our{' '}
              <ThemedText style={styles.footerLink}>
                Terms of Service
              </ThemedText>
              {' '}and{' '}
              <ThemedText style={styles.footerLink}>Privacy Policy</ThemedText>
            </ThemedText>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: keyboardVisible ? 20 : 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(123, 160, 91, 0.08)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(90, 128, 64, 0.06)',
  },

  // Header Section
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 30 : 40,
    marginTop: isSmallScreen ? 10 : 0,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradient: {
    width: isSmallScreen ? 76 : 88,
    height: isSmallScreen ? 76 : 88,
    borderRadius: isSmallScreen ? 38 : 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallScreen ? 30 : 36,
    fontWeight: '900',
    color: '#3A4D33',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : 15,
    color: '#6B7C61',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: isSmallScreen ? 18 : 22,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: isSmallScreen ? 20 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.1)',
    marginBottom: 20,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: '800',
    color: '#3A4D33',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7C61',
    lineHeight: 20,
  },

  // Error Container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  errorIconContainer: {
    marginRight: 10,
    marginTop: 1,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3A4D33',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7BA05B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF6',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5EDE0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: '#7BA05B',
    backgroundColor: '#FFFFFF',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#3A4D33',
    fontWeight: '500',
    padding: 0,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },

  // Submit Button
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5EDE0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#9CA897',
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Guest Button
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(123, 160, 91, 0.08)',
    borderWidth: 1.5,
    borderColor: '#E5EDE0',
    gap: 8,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A8040',
  },

  // Sign Up Container
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: '#6B7C61',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7BA05B',
  },

  // Footer
  footer: {
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA897',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '600',
    color: '#7BA05B',
  },
});