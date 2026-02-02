import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '@/components/HamburgerMenu';

// Team member data
const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'FAMINI, Cristel Kate M.',
    role: 'Developer',
    image: null, // Placeholder - will be provided later
  },
  {
    id: 2,
    name: 'ROSARIO, Jerome Steven S.',
    role: 'Developer',
    image: null, // Placeholder - will be provided later
  },
  {
    id: 3,
    name: 'TOLIN, Ernesto III M.',
    role: 'Developer',
    image: null, // Placeholder - will be provided later
  },
];

const ADVISER = {
  name: 'MADRIAGA, Pops V.',
  role: 'Adviser',
  image: null, // Placeholder - will be provided later
};

export default function AboutPage() {
  return (
    <View style={styles.container}>
      {/* Header with Hamburger Menu */}
      <View style={styles.header}>
        <HamburgerMenu />
        <Text style={styles.headerTitle}>About SnapShroom</Text>
        <View style={{ width: 40 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView style={styles.content}>
        {/* Logo/Icon Section */}
        <View style={styles.iconSection}>
          <Ionicons name="leaf" size={80} color="#A8B89D" />
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

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureList}>
            <FeatureItem icon="camera" title="AI Recognition" description="Advanced mushroom identification" />
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
            <TechBadge name="React Native" />
            <TechBadge name="Python Flask" />
            <TechBadge name="Machine Learning" />
            <TechBadge name="YOLO Detection" />
            <TechBadge name="PyTorch" />
            <TechBadge name="MongoDB" />
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

function TeamMemberCard({ member, isAdviser }: { member: any; isAdviser?: boolean }) {
  return (
    <View style={[styles.memberCard, isAdviser && styles.adviserCard]}>
      {/* Image Placeholder */}
      <View style={styles.memberImage}>
        {member.image ? (
          <Image source={{ uri: member.image }} style={styles.memberImageActual} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="person-circle" size={60} color="#7A8F7A" />
          </View>
        )}
      </View>

      {/* Member Info */}
      <Text style={styles.memberName}>{member.name}</Text>
      <Text style={styles.memberRole}>{member.role}</Text>
    </View>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={24} color="#A8B89D" />
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <View style={styles.techBadge}>
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
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E4DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  adviserCard: {
    backgroundColor: '#F5F3EF',
    borderColor: '#D4C8BD',
    borderWidth: 2,
  },
  memberImage: {
    marginBottom: 16,
  },
  memberImageActual: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E4DE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6B7C61',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3E2D',
    textAlign: 'center',
    marginBottom: 6,
  },
  memberRole: {
    fontSize: 13,
    color: '#7BA05B',
    textAlign: 'center',
    fontWeight: '600',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#7BA05B',
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
