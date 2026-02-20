import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, api } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '@/components/HamburgerMenu';
import NotificationDropdown from '@/components/NotificationDropdown';
import * as ImagePicker from 'expo-image-picker';

type EditMode = 'none' | 'name' | 'password';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'snapshroom';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar || null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Helper to log debug messages (console only)
  const addLog = (message: string) => {
    console.log(message);
  };

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
        showToast('Name updated successfully', 'success');
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
        showToast('Password updated successfully', 'success');
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

  const uploadProfileImage = async () => {
    try {
      setUploadError(null);
      addLog('Starting avatar upload process...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Permission required: Please allow access to your photos';
        addLog(`❌ ${msg}`);
        Alert.alert('Permission required', 'Please allow access to your photos');
        return;
      }
      addLog('✅ Media library permission granted');

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) {
        addLog('Image selection cancelled by user');
        return;
      }
      addLog('✅ Image selected');

      let base64String = '';
      
      // Try to get base64 from result (native platforms)
      const resultWithBase64 = result as any;
      
      // First try: direct base64 property (native)
      if (resultWithBase64.base64) {
        base64String = resultWithBase64.base64;
        addLog('✅ Base64 from ImagePicker (native)');
      } 
      // Second try: assets array (web and newer native)
      else if (resultWithBase64.assets && resultWithBase64.assets.length > 0) {
        const asset = resultWithBase64.assets[0];
        addLog(`Asset properties: ${Object.keys(asset).join(', ')}`);
        
        if (asset.base64) {
          base64String = asset.base64;
          addLog('✅ Base64 from assets[0] (web)');
        } else if (asset.uri) {
          // Convert URI to base64
          addLog('Converting asset URI to base64...');
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            base64String = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            addLog('✅ Base64 converted from asset.uri');
          } catch (conversionError: any) {
            const msg = `Failed to convert asset URI: ${conversionError.message}`;
            addLog(`❌ ${msg}`);
            setUploadError(msg);
            Alert.alert('Error', msg);
            return;
          }
        }
      }
      // Third try: direct uri property
      else if (resultWithBase64.uri) {
        addLog('Converting direct URI to base64...');
        try {
          const response = await fetch(resultWithBase64.uri);
          const blob = await response.blob();
          base64String = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64 = result.includes(',') ? result.split(',')[1] : result;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          addLog('✅ Base64 converted from direct URI');
        } catch (conversionError: any) {
          const msg = `Failed to convert image: ${conversionError.message}`;
          addLog(`❌ ${msg}`);
          setUploadError(msg);
          Alert.alert('Error', msg);
          return;
        }
      }
      
      if (!base64String) {
        const msg = `Failed to get image data. Result keys: ${Object.keys(resultWithBase64).join(', ')}`;
        addLog(`❌ ${msg}`);
        setUploadError(msg);
        Alert.alert('Error', msg);
        return;
      }
      addLog(`✅ Base64 data ready (${base64String.length} chars)`);

      setUploading(true);
      
      // Validate environment variables
      addLog(`Checking Cloudinary config: CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}, PRESET=${CLOUDINARY_UPLOAD_PRESET}`);
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        const msg = 'Cloudinary configuration missing. CLOUD_NAME and UPLOAD_PRESET required.';
        addLog(`❌ ${msg}`);
        setUploadError(msg);
        Alert.alert('Error', msg);
        setUploading(false);
        return;
      }
      addLog('✅ Cloudinary configuration validated');
      addLog(`API URL: ${CLOUDINARY_API_URL}`);

      addLog('Converting base64 to blob...');
      try {
        // Use atob (web API) instead of Buffer for cross-platform support
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blobData = new Blob([bytes], { type: 'image/jpeg' });
        addLog(`✅ Blob created (size: ${blobData.size} bytes)`);

        const formData = new FormData();
        formData.append('file', blobData, 'profile.jpg');
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'snapshroom/profiles');
        formData.append('tags', 'profile,user');
        addLog('✅ FormData prepared');

        addLog(`Uploading to Cloudinary: ${CLOUDINARY_API_URL}`);
        const response = await fetch(CLOUDINARY_API_URL, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          const msg = `Cloudinary upload failed: ${response.status} - ${errorText}`;
          addLog(`❌ ${msg}`);
          setUploadError(msg);
          throw new Error(msg);
        }

        const cloudinaryData = await response.json();
        const imageUrl = cloudinaryData.secure_url;
        addLog(`✅ Cloudinary upload successful: ${imageUrl}`);
        setProfileImage(imageUrl);

        // Save image URL to MongoDB
        addLog(`Saving to MongoDB via /auth/update-profile-image`);
        try {
          const mongoResponse = await api.put('/auth/update-profile-image', {
            profileImage: imageUrl,
          }, {
            timeout: 30000 // 30 second timeout
          });

          addLog(`✅ Backend response: ${JSON.stringify(mongoResponse.data)}`);

          if (mongoResponse.data.success) {
            addLog('✅ Avatar saved to database successfully');
            addLog('Refreshing user data...');
            await refreshUser();
            addLog('✅ User data refreshed');
            showToast('Profile picture updated!', 'success');
          } else {
            const msg = mongoResponse.data.message || 'Unknown error from backend';
            addLog(`⚠️ Backend returned success=false: ${msg}`);
            setUploadError(msg);
          }
        } catch (mongoError: any) {
          const message = mongoError.response?.data?.message || mongoError.message || 'Failed to save profile picture to database';
          addLog(`❌ Error saving avatar: ${message}`);
          setUploadError(message);
          Alert.alert('Warning', message);
        }
      } catch (blobError: any) {
        const message = blobError.message || 'Failed to process image upload';
        addLog(`❌ Upload processing error: ${message}`);
        setUploadError(message);
        Alert.alert('Error', message);
      }
    } catch (error: any) {
      const message = error.message || 'Failed to upload profile picture';
      addLog(`❌ Fatal error: ${message}`);
      setUploadError(message);
      Alert.alert('Error', message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. Your profile will be deactivated permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Show password confirmation dialog
            Alert.prompt(
              'Confirm Password',
              'Enter your password to confirm account deletion:',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async (password: string | undefined) => {
                    if (!password || !password.trim()) {
                      Alert.alert('Error', 'Password is required');
                      return;
                    }

                    setLoading(true);
                    try {
                      const response = await api.delete('/auth/delete-account', {
                        data: { password },
                      });

                      if (response.data.success) {
                        Alert.alert('Success', 'Account deleted successfully', [
                          {
                            text: 'OK',
                            onPress: async () => {
                              await logout();
                            },
                          },
                        ]);
                      }
                    } catch (error: any) {
                      const message = error.response?.data?.message || 'Failed to delete account';
                      Alert.alert('Error', message);
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HamburgerMenu />
          <NotificationDropdown iconColor="#7BA05B" />
        </View>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person-circle" size={80} color="#6B7C61" />
                </View>
              )}
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={uploadProfileImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons name="camera" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.emailText}>{user.email}</ThemedText>
            <ThemedText style={styles.userNameText}>{user.name}</ThemedText>
          </View>
        </View>

        {/* Upload Error Display */}
        {uploadError && (
          <View style={styles.debugBox}>
            <View style={styles.debugHeader}>
              <Ionicons name="alert-circle" size={20} color="#D32F2F" />
              <ThemedText style={[styles.debugTitle, { color: '#D32F2F' }]}>Upload Error</ThemedText>
            </View>
            <ThemedText style={styles.debugError}>{uploadError}</ThemedText>
          </View>
        )}

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

        {/* Logout and Delete Account Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#D32F2F" />
            <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <Ionicons name="trash" size={20} color="#D32F2F" />
            <ThemedText style={styles.logoutButtonText}>Delete Account</ThemedText>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3E2D',
    marginLeft: 12,
  },
  headerSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #F5F3EF 0%, #F9F7F3 100%)',
    borderBottomWidth: 2,
    borderBottomColor: '#E8E4DE',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E4DE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6B7C61',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#6B7C61',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7BA05B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FDFCFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emailText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3E2D',
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
  deleteButton: {
    marginTop: 12,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginLeft: 8,
  },
  debugBox: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFE8E8',
    overflow: 'hidden',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    padding: 12,
    gap: 8,
  },
  debugTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  debugError: {
    padding: 12,
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '500',
    backgroundColor: '#FFEBEE',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE8E8',
  },

});
