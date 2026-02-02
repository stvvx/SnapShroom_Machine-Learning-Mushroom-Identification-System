import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function HamburgerMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleNavigate = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  const menuItems = [
    { label: 'Home', icon: 'home', route: isAdmin ? '/(tabs)/indexAdmin' : '/(tabs)/' },
    { label: 'Capture', icon: 'camera', route: '/(tabs)/camera' },
    { label: 'Profile', icon: 'person', route: '/(tabs)/profile' },
    { label: 'Explore', icon: 'search', route: '/(tabs)/explore', hidden: isAdmin },
    { label: 'About', icon: 'information-circle', route: '/(tabs)/about' },
    ...(isAdmin ? [{ label: 'Admin', icon: 'shield', route: '/(tabs)/admin' }] : []),
  ];

  return (
    <View style={styles.container}>
      {/* Hamburger Icon */}
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={() => setMenuOpen(true)}
      >
        <Ionicons name="menu" size={28} color="#E6F4FE" />
      </TouchableOpacity>

      {/* Modal Menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuOpen(false)}
            >
              <Ionicons name="close" size={28} color="#E6F4FE" />
            </TouchableOpacity>

            {/* Menu Title */}
            <Text style={styles.menuTitle}>SnapShroom</Text>

            {/* Menu Items */}
            <ScrollView style={styles.menuItems}>
              {menuItems
                .filter((item) => !item.hidden)
                .map((item) => (
                  <TouchableOpacity
                    key={item.route}
                    style={styles.menuItem}
                    onPress={() => handleNavigate(item.route)}
                  >
                    <Ionicons name={item.icon as any} size={24} color="#E6F4FE" />
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Logout */}
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <Ionicons name="log-out" size={24} color="#FF6B6B" />
                <Text style={[styles.menuItemText, { color: '#FF6B6B' }]}>Logout</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* User Info */}
            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>{user.role?.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Tap outside to close */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setMenuOpen(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hamburgerButton: {
    padding: 10,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#2D3E2D',
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 11,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E6F4FE',
    marginBottom: 30,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3D4E3D',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#E6F4FE',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#3D4E3D',
    marginVertical: 10,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  userInfo: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#3D4E3D',
    marginTop: 10,
  },
  userEmail: {
    color: '#A8B89D',
    fontSize: 14,
    marginBottom: 4,
  },
  userRole: {
    color: '#7A8F7A',
    fontSize: 12,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
