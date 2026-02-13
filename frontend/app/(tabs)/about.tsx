import React, { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Linking, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '@/components/HamburgerMenu';
import NotificationDropdown from '@/components/NotificationDropdown';

// Team member data with image paths
const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Famini, Cristel Kate M.',
    role: 'Developer',
    image: require('@/assets/images/cristel.png'),
    bio: 'cristelkate.famini@tup.edu.ph',
  },
  {
    id: 2,
    name: 'Rosario, Jerome Steven S.',
    role: 'Developer',
    image: require('@/assets/images/jerome.png'),
    bio: 'jeromesteven.rosario@tup.edu.ph',
  },
  {
    id: 3,
    name: 'Tolin, Ernesto III M.',
    role: 'Developer',
    image: require('@/assets/images/ernesto.png'),
    bio: 'ernestoiii.tolin@tup.edu.ph',
  },
];

const ADVISER = {
  name: 'Madriaga, Pops V.',
  role: 'Adviser',
  image: require('@/assets/images/adviser.png'),
  bio: 'pops_madriaga@tup.edu.ph',
};

const TECHNICAL_ADVISER = {
  name: 'Motol, Ian Jasper',
  role: 'Technical Adviser',
  bio: 'ianjasper.motol@tup.edu.ph',
};

// Animated Mushroom Component
function AnimatedMushroom({ delay = 0, size = 40 }: { delay?: number; size?: number }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    bounce.start();
    rotate.start();

    return () => {
      bounce.stop();
      rotate.stop();
    };
  }, [delay]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.mushroomContainer,
        {
          transform: [{ translateY: bounceAnim }, { rotate: rotation }],
        },
      ]}
    >
      {/* Mushroom Cap */}
      <View style={[styles.mushroomCap, { width: size, height: size * 0.6 }]}>
        {/* White spots */}
        <View style={[styles.spot, { width: size * 0.15, height: size * 0.15, top: size * 0.1, left: size * 0.2 }]} />
        <View style={[styles.spot, { width: size * 0.12, height: size * 0.12, top: size * 0.25, right: size * 0.15 }]} />
        <View style={[styles.spot, { width: size * 0.1, height: size * 0.1, bottom: size * 0.1, left: size * 0.35 }]} />
      </View>
      {/* Mushroom Stem */}
      <View style={[styles.mushroomStem, { width: size * 0.4, height: size * 0.5 }]} />
      {/* Cute face */}
      <View style={[styles.mushroomFace, { top: size * 0.3 }]}>
        <View style={[styles.eye, { width: size * 0.08, height: size * 0.08 }]} />
        <View style={[styles.eye, { width: size * 0.08, height: size * 0.08, marginLeft: size * 0.15 }]} />
      </View>
      <View style={[styles.smile, { width: size * 0.25, top: size * 0.42 }]} />
    </Animated.View>
  );
}

// Decorative Mushroom Background
function MushroomBackground() {
  return (
    <View style={styles.backgroundContainer}>
      {/* Top Left Cluster */}
      <View style={styles.mushroomCluster1}>
        <AnimatedMushroom delay={0} size={45} />
        <View style={styles.leafDecor1}>
          <Ionicons name="leaf" size={30} color="#A8C9A0" />
        </View>
      </View>

      {/* Top Right */}
      <View style={styles.mushroomCluster2}>
        <AnimatedMushroom delay={600} size={38} />
        <View style={styles.grassDecor}>
          <View style={styles.grass} />
          <View style={[styles.grass, { marginLeft: 3, height: 18 }]} />
          <View style={[styles.grass, { marginLeft: 3, height: 22 }]} />
        </View>
      </View>

      {/* Middle Left */}
      <View style={styles.mushroomCluster3}>
        <AnimatedMushroom delay={1200} size={42} />
        <AnimatedMushroom delay={1400} size={28} />
      </View>

      {/* Middle Right */}
      <View style={styles.mushroomCluster4}>
        <AnimatedMushroom delay={800} size={35} />
        <View style={styles.leafDecor2}>
          <Ionicons name="leaf" size={25} color="#B8D4AF" />
        </View>
      </View>

      {/* Bottom Left */}
      <View style={styles.mushroomCluster5}>
        <AnimatedMushroom delay={1600} size={40} />
        <View style={styles.stoneDecor}>
          <View style={styles.stone} />
          <View style={[styles.stone, { width: 18, height: 14, marginLeft: 4 }]} />
        </View>
      </View>

      {/* Bottom Right */}
      <View style={styles.mushroomCluster6}>
        <AnimatedMushroom delay={2000} size={36} />
        <AnimatedMushroom delay={2200} size={30} />
        <View style={styles.leafDecor3}>
          <Ionicons name="leaf" size={28} color="#9FBF98" />
        </View>
      </View>

      {/* Scattered small mushrooms */}
      <View style={styles.tinyMushroom1}>
        <AnimatedMushroom delay={400} size={22} />
      </View>
      <View style={styles.tinyMushroom2}>
        <AnimatedMushroom delay={1000} size={25} />
      </View>
      <View style={styles.tinyMushroom3}>
        <AnimatedMushroom delay={1800} size={20} />
      </View>
    </View>
  );
}

export default function AboutPage() {
  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#F5F9F3', '#FDFCFA', '#FCF8F3']}
        style={styles.gradientBackground}
      />
      
      {/* Mushroom Background Pattern */}
      <MushroomBackground />

      {/* Header with Hamburger Menu */}
      <LinearGradient
        colors={['rgba(200, 220, 192, 0.95)', 'rgba(185, 210, 175, 0.92)']}
        style={styles.header}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HamburgerMenu />
          <NotificationDropdown iconColor="#FFF" />
        </View>
        <Text style={styles.headerTitle}>About SnapShroom</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Hero Section */}
        <LinearGradient
          colors={['#7BA05B', '#6A8F4D', '#5A7E40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroGlow} />
          <View style={styles.logoContainer}>
            <AnimatedMushroom size={60} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.appTitle}>SnapShroom</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.tagline}>🍄 Your AI-Powered Mushroom Companion</Text>
          </View>
        </LinearGradient>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#7BA05B" />
            <Text style={styles.cardHeaderText}>About the App</Text>
          </View>
          <Text style={styles.descriptionText}>
            SnapShroom uses advanced computer vision and machine learning to identify mushrooms and 
            assess their edibility with scientific accuracy.
          </Text>
        </View>

        {/* Compact Features Grid */}
        <View style={styles.featuresGrid}>
          <FeatureCard icon="camera" title="ML Recognition" color="#7BA05B" />
          <FeatureCard icon="flask" title="Toxicity Info" color="#E85D5D" />
          <FeatureCard icon="map" title="Habitat Data" color="#4DA6FF" />
          <FeatureCard icon="bar-chart" title="Risk Analysis" color="#FFB74D" />
        </View>

        {/* Vision & Mission - Full Content */}
        <View style={styles.vmCompactContainer}>
          <CompactVMCard 
            icon="bulb"
            title="Vision"
            description="To become the world's most trusted and comprehensive platform for mycological knowledge and safety, revolutionizing how people interact with fungi in their natural habitats. We envision a future where advanced machine learning technologies make expert-level mushroom identification accessible to everyone - from professional mycologists and researchers to amateur foragers and nature enthusiasts. Our vision extends beyond mere identification to fostering global awareness about fungal biodiversity, promoting sustainable foraging practices, and contributing to scientific research through community-driven data collection. We aim to bridge the gap between cutting-edge technology and traditional mycological wisdom, creating a symbiotic relationship between human knowledge and machine learning that enhances safety, education, and appreciation of the fungal kingdom worldwide."
            iconColor="#FF9800"
          />
          <CompactVMCard 
            icon="flag"
            title="Mission"
            description="Our mission is to empower individuals and communities with accurate, real-time mushroom identification and comprehensive safety assessment tools through the power of machine learning and scientific research. We are committed to developing and continuously improving our machine learning algorithms to provide the most reliable mushroom identification system available. We strive to educate users about mushroom toxicity, edibility, and ecological importance through detailed species profiles, habitat information, and seasonal data. Our platform serves as both a practical tool for safe foraging and an educational resource for learning about fungal biodiversity. We collaborate with mycological experts, research institutions, and conservation organizations to validate our data and contribute to fungal science. Through user-friendly interfaces and accessible technology, we aim to reduce mushroom-related poisoning incidents while promoting responsible interaction with nature. We are dedicated to making mycological knowledge democratically accessible, fostering environmental stewardship, and supporting the global community of fungi enthusiasts and researchers in their pursuit of knowledge and safety."
            iconColor="#2196F3"
          />
        </View>

        {/* Compact Team Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color="#6B7C61" />
            <Text style={styles.sectionTitle}>Development Team</Text>
          </View>
          
          <View style={styles.teamGrid}>
            {TEAM_MEMBERS.map((member) => (
              <CompactTeamCard key={member.id} member={member} />
            ))}
          </View>

          {/* Project Advisers Section */}
          <View style={styles.advisersSection}>
            <Text style={styles.advisersSectionTitle}>Project Advisers</Text>
            
            {/* Adviser */}
            <View style={styles.adviserCompact}>
              <Text style={styles.adviserLabel}>Adviser</Text>
              <CompactTeamCard member={ADVISER} isAdviser />
            </View>

            {/* Technical Adviser */}
            <View style={styles.adviserCompact}>
              <Text style={styles.technicalAdviserLabel}>Technical Adviser</Text>
              <CompactTeamCard member={TECHNICAL_ADVISER} isTechnicalAdviser />
            </View>
          </View>
        </View>

        {/* Compact Tech Stack */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-slash" size={20} color="#6B7C61" />
            <Text style={styles.sectionTitle}>Technology</Text>
          </View>
          <View style={styles.techGrid}>
            <TechChip name="React Native" icon="logo-react" />
            <TechChip name="Python Flask" icon="logo-python" />
            <TechChip name="ML/YOLO" icon="hardware-chip" />
            <TechChip name="PyTorch" icon="flash" />
            <TechChip name="MongoDB" icon="server" />
          </View>
        </View>

        {/* Compact Disclaimer */}
        <View style={styles.disclaimerCompact}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerTitle}>Safety First</Text>
            <Text style={styles.disclaimerText}>
              Educational tool only. Always consult expert mycologists before consuming wild mushrooms.
            </Text>
          </View>
        </View>

        {/* Compact Contact */}
        <TouchableOpacity
          style={styles.contactCompact}
          onPress={() => Linking.openURL('mailto:support@snapshroom.app')}
        >
          <Ionicons name="mail-outline" size={20} color="#7BA05B" />
          <Text style={styles.contactText}>support@snapshroom.app</Text>
          <Ionicons name="chevron-forward" size={16} color="#A8B89D" />
        </TouchableOpacity>

        {/* Compact Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 SnapShroom</Text>
          <Text style={styles.footerSubtext}>Safe Mushroom Identification 🍄</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title, color }: { icon: string; title: string; color: string }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={styles.featureCard}>
      <LinearGradient
        colors={[color, color + 'DD', color]}
        style={styles.featureIcon}
      >
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
        <Animated.View 
          style={[
            styles.shimmerEffect,
            { transform: [{ translateX: shimmerTranslate }] }
          ]} 
        />
      </LinearGradient>
      <Text style={styles.featureCardTitle}>{title}</Text>
    </View>
  );
}

function CompactVMCard({ 
  icon, 
  title, 
  description, 
  iconColor 
}: { 
  icon: string;
  title: string;
  description: string;
  iconColor: string;
}) {
  return (
    <View style={styles.vmCompactCard}>
      <View style={[styles.vmCompactIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.vmCompactContent}>
        <Text style={styles.vmCompactTitle}>{title}</Text>
        <Text style={styles.vmCompactText}>{description}</Text>
      </View>
    </View>
  );
}

function CompactTeamCard({ 
  member, 
  isAdviser, 
  isTechnicalAdviser 
}: { 
  member: any; 
  isAdviser?: boolean;
  isTechnicalAdviser?: boolean;
}) {
  return (
    <View style={[
      styles.teamCompactCard, 
      isAdviser && styles.adviserCardCompact,
      isTechnicalAdviser && styles.technicalAdviserCardCompact
    ]}>
      <View style={styles.teamImageContainer}>
        {member.image ? (
          <Image source={member.image} style={styles.teamImage} />
        ) : (
          <View style={styles.teamImagePlaceholder}>
            <Ionicons name="person-circle" size={50} color="#7A8F7A" />
          </View>
        )}
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{member.name}</Text>
        <Text style={styles.teamEmail}>{member.bio}</Text>
        <View style={[
          styles.teamBadge,
          isTechnicalAdviser && styles.technicalAdviserBadge
        ]}>
          <Text style={styles.teamRole}>{member.role}</Text>
        </View>
      </View>
    </View>
  );
}

function TechChip({ name, icon }: { name: string; icon: string }) {
  return (
    <View style={styles.techChip}>
      <Ionicons name={icon as any} size={14} color="#6B7C61" />
      <Text style={styles.techChipText}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
    opacity: 0.08,
  },
  mushroomCluster1: {
    position: 'absolute',
    top: 100,
    left: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  mushroomCluster2: {
    position: 'absolute',
    top: 150,
    right: 15,
    alignItems: 'center',
  },
  mushroomCluster3: {
    position: 'absolute',
    top: 380,
    left: 5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  mushroomCluster4: {
    position: 'absolute',
    top: 450,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mushroomCluster5: {
    position: 'absolute',
    top: 750,
    left: 15,
    alignItems: 'flex-start',
  },
  mushroomCluster6: {
    position: 'absolute',
    top: 850,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  tinyMushroom1: {
    position: 'absolute',
    top: 550,
    right: 50,
  },
  tinyMushroom2: {
    position: 'absolute',
    top: 280,
    left: 60,
  },
  tinyMushroom3: {
    position: 'absolute',
    top: 1050,
    left: 40,
  },
  leafDecor1: {
    position: 'absolute',
    top: -10,
    right: -15,
    transform: [{ rotate: '25deg' }],
  },
  leafDecor2: {
    position: 'absolute',
    top: -8,
    left: -12,
    transform: [{ rotate: '-30deg' }],
  },
  leafDecor3: {
    position: 'absolute',
    bottom: 10,
    left: -10,
    transform: [{ rotate: '45deg' }],
  },
  grassDecor: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'flex-end',
  },
  grass: {
    width: 2,
    height: 15,
    backgroundColor: '#A8C9A0',
    borderRadius: 1,
  },
  stoneDecor: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'flex-end',
  },
  stone: {
    width: 12,
    height: 10,
    backgroundColor: '#B8B8A8',
    borderRadius: 6,
  },
  mushroomContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mushroomCap: {
    backgroundColor: '#E85D5D',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  spot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    position: 'absolute',
  },
  mushroomStem: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  mushroomFace: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    backgroundColor: '#2D3E2D',
    borderRadius: 100,
  },
  smile: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#2D3E2D',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 40,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(123, 160, 91, 0.15)',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3E2D',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
    zIndex: 2,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
    opacity: 0.6,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  heroText: {
    flex: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appVersion: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  descriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#7BA05B',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6B7C61',
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(123, 160, 91, 0.1)',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  shimmerEffect: {
    position: 'absolute',
    width: 30,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  featureCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D3E2D',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  vmCompactContainer: {
    gap: 16,
    marginBottom: 20,
  },
  vmCompactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'column',
    gap: 14,
    borderWidth: 2,
    borderColor: 'rgba(123, 160, 91, 0.2)',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  vmCompactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  vmCompactContent: {
    flex: 1,
  },
  vmCompactTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2D3E2D',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  vmCompactText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    textAlign: 'justify',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7C61',
  },
  teamGrid: {
    gap: 12,
    marginBottom: 12,
  },
  teamCompactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 2,
    borderColor: 'rgba(123, 160, 91, 0.2)',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  adviserCardCompact: {
    backgroundColor: 'rgba(255, 248, 240, 0.98)',
    borderColor: '#FFB74D',
    borderWidth: 3,
    shadowColor: '#FFB74D',
    shadowOpacity: 0.2,
  },
  technicalAdviserCardCompact: {
    backgroundColor: 'rgba(240, 248, 255, 0.98)',
    borderColor: '#4DA6FF',
    borderWidth: 3,
    shadowColor: '#4DA6FF',
    shadowOpacity: 0.2,
  },
  teamImageContainer: {
    width: 70,
    height: 70,
  },
  teamImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#7BA05B',
  },
  teamImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E8E4DE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6B7C61',
  },
  teamInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3E2D',
    marginBottom: 2,
  },
  teamEmail: {
    fontSize: 11,
    color: '#7BA05B',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  teamBadge: {
    backgroundColor: '#7BA05B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  technicalAdviserBadge: {
    backgroundColor: '#4DA6FF',
  },
  teamRole: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  advisersSection: {
    marginTop: 16,
  },
  advisersSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7C61',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  adviserCompact: {
    marginBottom: 12,
  },
  adviserLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  technicalAdviserLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4DA6FF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#7BA05B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  techChipText: {
    fontSize: 11,
    color: '#6B7C61',
    fontWeight: '700',
  },
  disclaimerCompact: {
    backgroundColor: 'rgba(255, 243, 224, 0.98)',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 3,
    borderColor: '#FFB74D',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D84315',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  contactCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7BA05B',
    marginBottom: 16,
  },
  contactText: {
    fontSize: 13,
    color: '#6B7C61',
    fontWeight: '700',
    flex: 1,
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 2,
    borderTopColor: '#E8E4DE',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 243, 239, 0.95)',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7C61',
    fontWeight: '700',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
});