import React, { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Linking, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
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
    name: 'Garcia, Aia A.',
    role: 'Developer',
    image: require('@/assets/images/aia.jpg'),
    bio: 'aia.garcia@tup.edu.ph',
  },
  {
    id: 3,
    name: 'Rosario, Jerome Steven S.',
    role: 'Developer',
    image: require('@/assets/images/jerome.png'),
    bio: 'jeromesteven.rosario@tup.edu.ph',
  },
  {
    id: 4,
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
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

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
        {/* Max width container for web */}
        <View style={[styles.contentWrapper, isWeb && styles.contentWrapperWeb]}>
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
              
              <Text style={styles.tagline}>Machine Learning-powered mushroom identification for enthusiasts and foragers</Text>
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

          {/* Features Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={24} color="#6B7C61" />
              <Text style={styles.sectionTitle}>Key Features</Text>
            </View>
            
            <View style={[styles.featuresGrid, isWeb && styles.featuresGridWeb]}>
              <FeatureCard icon="camera" title="ML Recognition" color="#7BA05B" />
              <FeatureCard icon="flask" title="Toxicity Info" color="#E85D5D" />
              <FeatureCard icon="map" title="Habitat Data" color="#4DA6FF" />
              <FeatureCard icon="bar-chart" title="Risk Analysis" color="#FFB74D" />
            </View>
          </View>

          {/* Vision & Mission - Side by Side on Web */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="telescope" size={24} color="#6B7C61" />
              <Text style={styles.sectionTitle}>Vision & Mission</Text>
            </View>
            
            <View style={[styles.vmContainer, isWeb && styles.vmContainerWeb]}>
              <CompactVMCard 
                icon="bulb"
                title="Our Vision"
                description="To become the world's most trusted and comprehensive platform for mycological knowledge and safety, revolutionizing how people interact with fungi in their natural habitats. We envision a future where advanced machine learning technologies make expert-level mushroom identification accessible to everyone - from professional mycologists and researchers to amateur foragers and nature enthusiasts."
                iconColor="#FF9800"
                isWeb={isWeb}
              />
              <CompactVMCard 
                icon="flag"
                title="Our Mission"
                description="Our mission is to empower individuals and communities with accurate, real-time mushroom identification and comprehensive safety assessment tools through the power of machine learning and scientific research. We are committed to developing and continuously improving our machine learning algorithms to provide the most reliable mushroom identification system available."
                iconColor="#2196F3"
                isWeb={isWeb}
              />
            </View>
          </View>

          {/* Team Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color="#6B7C61" />
              <Text style={styles.sectionTitle}>Development Team</Text>
            </View>
            
            {/* Team Grid - 2x2 layout */}
            <View style={[styles.teamGrid, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }]}> 
              {TEAM_MEMBERS.slice(0, 2).map((member) => (
                <View style={{ width: isWeb ? '40%' : '48%', margin: '1%' }} key={member.id}>
                  <CompactTeamCard member={member} isWeb={isWeb} />
                </View>
              ))}
              {TEAM_MEMBERS.slice(2, 4).map((member) => (
                <View style={{ width: isWeb ? '40%' : '48%', margin: '1%' }} key={member.id}>
                  <CompactTeamCard member={member} isWeb={isWeb} />
                </View>
              ))}
            </View>

            {/* Project Advisers Section - Side by Side on Web */}
            <View style={styles.advisersSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="school" size={24} color="#6B7C61" />
                <Text style={styles.sectionTitle}>Project Advisers</Text>
              </View>
              
              <View style={[styles.advisersContainer, isWeb && styles.advisersContainerWeb]}>
                {/* Adviser */}
                <View style={styles.adviserCompact}>
                  <Text style={styles.adviserLabel}>Adviser</Text>
                  <CompactTeamCard member={ADVISER} isAdviser isWeb={isWeb} />
                </View>

                {/* Technical Adviser */}
                <View style={styles.adviserCompact}>
                  <Text style={styles.technicalAdviserLabel}>Technical Adviser</Text>
                  <CompactTeamCard member={TECHNICAL_ADVISER} isTechnicalAdviser isWeb={isWeb} />
                </View>
              </View>
            </View>
          </View>

          {/* Tech Stack */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="code-slash" size={24} color="#6B7C61" />
              <Text style={styles.sectionTitle}>Technology Stack</Text>
            </View>
            <View style={styles.techGrid}>
              <TechChip name="React Native" icon="logo-react" />
              <TechChip name="Python Flask" icon="logo-python" />
              <TechChip name="ML/YOLO" icon="hardware-chip" />
              <TechChip name="PyTorch" icon="flash" />
              <TechChip name="MongoDB" icon="server" />
            </View>
          </View>

          {/* Disclaimer and Contact - Side by Side on Web */}
          <View style={[styles.bottomSection, isWeb && styles.bottomSectionWeb]}>
            {/* Disclaimer */}
            <View style={[styles.disclaimerCompact, isWeb && styles.disclaimerWeb]}>
              <Ionicons name="warning" size={24} color="#FF9800" />
              <View style={styles.disclaimerContent}>
                <Text style={styles.disclaimerTitle}>Safety First</Text>
                <Text style={styles.disclaimerText}>
                  Educational tool only. Always consult expert mycologists before consuming wild mushrooms.
                </Text>
              </View>
            </View>

            {/* Contact */}
            <TouchableOpacity
              style={[styles.contactCompact, isWeb && styles.contactWeb]}
              onPress={() => Linking.openURL('mailto:support@snapshroom.app')}
            >
              <Ionicons name="mail-outline" size={20} color="#7BA05B" />
              <Text style={styles.contactText}>support@snapshroom.app</Text>
              <Ionicons name="chevron-forward" size={16} color="#A8B89D" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 SnapShroom</Text>
            <Text style={styles.footerSubtext}>Safe Mushroom Identification 🍄</Text>
          </View>
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
  iconColor,
  isWeb 
}: { 
  icon: string;
  title: string;
  description: string;
  iconColor: string;
  isWeb: boolean;
}) {
  return (
    <View style={[styles.vmCompactCard, isWeb && styles.vmCompactCardWeb]}>
      <View style={[styles.vmCompactIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={icon as any} size={32} color="#FFFFFF" />
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
  isTechnicalAdviser,
  isWeb 
}: { 
  member: any; 
  isAdviser?: boolean;
  isTechnicalAdviser?: boolean;
  isWeb: boolean;
}) {
  return (
    <View style={[
      styles.teamCompactCard, 
      isAdviser && styles.adviserCardCompact,
      isTechnicalAdviser && styles.technicalAdviserCardCompact,
      isWeb && styles.teamCompactCardWeb
    ]}>
      <View style={styles.teamImageContainer}>
        {member.image ? (
          <Image source={member.image} style={styles.teamImage} />
        ) : (
          <View style={styles.teamImagePlaceholder}>
            <Ionicons name="person-circle" size={100} color="#7A8F7A" />
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
      <Ionicons name={icon as any} size={16} color="#6B7C61" />
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
    zIndex: 2,
  },
  contentWrapper: {
    padding: 16,
  },
  contentWrapperWeb: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingVertical: 32,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
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
    marginRight: 24,
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
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appVersion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  descriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
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
    gap: 10,
    marginBottom: 12,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B7C61',
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featuresGridWeb: {
    gap: 20,
  },
  featureCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 20,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#2D3E2D',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  vmContainer: {
    gap: 20,
  },
  vmContainerWeb: {
    flexDirection: 'row',
    gap: 24,
  },
  vmCompactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 28,
    flexDirection: 'column',
    gap: 18,
    borderWidth: 2,
    borderColor: 'rgba(123, 160, 91, 0.2)',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  vmCompactCardWeb: {
    flex: 1,
  },
  vmCompactIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3E2D',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  vmCompactText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
    textAlign: 'justify',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6B7C61',
    letterSpacing: 0.5,
  },
  teamGrid: {
    gap: 24,
    marginBottom: 24,
  },
  teamGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  teamCompactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 32,
    flexDirection: 'row',
    gap: 24,
    borderWidth: 3,
    borderColor: 'rgba(123, 160, 91, 0.3)',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  teamCompactCardWeb: {
    flex: 1,
    minWidth: 360,
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
    width: 150,
    height: 150,
  },
  teamImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: '#7BA05B',
  },
  teamImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E8E4DE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#6B7C61',
  },
  teamInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3E2D',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  teamEmail: {
    fontSize: 15,
    color: '#7BA05B',
    marginBottom: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  teamBadge: {
    backgroundColor: '#7BA05B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  technicalAdviserBadge: {
    backgroundColor: '#4DA6FF',
  },
  teamRole: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  advisersSection: {
    marginTop: 32,
  },
  advisersContainer: {
    gap: 20,
  },
  advisersContainerWeb: {
    flexDirection: 'row',
    gap: 20,
  },
  adviserCompact: {
    flex: 1,
  },
  adviserLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 12,
    textAlign: 'left',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  technicalAdviserLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4DA6FF',
    marginBottom: 12,
    textAlign: 'left',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7BA05B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techChipText: {
    fontSize: 13,
    color: '#6B7C61',
    fontWeight: '700',
  },
  bottomSection: {
    gap: 20,
    marginBottom: 32,
  },
  bottomSectionWeb: {
    flexDirection: 'row',
    gap: 24,
  },
  disclaimerCompact: {
    backgroundColor: 'rgba(255, 243, 224, 0.98)',
    padding: 24,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 3,
    borderColor: '#FFB74D',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disclaimerWeb: {
    flex: 1,
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D84315',
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  contactCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#7BA05B',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  contactWeb: {
    flex: 1,
  },
  contactText: {
    fontSize: 15,
    color: '#6B7C61',
    fontWeight: '700',
    flex: 1,
  },
  footer: {
    paddingVertical: 24,
    borderTopWidth: 2,
    borderTopColor: '#E8E4DE',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 243, 239, 0.95)',
    borderRadius: 16,
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7C61',
    fontWeight: '700',
    marginBottom: 6,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
});