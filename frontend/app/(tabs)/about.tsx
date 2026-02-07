import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
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

export default function AboutPage() {
  return (
    <View style={styles.container}>
      {/* Header with Hamburger Menu */}
      <View style={styles.header}>
        <HamburgerMenu />
        <Text style={styles.headerTitle}>About SnapShroom</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Logo/Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={80} color="#A8B89D" />
          </View>
        </View>

        {/* App Title */}
        <Text style={styles.appTitle}>SnapShroom</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Application</Text>
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
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureList}>
            <FeatureItem icon="camera" title="Machine Learning Recognition" description="Advanced mushroom identification using machine learning" />
            <FeatureItem icon="flask" title="Toxicity Assessment" description="Comprehensive safety information" />
            <FeatureItem icon="map" title="Habitat Analysis" description="Species habitat and seasonal data" />
            <FeatureItem icon="bar-chart" title="Risk Analysis" description="Detailed risk assessment" />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Development Team Section */}
        <View style={styles.teamSection}>
          <Text style={styles.teamTitle}>Development Team</Text>
          
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

        {/* Divider */}
        <View style={styles.divider} />

        {/* Technology Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technology Stack</Text>
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
          <Ionicons name="warning" size={24} color="#FF9800" />
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerTitle}>Safety Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              SnapShroom is an educational tool for mushroom identification. Never consume wild mushrooms
              based solely on app results. Always consult with expert mycologists before consumption.
            </Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:support@snapshroom.app')}
          >
            <Ionicons name="mail" size={20} color="#A8B89D" />
            <Text style={styles.contactText}>support@snapshroom.app</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 SnapShroom</Text>
          <Text style={styles.footerSubtext}>Empowering Safe Mushroom Identification</Text>
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
      <Text style={styles.memberRole}>{member.role}</Text>

      {/* Decorative Element */}
      <View style={styles.memberFooter}>
        <View style={[styles.dot, { marginRight: 6 }]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={24} color="#A8B89D" />
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
      <Ionicons name={icon as any} size={14} color="#6B7C61" style={{ marginRight: 6 }} />
      <Text style={styles.techBadgeText}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3EF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#E8E4DE',
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
  },
  iconSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F3EF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E8E4DE',
    shadowColor: '#7BA05B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2D3E2D',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7C61',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 24,
    backgroundColor: '#F5F3EF',
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7BA05B',
  },
  visionMissionContainer: {
    gap: 16,
    marginBottom: 28,
  },
  vmCard: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  vmIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  vmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3E2D',
    marginBottom: 10,
  },
  vmDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '500',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F9F7F3',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7BA05B',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3E2D',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  divider: {
    height: 2,
    backgroundColor: '#E8E4DE',
    marginVertical: 30,
  },
  teamSection: {
    marginBottom: 28,
  },
  teamTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7C61',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  membersGrid: {
    gap: 16,
    marginBottom: 28,
  },
  memberCard: {
    backgroundColor: '#F9F7F3',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E4DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  adviserCard: {
    backgroundColor: '#FFF8F0',
    borderColor: '#D4C8BD',
    borderWidth: 2,
  },
  memberImage: {
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
  },
  memberImageActual: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#7BA05B',
  },
  imageGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#7BA05B',
    opacity: 0.2,
    top: -5,
    left: -5,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E4DE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6B7C61',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3E2D',
    textAlign: 'center',
    marginBottom: 4,
  },
  memberBio: {
    fontSize: 12,
    color: '#7BA05B',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  memberRole: {
    fontSize: 13,
    color: '#7BA05B',
    textAlign: 'center',
    fontWeight: '600',
  },
  memberFooter: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A8B89D',
  },
  adviserSection: {
    marginTop: 12,
  },
  adviserLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7C61',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techBadge: {
    backgroundColor: '#E8E4DE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#7BA05B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  techBadgeText: {
    fontSize: 12,
    color: '#6B7C61',
    fontWeight: '600',
  },
  disclaimerSection: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 10,
    marginBottom: 28,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D84315',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9F7F3',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7BA05B',
  },
  contactText: {
    fontSize: 14,
    color: '#6B7C61',
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 40,
    borderTopWidth: 2,
    borderTopColor: '#E8E4DE',
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7C61',
    marginBottom: 4,
    fontWeight: '700',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
});