import React, { useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Linking, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '@/components/HamburgerMenu';

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
  name: 'MADRIAGA, Pops V.',
  role: 'Adviser',
  image: require('@/assets/images/adviser.png'),
  bio: 'Project Guide',
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
      {/* Mushroom Background Pattern */}
      <MushroomBackground />

      {/* Header with Hamburger Menu */}
      <View style={styles.header}>
        <HamburgerMenu />
        <Text style={styles.headerTitle}>About SnapShroom</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo/Icon Section with Mushroom */}
        <View style={styles.iconSection}>
          <View style={styles.logoContainer}>
            <AnimatedMushroom size={60} />
          </View>
        </View>

        {/* App Title */}
        <Text style={styles.appTitle}>SnapShroom</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.tagline}>🍄 Your AI-Powered Mushroom Companion 🍄</Text>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="information-circle" size={22} color="#6B7C61" />
            <Text style={styles.sectionTitle}>About the Application</Text>
          </View>
          <Text style={styles.sectionText}>
            SnapShroom is an intelligent mushroom identification and safety assessment application.
            Using advanced computer vision and machine learning, we help you identify mushrooms and
            assess their edibility and toxicity levels with scientific accuracy.
          </Text>
        </View>

        {/* Vision and Mission Section */}
        <View style={styles.visionMissionContainer}>
          <VisionMissionCard 
            icon="bulb"
            title="Vision"
            description="To become the world's most trusted and comprehensive platform for mycological knowledge and safety, revolutionizing how people interact with fungi in their natural habitats. We envision a future where advanced machine learning technologies make expert-level mushroom identification accessible to everyone - from professional mycologists and researchers to amateur foragers and nature enthusiasts. Our vision extends beyond mere identification to fostering global awareness about fungal biodiversity, promoting sustainable foraging practices, and contributing to scientific research through community-driven data collection. We aim to bridge the gap between cutting-edge technology and traditional mycological wisdom, creating a symbiotic relationship between human knowledge and machine learning that enhances safety, education, and appreciation of the fungal kingdom worldwide."
            bgColor="#FFF8F0"
            borderColor="#FFB74D"
            iconColor="#FF9800"
          />
          <VisionMissionCard 
            icon="target"
            title="Mission"
            description="Our mission is to empower individuals and communities with accurate, real-time mushroom identification and comprehensive safety assessment tools through the power of machine learning and scientific research. We are committed to developing and continuously improving our machine learning algorithms to provide the most reliable mushroom identification system available. We strive to educate users about mushroom toxicity, edibility, and ecological importance through detailed species profiles, habitat information, and seasonal data. Our platform serves as both a practical tool for safe foraging and an educational resource for learning about fungal biodiversity. We collaborate with mycological experts, research institutions, and conservation organizations to validate our data and contribute to fungal science. Through user-friendly interfaces and accessible technology, we aim to reduce mushroom-related poisoning incidents while promoting responsible interaction with nature. We are dedicated to making mycological knowledge democratically accessible, fostering environmental stewardship, and supporting the global community of fungi enthusiasts and researchers in their pursuit of knowledge and safety."
            bgColor="#F0F8FF"
            borderColor="#4DA6FF"
            iconColor="#2196F3"
          />
        </View>

        {/* Features */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="sparkles" size={22} color="#6B7C61" />
            <Text style={styles.sectionTitle}>Key Features</Text>
          </View>
          <View style={styles.featureList}>
            <FeatureItem icon="camera" title="Machine Learning Recognition" description="Advanced mushroom identification using machine learning" />
            <FeatureItem icon="flask" title="Toxicity Assessment" description="Comprehensive safety information" />
            <FeatureItem icon="map" title="Habitat Analysis" description="Species habitat and seasonal data" />
            <FeatureItem icon="bar-chart" title="Risk Analysis" description="Detailed risk assessment" />
          </View>
        </View>

        {/* Decorative Divider */}
        <View style={styles.decorativeDivider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerMushroom}>
            <Text style={styles.dividerEmoji}>🍄</Text>
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Development Team Section */}
        <View style={styles.teamSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="people" size={22} color="#6B7C61" />
            <Text style={styles.teamTitle}>Development Team</Text>
          </View>
          
          {/* Team Members */}
          <View style={styles.membersGrid}>
            {TEAM_MEMBERS.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </View>

          {/* Adviser Section */}
          <View style={styles.adviserSection}>
            <Text style={styles.adviserLabel}>Project Adviser</Text>
            <TeamMemberCard member={ADVISER} isAdviser />
          </View>
        </View>

        {/* Decorative Divider */}
        <View style={styles.decorativeDivider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerMushroom}>
            <Text style={styles.dividerEmoji}>🍄</Text>
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Technology Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="code-slash" size={22} color="#6B7C61" />
            <Text style={styles.sectionTitle}>Technology Stack</Text>
          </View>
          <View style={styles.techStack}>
            <TechBadge name="React Native" icon="logo-react" />
            <TechBadge name="Python Flask" icon="logo-python" />
            <TechBadge name="Machine Learning" icon="cpu" />
            <TechBadge name="YOLO Detection" icon="eye" />
            <TechBadge name="PyTorch" icon="flash" />
            <TechBadge name="MongoDB" icon="server" />
          </View>
        </View>

        {/* Safety Disclaimer */}
        <View style={styles.disclaimerSection}>
          <Ionicons name="warning" size={28} color="#FF9800" />
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerTitle}>⚠️ Safety Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              SnapShroom is an educational tool for mushroom identification. Never consume wild mushrooms
              based solely on app results. Always consult with expert mycologists before consumption.
            </Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="mail" size={22} color="#6B7C61" />
            <Text style={styles.sectionTitle}>Contact & Support</Text>
          </View>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:support@snapshroom.app')}
          >
            <Ionicons name="mail-outline" size={22} color="#7BA05B" />
            <Text style={styles.contactText}>support@snapshroom.app</Text>
            <Ionicons name="chevron-forward" size={18} color="#A8B89D" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AnimatedMushroom size={45} />
          <Text style={styles.footerText}>© 2026 SnapShroom</Text>
          <Text style={styles.footerSubtext}>Empowering Safe Mushroom Identification</Text>
          <Text style={styles.footerEmoji}>🍄 🌿 🔬</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function VisionMissionCard({ 
  icon, 
  title, 
  description, 
  bgColor, 
  borderColor, 
  iconColor 
}: { 
  icon: string;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}) {
  return (
    <View style={[styles.vmCard, { backgroundColor: bgColor, borderColor: borderColor }]}>
      <View style={[styles.vmIconContainer, { backgroundColor: iconColor }]}>
        <Ionicons name={icon as any} size={28} color="#FFFFFF" />
      </View>
      <Text style={styles.vmTitle}>{title}</Text>
      <Text style={styles.vmDescription}>{description}</Text>
    </View>
  );
}

function TeamMemberCard({ member, isAdviser }: { member: any; isAdviser?: boolean }) {
  return (
    <View style={[styles.memberCard, isAdviser && styles.adviserCard]}>
      {/* Image with Enhanced Styling */}
      <View style={styles.memberImage}>
        {member.image ? (
          <View style={styles.imageWrapper}>
            <Image source={member.image} style={styles.memberImageActual} />
            <View style={styles.imageGlow} />
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="person-circle" size={60} color="#7A8F7A" />
          </View>
        )}
      </View>

      {/* Member Info */}
      <Text style={styles.memberName}>{member.name}</Text>
      {member.bio && <Text style={styles.memberBio}>{member.bio}</Text>}
      <View style={styles.roleBadge}>
        <Text style={styles.memberRole}>{member.role}</Text>
      </View>

      {/* Decorative Element */}
      <View style={styles.memberFooter}>
        <View style={styles.footerDot} />
        <View style={[styles.footerDot, { marginHorizontal: 6 }]} />
        <View style={styles.footerDot} />
      </View>
    </View>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={26} color="#FFFFFF" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

function TechBadge({ name, icon }: { name: string; icon: string }) {
  return (
    <View style={styles.techBadge}>
      <Ionicons name={icon as any} size={16} color="#6B7C61" />
      <Text style={styles.techBadgeText}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
    opacity: 0.12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3E2D',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    zIndex: 1,
  },
  iconSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#7BA05B',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  appTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2D3E2D',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  tagline: {
    fontSize: 15,
    color: '#7BA05B',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#6B7C61',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14.5,
    color: '#555',
    lineHeight: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 18,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7BA05B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  visionMissionContainer: {
    gap: 18,
    marginBottom: 32,
  },
  vmCard: {
    borderRadius: 16,
    padding: 22,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  vmIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  vmTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2D3E2D',
    marginBottom: 12,
  },
  vmDescription: {
    fontSize: 13.5,
    color: '#555',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  featureList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7BA05B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3E2D',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  decorativeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 35,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8E4DE',
  },
  dividerMushroom: {
    marginHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dividerEmoji: {
    fontSize: 20,
  },
  teamSection: {
    marginBottom: 32,
  },
  teamTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7C61',
    letterSpacing: 0.5,
  },
  membersGrid: {
    gap: 18,
    marginBottom: 30,
  },
  memberCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E4DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  adviserCard: {
    backgroundColor: 'rgba(255, 248, 240, 0.95)',
    borderColor: '#FFB74D',
    borderWidth: 2.5,
  },
  memberImage: {
    marginBottom: 18,
  },
  imageWrapper: {
    position: 'relative',
  },
  memberImageActual: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#7BA05B',
  },
  imageGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#7BA05B',
    opacity: 0.3,
    top: -5,
    left: -5,
  },
  imagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E8E4DE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#6B7C61',
  },
  memberName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D3E2D',
    textAlign: 'center',
    marginBottom: 6,
  },
  memberBio: {
    fontSize: 12.5,
    color: '#7BA05B',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  roleBadge: {
    backgroundColor: '#7BA05B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  memberRole: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberFooter: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#A8B89D',
  },
  adviserSection: {
    marginTop: 12,
  },
  adviserLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#7BA05B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  techBadgeText: {
    fontSize: 13,
    color: '#6B7C61',
    fontWeight: '700',
  },
  disclaimerSection: {
    backgroundColor: 'rgba(255, 243, 224, 0.95)',
    padding: 20,
    borderRadius: 14,
    marginBottom: 32,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 2,
    borderColor: '#FFB74D',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D84315',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7BA05B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  contactText: {
    fontSize: 14.5,
    color: '#6B7C61',
    fontWeight: '700',
    flex: 1,
  },
  footer: {
    paddingVertical: 45,
    borderTopWidth: 2,
    borderTopColor: '#E8E4DE',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 243, 239, 0.95)',
    borderRadius: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7C61',
    marginTop: 16,
    marginBottom: 6,
    fontWeight: '700',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 10,
  },
  footerEmoji: {
    fontSize: 16,
    marginTop: 8,
  },
});