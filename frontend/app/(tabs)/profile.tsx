import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, api } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type EditMode = 'none' | 'name' | 'password';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [loading, setLoading] = useState(false);

  // Name edit state
  const [newName, setNewName] = useState(user?.name || '');

  // Password edit state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (newName.trim() === user.name) {
      Alert.alert('Info', 'Please enter a different name');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/update-name', {
        name: newName.trim(),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Name updated successfully');
        await refreshUser();
        setEditMode('none');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update name';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/update-password', {
        oldPassword,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Password updated successfully');
        await refreshUser();
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setEditMode('none');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update password';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error: any) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={80} color="#6B7C61" />
            </View>
            <ThemedText style={styles.emailText}>{user.email}</ThemedText>
          </View>
        </View>

        {/* Profile Information Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Profile Information</ThemedText>

          {editMode !== 'name' ? (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Name</ThemedText>
                <ThemedText style={styles.value}>{user.name}</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setNewName(user.name);
                  setEditMode('name');
                }}
              >
                <Ionicons name="pencil" size={16} color="#6B7C61" />
                <ThemedText style={styles.editButtonText}>Edit Name</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editCard}>
              <ThemedText style={styles.editLabel}>New Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter new name"
                placeholderTextColor="#999"
                value={newName}
                onChangeText={setNewName}
                editable={!loading}
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditMode('none');
                    setNewName(user.name);
                  }}
                  disabled={loading}
                >
                  <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdateName}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
                      Save
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <ThemedText style={styles.value}>{user.email}</ThemedText>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Security</ThemedText>

          {editMode !== 'password' ? (
            <TouchableOpacity
              style={styles.securityButton}
              onPress={() => {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswords({ old: false, new: false, confirm: false });
                setEditMode('password');
              }}
            >
              <Ionicons name="lock-closed" size={20} color="#6B7C61" />
              <View style={styles.securityButtonContent}>
                <ThemedText style={styles.securityButtonTitle}>Change Password</ThemedText>
                <ThemedText style={styles.securityButtonSubtitle}>
                  Update your password regularly for security
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7C61" />
            </TouchableOpacity>
          ) : (
            <View style={styles.editCard}>
              {/* Old Password */}
              <ThemedText style={styles.editLabel}>Current Password</ThemedText>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter current password"
                  placeholderTextColor="#999"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry={!showPasswords.old}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                >
                  <Ionicons
                    name={showPasswords.old ? 'eye' : 'eye-off'}
                    size={20}
                    color="#6B7C61"
                  />
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <ThemedText style={[styles.editLabel, { marginTop: 12 }]}>New Password</ThemedText>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPasswords.new}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  <Ionicons
                    name={showPasswords.new ? 'eye' : 'eye-off'}
                    size={20}
                    color="#6B7C61"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <ThemedText style={[styles.editLabel, { marginTop: 12 }]}>Confirm New Password</ThemedText>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPasswords.confirm}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                  }
                >
                  <Ionicons
                    name={showPasswords.confirm ? 'eye' : 'eye-off'}
                    size={20}
                    color="#6B7C61"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setEditMode('none')}
                  disabled={loading}
                >
                  <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdatePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
                      Update
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#D32F2F" />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerSection: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DE',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 16,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2D3E2D',
  },
  infoCard: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#2D3E2D',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FDFCFA',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8E4DE',
  },
  editButtonText: {
    fontSize: 14,
    color: '#6B7C61',
    marginLeft: 8,
    fontWeight: '500',
  },
  editCard: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FDFCFA',
    borderWidth: 1,
    borderColor: '#E8E4DE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3E2D',
    marginBottom: 12,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFCFA',
    borderWidth: 1,
    borderColor: '#E8E4DE',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3E2D',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E8E4DE',
  },
  saveButton: {
    backgroundColor: '#6B7C61',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3E2D',
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E4DE',
  },
  securityButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3E2D',
    marginBottom: 4,
  },
  securityButtonSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginLeft: 8,
  },
});
