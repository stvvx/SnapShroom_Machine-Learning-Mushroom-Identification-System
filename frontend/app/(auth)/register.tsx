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
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signup, isLoading, error, clearError } = useAuth();

  // ---------- VALIDATION ----------
  const validateForm = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Enter a valid email');
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        'Error',
        'Password must be at least 6 characters'
      );
      return false;
    }

    if (password.trim() !== confirmPassword.trim()) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  // ---------- SUBMIT ----------
  const handleRegister = async () => {
    if (isLoading) return;
    if (!validateForm()) return;

    clearError();

    try {
      await signup({
        email: email.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
        username: username.trim(),
        name: username.trim(),
      });

      Alert.alert(
        'Success',
        'Account created successfully',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch {
      // error handled by AuthContext
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.form}>
          <ThemedText style={styles.title}>
            Create Account
          </ThemedText>

          {error && (
            <ThemedText style={styles.errorText}>
              {error}
            </ThemedText>
          )}

          <Input
            icon="person-outline"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            disabled={isLoading}
          />

          <Input
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            disabled={isLoading}
          />

          <Input
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secure={!showPassword}
            toggle={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          />

          <Input
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secure={!showPassword}
            disabled={isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>
                Create Account
              </ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ================= REUSABLE INPUT =================

const Input = ({
  icon,
  secure,
  toggle,
  disabled,
  ...props
}: any) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={20} color="#7BA05B" />
    <TextInput
      style={styles.input}
      secureTextEntry={secure}
      editable={!disabled}
      {...props}
    />
    {toggle && (
      <TouchableOpacity onPress={toggle}>
        <Ionicons
          name={secure ? 'eye-outline' : 'eye-off-outline'}
          size={20}
          color="#7BA05B"
        />
      </TouchableOpacity>
    )}
  </View>
);

// ================= STYLES =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#C0392B',
    textAlign: 'center',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#7BA05B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});