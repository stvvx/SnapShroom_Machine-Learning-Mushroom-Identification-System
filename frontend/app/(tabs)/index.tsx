import { Image } from 'expo-image';
import { TouchableOpacity, StyleSheet, Alert, ScrollView, View, Dimensions, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { testConnection } from '@/utils/api';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import HamburgerMenu from '@/components/HamburgerMenu';
import NotificationDropdown from '@/components/NotificationDropdown';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;

// Enhanced color palette - More eye-relaxing
const COLORS = {
  // Primary greens - softer, more natural
  sage: '#9CAF88',
  moss: '#7D9B6E',
  forest: '#5F7C52',
  olive: '#4A6244',
  
  // Accent colors
  cream: '#FAF8F3',
  sand: '#F5F1E8',
  terracotta: '#E89B7C',
  coral: '#F4A896',
  
  // Neutrals
  charcoal: '#3F4941',
  stone: '#8B9388',
  cloud: '#E8EBE6',
  white: '#FFFFFF',
  
  // Status
  success: '#81C995',
  warning: '#F4B860',
  danger: '#E88B7C',
};

// Reduced spacing system
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

// Hero carousel images
const HERO_SLIDES = [
  { uri: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Copelandia_cyanescens.jpg' },
  { uri: 'https://images.unsplash.com/photo-1528518290605-1fcc8dcca204?q=80&w=1200&auto=format&fit=crop' },
  { uri: 'https://cdn.wallpapersafari.com/72/31/UXdKZD.jpg' },
  { uri: 'https://wallpaperaccess.com/full/85562.jpg' },
];

// ============ DECORATIVE MUSHROOM COMPONENTS ============

// Cartoon Mushroom SVG Component
const CartoonMushroom = ({ 
  size = 60, 
  color = COLORS.sage, 
  capColor = COLORS.coral,
  spots = true,
  style = {} 
}: { 
  size?: number; 
  color?: string; 
  capColor?: string;
  spots?: boolean;
  style?: any;
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size * 1.2,
          justifyContent: 'flex-end',
          alignItems: 'center',
          transform: [
            {
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -8],
              }),
            },
          ],
        },
        style,
      ]}
    >
      {/* Mushroom Cap */}
      <View
        style={{
          width: size * 0.85,
          height: size * 0.6,
          backgroundColor: capColor,
          borderRadius: size * 0.5,
          borderBottomLeftRadius: size * 0.3,
          borderBottomRightRadius: size * 0.3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.3)',
          overflow: 'visible',
        }}
      >
        {/* Cap spots */}
        {spots && (
          <>
            <View
              style={{
                position: 'absolute',
                width: size * 0.15,
                height: size * 0.15,
                borderRadius: size * 0.075,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                top: '25%',
                left: '20%',
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: size * 0.12,
                height: size * 0.12,
                borderRadius: size * 0.06,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                top: '40%',
                right: '25%',
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: size * 0.1,
                height: size * 0.1,
                borderRadius: size * 0.05,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                top: '15%',
                right: '35%',
              }}
            />
          </>
        )}
        
        {/* Cute face */}
        <View style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: size * 0.12 }}>
            {/* Eyes */}
            <View
              style={{
                width: size * 0.08,
                height: size * 0.08,
                borderRadius: size * 0.04,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              }}
            />
            <View
              style={{
                width: size * 0.08,
                height: size * 0.08,
                borderRadius: size * 0.04,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              }}
            />
          </View>
          {/* Smile */}
          <View
            style={{
              width: size * 0.15,
              height: size * 0.06,
              borderBottomLeftRadius: size * 0.075,
              borderBottomRightRadius: size * 0.075,
              borderWidth: 1.5,
              borderColor: 'rgba(0, 0, 0, 0.5)',
              borderTopWidth: 0,
              marginTop: size * 0.05,
            }}
          />
        </View>
      </View>

      {/* Mushroom Stem */}
      <View
        style={{
          width: size * 0.35,
          height: size * 0.7,
          backgroundColor: color,
          borderRadius: size * 0.2,
          marginTop: -size * 0.1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        {/* Stem texture */}
        <View
          style={{
            position: 'absolute',
            width: '80%',
            height: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            top: '30%',
            left: '10%',
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: '70%',
            height: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            top: '50%',
            left: '15%',
            borderRadius: 1,
          }}
        />
      </View>

      {/* Shadow */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: size * 0.5,
          height: size * 0.08,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: size * 0.25,
          transform: [{ scaleY: 0.3 }],
        }}
      />
    </Animated.View>
  );
};

// Mushroom Cluster Decoration
const MushroomCluster = ({ position = 'left' }: { position?: 'left' | 'right' }) => {
  return (
    <View
      style={{
        position: 'absolute',
        [position]: -20,
        bottom: 20,
        opacity: 0.6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <CartoonMushroom size={40} capColor={COLORS.terracotta} color={COLORS.sage} />
        <CartoonMushroom size={50} capColor={COLORS.coral} color={COLORS.moss} spots={false} />
        <CartoonMushroom size={35} capColor={COLORS.terracotta} color={COLORS.sage} />
      </View>
    </View>
  );
};

// Floating Spores Animation
const FloatingSpores = () => {
  const spores = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 300,
    x: Math.random() * width,
    duration: 3000 + Math.random() * 2000,
  }));

  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
      {spores.map((spore) => (
        <FloatingSpore key={spore.id} delay={spore.delay} x={spore.x} duration={spore.duration} />
      ))}
    </View>
  );
};

const FloatingSpore = ({ delay, x, duration }: { delay: number; x: number; duration: number }) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(animY, {
            toValue: -height,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration * 0.1,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.9,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(animX, {
            toValue: Math.random() * 40 - 20,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(animY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: 0,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.sage,
        opacity: opacity,
        transform: [{ translateY: animY }, { translateX: animX }],
      }}
    />
  );
};

// ============ MUSHROOM INFOGRAPHICS SECTION ============
const MushroomInfographics = () => {
  const [activeTab, setActiveTab] = useState('facts');
  const containerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(containerAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.infographicsSection,
        {
          opacity: containerAnim,
          transform: [
            {
              translateY: containerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Decorative mushrooms */}
      <View style={{ position: 'absolute', top: 20, right: 20, opacity: 0.15 }}>
        <CartoonMushroom size={80} capColor={COLORS.coral} color={COLORS.sage} />
      </View>
      <View style={{ position: 'absolute', bottom: 40, left: 20, opacity: 0.15 }}>
        <CartoonMushroom size={60} capColor={COLORS.terracotta} color={COLORS.moss} spots={false} />
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionBadge}>
          <ThemedText style={styles.sectionLabel}>🍄 MYCOLOGY 101</ThemedText>
        </View>
        <ThemedText style={styles.sectionTitle}>Mushroom Mastery</ThemedText>
        <ThemedText style={styles.sectionDescription}>
          Essential knowledge about the fascinating world of fungi
        </ThemedText>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['facts', 'anatomy', 'types', 'safety'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'facts' && '✨ Fun Facts'}
              {tab === 'anatomy' && '🔬 Anatomy'}
              {tab === 'types' && '📚 Types'}
              {tab === 'safety' && '⚠️ Safety'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'facts' && <FactsTab />}
        {activeTab === 'anatomy' && <AnatomyTab />}
        {activeTab === 'types' && <TypesTab />}
        {activeTab === 'safety' && <SafetyTab />}
      </View>
    </Animated.View>
  );
};

// Fun Facts Tab
const FactsTab = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const facts = [
    {
      id: 1,
      icon: 'leaf',
      title: '5.1M+ Species',
      description: 'Estimated fungal species on Earth',
      color: COLORS.sage,
      stat: '91%',
      subtext: 'Undiscovered',
      emoji: '🌍',
    },
    {
      id: 2,
      icon: 'git-network',
      title: 'Underground Network',
      description: 'Mycelium can span thousands of acres',
      color: COLORS.moss,
      stat: '2,385',
      subtext: 'Acres in Oregon',
      emoji: '🕸️',
    },
    {
      id: 3,
      icon: 'time',
      title: 'Ancient Organisms',
      description: 'Fungi predate plants by millions of years',
      color: COLORS.forest,
      stat: '1.3B',
      subtext: 'Years old',
      emoji: '⏳',
    },
    {
      id: 4,
      icon: 'medical',
      title: 'Medical Marvels',
      description: 'Medicines derived from fungi',
      color: COLORS.olive,
      stat: '40+',
      subtext: 'Pharmaceuticals',
      emoji: '💊',
    },
    {
      id: 5,
      icon: 'flashlight',
      title: "Nature's Nightlights",
      description: 'Bioluminescent mushroom species',
      color: COLORS.terracotta,
      stat: '80+',
      subtext: 'Glowing species',
      emoji: '✨',
    },
    {
      id: 6,
      icon: 'pulse',
      title: 'Fungal Intelligence',
      description: 'Can solve mazes and make decisions',
      color: COLORS.coral,
      stat: '50',
      subtext: 'Neuron-like signals',
      emoji: '🧠',
    },
  ];

  return (
    <View style={styles.tabContent}>
      <View style={styles.factsGrid}>
        {facts.map((fact, index) => (
          <Animated.View
            key={fact.id}
            style={[
              styles.factCard,
              {
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, index % 2 === 0 ? -5 : 5],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.factCardInner, { backgroundColor: COLORS.white }]}>
              <View style={[styles.factEmojiContainer, { backgroundColor: `${fact.color}15` }]}>
                <ThemedText style={styles.factEmoji}>{fact.emoji}</ThemedText>
              </View>
              <View style={styles.factStats}>
                <ThemedText style={[styles.factStat, { color: fact.color }]}>{fact.stat}</ThemedText>
                <ThemedText style={[styles.factSubtext, { color: COLORS.stone }]}>{fact.subtext}</ThemedText>
              </View>
              <ThemedText style={styles.factCardTitle}>{fact.title}</ThemedText>
              <ThemedText style={styles.factCardDescription}>{fact.description}</ThemedText>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// Anatomy Tab
const AnatomyTab = () => {
  const [parts] = useState([
    {
      id: 1,
      name: 'Cap (Pileus)',
      description: 'The umbrella-shaped top that protects gills',
      icon: 'ellipse',
      color: COLORS.sage,
      emoji: '🎩',
      features: ['Protects spores', 'Various shapes', 'Color indicates species'],
    },
    {
      id: 2,
      name: 'Gills (Lamellae)',
      description: 'Thin structures under cap producing spores',
      icon: 'menu',
      color: COLORS.moss,
      emoji: '📊',
      features: ['Spore production', 'Radial pattern', 'Color varies'],
    },
    {
      id: 3,
      name: 'Stem (Stipe)',
      description: 'Supports the cap and transports nutrients',
      icon: 'ellipsis-vertical',
      color: COLORS.forest,
      emoji: '🏛️',
      features: ['Structural support', 'Nutrient transport', 'May have ring'],
    },
    {
      id: 4,
      name: 'Mycelium',
      description: 'Underground network of thread-like cells',
      icon: 'git-network',
      color: COLORS.olive,
      emoji: '🕸️',
      features: ['Absorbs nutrients', 'Massive networks', 'Main organism'],
    },
    {
      id: 5,
      name: 'Volva',
      description: 'Cup-like structure at base of some mushrooms',
      icon: 'ellipsis-horizontal',
      color: COLORS.terracotta,
      emoji: '🏺',
      features: ['Protective cup', 'Found in Amanitas', 'Important ID feature'],
    },
    {
      id: 6,
      name: 'Spores',
      description: 'Microscopic reproductive units',
      icon: 'water',
      color: COLORS.coral,
      emoji: '✨',
      features: ['Billions produced', 'Wind-dispersed', 'Species identification'],
    },
  ]);

  return (
    <View style={styles.tabContent}>
      <View style={styles.anatomyContainer}>
        {/* Large decorative mushroom */}
        <View style={styles.diagramContainer}>
          <CartoonMushroom size={120} capColor={COLORS.coral} color={COLORS.sage} />
          <ThemedText style={styles.diagramLabel}>Mushroom Anatomy</ThemedText>
        </View>

        <View style={styles.partsGrid}>
          {parts.map((part) => (
            <View key={part.id} style={styles.partCard}>
              <View style={[styles.partEmojiContainer, { backgroundColor: `${part.color}15` }]}>
                <ThemedText style={styles.partEmoji}>{part.emoji}</ThemedText>
              </View>
              <ThemedText style={styles.partName}>{part.name}</ThemedText>
              <ThemedText style={styles.partDescription}>{part.description}</ThemedText>
              <View style={styles.featuresContainer}>
                {part.features.map((feature, idx) => (
                  <View key={idx} style={[styles.featureBadge, { backgroundColor: `${part.color}10` }]}>
                    <ThemedText style={[styles.featureText, { color: part.color }]}>• {feature}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Types Tab
const TypesTab = () => {
  const [mushroomTypes] = useState([
    {
      id: 1,
      name: 'Edible',
      description: 'Safe for human consumption',
      examples: ['Button', 'Portobello', 'Shiitake', 'Oyster'],
      color: COLORS.success,
      icon: 'restaurant',
      safety: 'Verified Safe',
      emoji: '🍽️',
    },
    {
      id: 2,
      name: 'Medicinal',
      description: 'Used in traditional medicine',
      examples: ['Reishi', 'Turkey Tail', "Lion's Mane", 'Cordyceps'],
      color: COLORS.moss,
      icon: 'medical',
      safety: 'Therapeutic',
      emoji: '⚕️',
    },
    {
      id: 3,
      name: 'Psychoactive',
      description: 'Contain psychoactive compounds',
      examples: ['Psilocybe', 'Amanita Muscaria', 'Liberty Cap'],
      color: COLORS.forest,
      icon: 'eye',
      safety: 'Controlled Use',
      emoji: '🔬',
    },
    {
      id: 4,
      name: 'Poisonous',
      description: 'Toxic or deadly if consumed',
      examples: ['Death Cap', 'Destroying Angel', 'False Morel'],
      color: COLORS.danger,
      icon: 'skull',
      safety: 'Dangerous',
      emoji: '☠️',
    },
    {
      id: 5,
      name: 'Saprotrophic',
      description: 'Decompose dead organic matter',
      examples: ['Shaggy Mane', 'Ink Cap', 'Parasol'],
      color: COLORS.olive,
      icon: 'reload-circle',
      safety: 'Ecosystem Role',
      emoji: '♻️',
    },
    {
      id: 6,
      name: 'Mycorrhizal',
      description: 'Symbiotic with plant roots',
      examples: ['Chanterelle', 'Porcini', 'Truffle', 'Morel'],
      color: COLORS.terracotta,
      icon: 'git-branch',
      safety: 'Symbiotic',
      emoji: '🤝',
    },
  ]);

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.typesGrid}>
        {mushroomTypes.map((type) => (
          <View key={type.id} style={styles.typeCard}>
            <View style={[styles.typeCardHeader, { backgroundColor: `${type.color}15` }]}>
              <ThemedText style={styles.typeEmoji}>{type.emoji}</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.typeName, { color: type.color }]}>{type.name}</ThemedText>
                <ThemedText style={[styles.typeSafety, { color: COLORS.stone }]}>{type.safety}</ThemedText>
              </View>
            </View>

            <View style={styles.typeCardBody}>
              <ThemedText style={styles.typeDescription}>{type.description}</ThemedText>

              <View style={styles.examplesContainer}>
                <ThemedText style={styles.examplesTitle}>Common Examples:</ThemedText>
                <View style={styles.examplesGrid}>
                  {type.examples.map((example, idx) => (
                    <View key={idx} style={[styles.exampleBadge, { backgroundColor: `${type.color}10` }]}>
                      <ThemedText style={[styles.exampleText, { color: type.color }]}>{example}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Safety Tab
const SafetyTab = () => {
  const [safetyRules] = useState([
    {
      id: 1,
      rule: 'Never Eat Raw',
      description: 'Many edible mushrooms are toxic when raw',
      icon: 'ban',
      severity: 'high',
      emoji: '🚫',
      tips: ['Always cook thoroughly', 'Destroys toxins', 'Improves digestion'],
    },
    {
      id: 2,
      rule: 'Positive ID',
      description: '100% certainty before consumption',
      icon: 'checkmark-circle',
      severity: 'critical',
      emoji: '✅',
      tips: ['Use multiple sources', 'Check all features', 'Compare with look-alikes'],
    },
    {
      id: 3,
      rule: 'Start Small',
      description: 'Test tolerance with small amounts first',
      icon: 'thermometer',
      severity: 'medium',
      emoji: '🧪',
      tips: ['¼ portion first', 'Wait 24 hours', 'Watch for reactions'],
    },
    {
      id: 4,
      rule: 'Avoid Alcohol',
      description: 'Never mix with alcohol consumption',
      icon: 'wine',
      severity: 'high',
      emoji: '🍷',
      tips: ['48-hour gap', 'Inhibits digestion', 'Increases toxicity'],
    },
    {
      id: 5,
      rule: 'Know Look-alikes',
      description: 'Study poisonous species in your area',
      icon: 'eye',
      severity: 'critical',
      emoji: '👁️',
      tips: ['Learn deadly species', 'Note differences', 'When in doubt, throw out'],
    },
    {
      id: 6,
      rule: 'Document Findings',
      description: 'Take photos and notes for expert review',
      icon: 'camera',
      severity: 'medium',
      emoji: '📸',
      tips: ['Multiple angles', 'Include habitat', 'Note spore print'],
    },
  ]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return COLORS.danger;
      case 'high':
        return COLORS.terracotta;
      case 'medium':
        return COLORS.warning;
      default:
        return COLORS.moss;
    }
  };

  return (
    <View style={styles.tabContent}>
      {/* Warning Banner */}
      <Animated.View style={[styles.warningBanner, { transform: [{ scale: pulseAnim }] }]}>
        <ThemedText style={styles.warningEmoji}>⚠️</ThemedText>
        <View style={styles.warningContent}>
          <ThemedText style={styles.warningTitle}>FOR EDUCATIONAL PURPOSES ONLY</ThemedText>
          <ThemedText style={styles.warningText}>Never consume wild mushrooms without expert verification</ThemedText>
        </View>
      </Animated.View>

      <View style={styles.safetyGrid}>
        {safetyRules.map((rule) => {
          const severityColor = getSeverityColor(rule.severity);
          return (
            <View key={rule.id} style={styles.safetyCard}>
              <View style={styles.safetyCardHeader}>
                <View style={[styles.ruleEmojiContainer, { backgroundColor: `${severityColor}15` }]}>
                  <ThemedText style={styles.ruleEmoji}>{rule.emoji}</ThemedText>
                </View>
                <View style={styles.ruleInfo}>
                  <ThemedText style={styles.ruleName}>{rule.rule}</ThemedText>
                  <View style={[styles.severityBadge, { backgroundColor: `${severityColor}15` }]}>
                    <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
                    <ThemedText style={[styles.severityText, { color: severityColor }]}>
                      {rule.severity.toUpperCase()} PRIORITY
                    </ThemedText>
                  </View>
                </View>
              </View>

              <ThemedText style={styles.ruleDescription}>{rule.description}</ThemedText>

              <View style={styles.tipsContainer}>
                <ThemedText style={styles.tipsTitle}>Key Tips:</ThemedText>
                {rule.tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItem}>
                    <View style={[styles.tipDot, { backgroundColor: severityColor }]} />
                    <ThemedText style={styles.tipText}>{tip}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Emergency Info */}
      <View style={styles.emergencyContainer}>
        <ThemedText style={styles.emergencyTitle}>🚨 In Case of Poisoning:</ThemedText>
        <View style={styles.emergencySteps}>
          <View style={styles.emergencyStep}>
            <View style={styles.emergencyNumber}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <ThemedText style={styles.stepText}>Call Poison Control Immediately</ThemedText>
          </View>
          <View style={styles.emergencyStep}>
            <View style={styles.emergencyNumber}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <ThemedText style={styles.stepText}>Save Mushroom Sample</ThemedText>
          </View>
          <View style={styles.emergencyStep}>
            <View style={styles.emergencyNumber}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <ThemedText style={styles.stepText}>Go to Emergency Room</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============ ANIMATED FEATURE ICONS ============

// Machine Learning Recognition Icon
const MachineLearningIcon = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.iconWrapper}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.iconGlow,
          {
            backgroundColor: COLORS.sage,
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.3],
            }),
            transform: [
              {
                scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.3],
                }),
              },
            ],
          },
        ]}
      />

      {/* Main icon */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View style={[styles.iconContainer, { backgroundColor: `${COLORS.sage}20` }]}>
          <Ionicons name="analytics" size={40} color={COLORS.forest} />
        </View>
      </Animated.View>

      {/* Decorative mushroom */}
      <View style={{ position: 'absolute', bottom: -10, right: -10 }}>
        <CartoonMushroom size={30} capColor={COLORS.coral} color={COLORS.sage} />
      </View>
    </View>
  );
};

// Safety Shield Icon
const SafetyIcon = () => {
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.spring(checkAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(checkAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.iconWrapper}>
      <View style={[styles.iconContainer, { backgroundColor: `${COLORS.forest}20` }]}>
        <Ionicons name="shield-checkmark" size={40} color={COLORS.forest} />
      </View>

      {/* Animated checkmark */}
      <Animated.View
        style={{
          position: 'absolute',
          opacity: checkAnim,
          transform: [
            {
              scale: checkAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1.3, 1],
              }),
            },
          ],
        }}
      >
        <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
      </Animated.View>

      {/* Decorative mushroom */}
      <View style={{ position: 'absolute', bottom: -10, left: -10 }}>
        <CartoonMushroom size={30} capColor={COLORS.terracotta} color={COLORS.moss} spots={false} />
      </View>
    </View>
  );
};

// Species Database Icon
const SpeciesIcon = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <View style={[styles.iconContainer, { backgroundColor: `${COLORS.moss}20` }]}>
          <Ionicons name="library" size={40} color={COLORS.forest} />
        </View>
      </Animated.View>

      {/* Decorative mushrooms */}
      <View style={{ position: 'absolute', top: -10, right: -10 }}>
        <CartoonMushroom size={25} capColor={COLORS.coral} color={COLORS.sage} />
      </View>
      <View style={{ position: 'absolute', bottom: -10, right: -10 }}>
        <CartoonMushroom size={25} capColor={COLORS.terracotta} color={COLORS.moss} spots={false} />
      </View>
    </View>
  );
};

// Feature cards with enhanced animated icons
const FEATURES = [
  {
    id: 1,
    IconComponent: MachineLearningIcon,
    title: 'Machine Learning',
    description: 'SnapShroom instantly identifies mushroom species using advanced ML algorithms',
    color: COLORS.sage,
  },
  {
    id: 2,
    IconComponent: SafetyIcon,
    title: 'Safety First',
    description: 'Comprehensive safety information and warnings for every identified species',
    color: COLORS.forest,
  },
  {
    id: 3,
    IconComponent: SpeciesIcon,
    title: '10+ Species',
    description: 'Explore detailed profiles of various mushroom species with scientific data',
    color: COLORS.moss,
  },
];

// Enhanced Step Card
const StepCard = ({ step, index }: { step: { number: string; title: string; description: string }; index: number }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 300;

    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(delay + 1000),
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getStepEmoji = (stepNumber: string) => {
    switch (stepNumber) {
      case '1':
        return '📸';
      case '2':
        return '🔬';
      case '3':
        return '📚';
      default:
        return '🍄';
    }
  };

  const getCapColor = (stepNumber: string) => {
    switch (stepNumber) {
      case '1':
        return COLORS.coral;
      case '2':
        return COLORS.terracotta;
      case '3':
        return COLORS.sage;
      default:
        return COLORS.moss;
    }
  };

  return (
    <Animated.View
      style={[
        styles.stepCard,
        {
          opacity: scaleAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.stepMushroomContainer}>
        <CartoonMushroom size={100} capColor={getCapColor(step.number)} color={COLORS.moss} />
      </View>

      <View style={styles.stepContent}>
        <View style={styles.stepNumberBadge}>
          <ThemedText style={styles.stepNumberText}>{step.number}</ThemedText>
        </View>
        <ThemedText style={styles.stepEmoji}>{getStepEmoji(step.number)}</ThemedText>
        <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
        <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
      </View>
    </Animated.View>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const { user, isLoading: authLoading, logout } = useAuth();
  const isLoggedIn = !!user;

  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  const handleCameraPress = () => {
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'Please log in to use the camera feature', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    router.push('/(tabs)/camera');
  };

  const handleInfoPress = () => {
    Alert.alert(
      'About SnapShroom',
      'SnapShroom is a Machine Learning-powered mushroom identification app that helps you safely identify mushrooms using your phone camera.\n\n⚠️ WARNING: This app is for educational purposes only. Never consume mushrooms based solely on app identification.',
      [{ text: 'OK' }]
    );
  };

  const handleTestConnection = async () => {
    if (!isLoggedIn) return;
    setConnectionStatus('testing');
    setConnectionMessage('Testing connection...');
    try {
      const connected = await testConnection();
      setConnectionStatus(connected ? 'connected' : 'failed');
      setConnectionMessage(connected ? 'Backend connection successful' : 'Backend not responding');
    } catch (error: any) {
      setConnectionStatus('failed');
      setConnectionMessage(`Connection failed: ${error.message}`);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <CartoonMushroom size={100} capColor={COLORS.coral} color={COLORS.sage} />
          <ThemedText style={styles.loadingText}>Loading SnapShroom...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating spores background */}
      <FloatingSpores />

      {/* Floating Header */}
      <Animated.View
        style={[
          styles.floatingHeader,
          {
            backgroundColor: headerOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(250, 248, 243, 0)', 'rgba(250, 248, 243, 0.98)'],
            }),
          },
        ]}
      >
        <View style={styles.headerContent}>
          {isLoggedIn ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <HamburgerMenu />
              <NotificationDropdown iconColor={COLORS.forest} />
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={styles.logoContainer}>
            <ThemedText style={styles.logoEmoji}>🍄</ThemedText>
            <ThemedText style={styles.logoText}>SnapShroom</ThemedText>
          </View>
          {!isLoggedIn ? (
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
              <LinearGradient colors={[COLORS.sage, COLORS.forest]} style={styles.loginButtonGradient}>
                <Ionicons name="log-in" size={14} color={COLORS.white} />
                <ThemedText style={styles.loginButtonText}>Login</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero Section - Reduced height */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.heroImageContainer, { opacity: fadeAnim }]}>
            <Image source={HERO_SLIDES[currentSlide]} style={styles.heroImage} contentFit="cover" transition={500} />
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(63, 73, 65, 0.85)']}
              style={styles.heroGradient}
            />
          </Animated.View>

          <View style={styles.heroContent}>
            <View style={styles.welcomeBadge}>
              <ThemedText style={styles.welcomeEmoji}>
                {isLoggedIn ? '👋' : '🌟'}
              </ThemedText>
              <ThemedText style={styles.welcomeText} numberOfLines={1}>
                {isLoggedIn ? `Welcome, ${user?.name || user?.username || 'Explorer'}` : 'Discover the World of Fungi'}
              </ThemedText>
            </View>

            <ThemedText style={styles.heroTitle}>
              Discover & Identify{'\n'}Mushrooms with SnapShroom
            </ThemedText>

            <ThemedText style={styles.heroSubtitle}>
              Machine Learning-powered mushroom identification for enthusiasts and foragers
            </ThemedText>

            <View style={styles.heroActions}>
              {isLoggedIn ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleCameraPress}>
                  <LinearGradient colors={[COLORS.sage, COLORS.forest]} style={styles.buttonGradient}>
                    <Ionicons name="camera" size={20} color={COLORS.white} />
                    <ThemedText style={styles.primaryButtonText}>Start Identifying</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleLoginPress}>
                  <LinearGradient colors={[COLORS.sage, COLORS.forest]} style={styles.buttonGradient}>
                    <Ionicons name="person" size={20} color={COLORS.white} />
                    <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.secondaryButton} onPress={handleInfoPress}>
                <ThemedText style={styles.secondaryButtonText}>Learn More</ThemedText>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Slide Indicators */}
            <View style={styles.slideIndicators}>
              {HERO_SLIDES.map((_, index) => (
                <View key={index} style={[styles.indicator, currentSlide === index && styles.activeIndicator]} />
              ))}
            </View>
          </View>

          {/* Decorative mushrooms in hero */}
          <View style={{ position: 'absolute', bottom: 80, left: 20, opacity: 0.3 }}>
            <CartoonMushroom size={60} capColor={COLORS.coral} color={COLORS.sage} />
          </View>
          <View style={{ position: 'absolute', bottom: 60, right: 30, opacity: 0.3 }}>
            <CartoonMushroom size={50} capColor={COLORS.terracotta} color={COLORS.moss} spots={false} />
          </View>
        </View>

        {/* Stats Bar - Reduced padding */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statEmoji}>🍄</ThemedText>
            <ThemedText style={styles.statNumber}>10</ThemedText>
            <ThemedText style={styles.statLabel}>Species</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statEmoji}>🔬</ThemedText>
            <ThemedText style={styles.statNumber}>ML-Powered</ThemedText>
            <ThemedText style={styles.statLabel}>Identification</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statEmoji}>🛡️</ThemedText>
            <ThemedText style={styles.statNumber}>Safety</ThemedText>
            <ThemedText style={styles.statLabel}>First Approach</ThemedText>
          </View>
        </View>

        {/* Mushroom Infographics Section - Reduced padding */}
        <MushroomInfographics />

        {/* Features Section - Reduced padding */}
        <View style={styles.featuresSection}>
          {/* Decorative mushroom cluster */}
          <MushroomCluster position="left" />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <ThemedText style={styles.sectionLabel}>✨ FEATURES</ThemedText>
            </View>
            <ThemedText style={styles.sectionTitle}>Why Choose SnapShroom</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Advanced Machine Learning meets comprehensive mushroom knowledge
            </ThemedText>
          </View>

          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => {
              const IconComponent = feature.IconComponent;
              return (
                <View key={feature.id} style={styles.featureCard}>
                  <IconComponent />
                  <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                  <ThemedText style={styles.featureDescription}>{feature.description}</ThemedText>
                </View>
              );
            })}
          </View>

          {/* Decorative mushroom cluster */}
          <MushroomCluster position="right" />
        </View>

        {/* How It Works Section - Reduced padding */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <ThemedText style={styles.sectionLabel}>🎯 HOW IT WORKS</ThemedText>
            </View>
            <ThemedText style={styles.sectionTitle}>Three Simple Steps</ThemedText>
          </View>

          <View style={styles.stepsContainer}>
            {[
              {
                number: '1',
                title: 'Take a Photo',
                description: 'Capture clear images of the mushroom from multiple angles for best results',
              },
              {
                number: '2',
                title: 'Machine Learning Analysis',
                description: 'Our ML algorithm instantly analyzes and identifies the species',
              },
              {
                number: '3',
                title: 'Learn & Explore',
                description: 'Get detailed information, safety tips, and scientific data',
              },
            ].map((step, index) => (
              <StepCard key={step.number} step={step} index={index} />
            ))}
          </View>
        </View>

        {/* Call to Action Section - Reduced padding */}
        {!isLoggedIn && (
          <View style={styles.ctaSection}>
            <View style={styles.ctaCard}>
              <View style={styles.ctaMushroomLeft}>
                <CartoonMushroom size={80} capColor={COLORS.coral} color={COLORS.sage} />
              </View>
              <View style={styles.ctaMushroomRight}>
                <CartoonMushroom size={70} capColor={COLORS.terracotta} color={COLORS.moss} spots={false} />
              </View>

              <View style={styles.ctaContent}>
                <ThemedText style={styles.ctaEmoji}>🚀</ThemedText>
                <ThemedText style={styles.ctaTitle}>Ready to Start Your Mushroom Journey?</ThemedText>
                <ThemedText style={styles.ctaDescription}>
                  Join thousands of mushroom enthusiasts who use SnapShroom to safely identify and learn about fungi
                </ThemedText>
                <TouchableOpacity style={styles.ctaButton} onPress={handleLoginPress}>
                  <View style={styles.ctaButtonInner}>
                    <Ionicons name="rocket" size={20} color={COLORS.forest} />
                    <ThemedText style={styles.ctaButtonText}>Create Free Account</ThemedText>
                  </View>
                </TouchableOpacity>
                <ThemedText style={styles.ctaNote}>No credit card required • Free forever</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Safety Notice - Reduced padding */}
        <View style={styles.safetySection}>
          <View style={styles.safetyCard}>
            <ThemedText style={styles.safetyEmoji}>⚠️</ThemedText>
            <View style={styles.safetyContent}>
              <ThemedText style={styles.safetyTitle}>Safety First</ThemedText>
              <ThemedText style={styles.safetyText}>
                Never consume any mushroom based solely on app identification. Always consult multiple sources and
                experts before consuming wild mushrooms. This app is for educational purposes only.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* System Status - Reduced padding */}
        {isLoggedIn && (
          <View style={styles.systemSection}>
            <View style={styles.systemCard}>
              <View style={styles.systemHeader}>
                <View style={styles.systemTitleContainer}>
                  <ThemedText style={styles.systemEmoji}>📡</ThemedText>
                  <ThemedText style={styles.systemTitle}>System Status</ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    connectionStatus === 'connected' && styles.statusConnected,
                    connectionStatus === 'failed' && styles.statusFailed,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      connectionStatus === 'connected' && styles.dotConnected,
                      connectionStatus === 'failed' && styles.dotFailed,
                    ]}
                  />
                  <ThemedText style={styles.statusText}>
                    {connectionStatus === 'connected' ? 'Online' : connectionStatus === 'failed' ? 'Offline' : 'Ready'}
                  </ThemedText>
                </View>
              </View>

              {connectionMessage ? <ThemedText style={styles.systemMessage}>{connectionMessage}</ThemedText> : null}

              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestConnection}
                disabled={connectionStatus === 'testing'}
              >
                <ThemedText style={styles.testButtonText}>
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer - Reduced padding */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <ThemedText style={styles.footerEmoji}>🍄</ThemedText>
              <ThemedText style={styles.footerTitle}>SnapShroom</ThemedText>
              <ThemedText style={styles.footerTagline}>Machine Learning-Powered Mushroom Identification</ThemedText>
            </View>

            <View style={styles.footerMushroomRow}>
              <CartoonMushroom size={40} capColor={COLORS.coral} color={COLORS.sage} />
              <CartoonMushroom size={45} capColor={COLORS.terracotta} color={COLORS.moss} spots={false} />
              <CartoonMushroom size={40} capColor={COLORS.coral} color={COLORS.sage} />
            </View>

            <ThemedText style={styles.copyright}>© 2026 SnapShroom. All rights reserved.</ThemedText>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.charcoal,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },

  // Floating Header - Reduced padding
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: isSmallScreen ? 40 : 45,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cloud,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.forest,
    letterSpacing: -0.5,
  },
  loginButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 80,
    shadowColor: COLORS.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Hero Section - Reduced height
  heroSection: {
    height: isSmallScreen ? height * 0.75 : height * 0.78,
    position: 'relative',
  },
  heroImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: isSmallScreen ? 40 : 35,
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    marginBottom: SPACING.md,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeEmoji: {
    fontSize: 16,
  },
  welcomeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  heroTitle: {
    fontSize: isSmallScreen ? 28 : 40,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: isSmallScreen ? 34 : 48,
    marginBottom: SPACING.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: isSmallScreen ? 14 : 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: isSmallScreen ? 20 : 22,
    marginBottom: SPACING.lg,
    maxWidth: '95%',
  },
  heroActions: {
    flexDirection: 'column',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  slideIndicators: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeIndicator: {
    backgroundColor: COLORS.white,
    width: 24,
  },

  // Stats Bar - Reduced padding
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cloud,
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statEmoji: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '800',
    color: COLORS.forest,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.stone,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.cloud,
  },

  // Infographics Section - Reduced padding
  infographicsSection: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.sand,
    position: 'relative',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  sectionBadge: {
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cloud,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.forest,
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 24 : 32,
    fontWeight: '800',
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: isSmallScreen ? 14 : 16,
    color: COLORS.stone,
    textAlign: 'center',
    maxWidth: 540,
    lineHeight: 22,
  },

  // Tab Navigation - Reduced padding
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 4,
    borderRadius: 16,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cloud,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: COLORS.sage,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.stone,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // Content Area
  contentArea: {
    minHeight: 450,
  },
  tabContent: {
    flex: 1,
  },

  // Facts Tab - Adjusted sizing
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  factCard: {
    width: isSmallScreen ? '48%' : '31%',
    minWidth: 140,
    maxWidth: 180,
    borderRadius: 18,
    overflow: 'visible',
  },
  factCardInner: {
    padding: SPACING.lg,
    minHeight: 170,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cloud,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  factEmojiContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  factEmoji: {
    fontSize: 24,
  },
  factStats: {
    marginBottom: SPACING.md,
  },
  factStat: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  factSubtext: {
    fontSize: 10,
    fontWeight: '600',
  },
  factCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
  },
  factCardDescription: {
    fontSize: 12,
    color: COLORS.stone,
    lineHeight: 18,
  },

  // Anatomy Tab - Adjusted sizing
  anatomyContainer: {
    flex: 1,
  },
  diagramContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cloud,
  },
  diagramLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.stone,
    marginTop: SPACING.md,
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  partCard: {
    width: isSmallScreen ? '48%' : '31%',
    minWidth: 140,
    maxWidth: 180,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cloud,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  partEmojiContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  partEmoji: {
    fontSize: 24,
  },
  partName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
  },
  partDescription: {
    fontSize: 12,
    color: COLORS.stone,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  featuresContainer: {
    gap: SPACING.xs,
  },
  featureBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 9,
    fontWeight: '500',
  },

  // Types Tab - Adjusted sizing
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  typeCard: {
    width: isSmallScreen ? '48%' : '31%',
    minWidth: 140,
    maxWidth: 180,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cloud,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    backgroundColor: COLORS.white,
  },
  typeCardHeader: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  typeEmoji: {
    fontSize: 28,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  typeSafety: {
    fontSize: 10,
    fontWeight: '600',
  },
  typeCardBody: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  typeDescription: {
    fontSize: 12,
    color: COLORS.stone,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  examplesContainer: {
    marginBottom: SPACING.md,
  },
  examplesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 6,
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  exampleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exampleText: {
    fontSize: 9,
    fontWeight: '500',
  },

  // Safety Tab - Adjusted sizing
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: '#FEF2F2',
    padding: SPACING.lg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FCA5A5',
    marginBottom: SPACING.lg,
  },
  warningEmoji: {
    fontSize: 28,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.danger,
    marginBottom: SPACING.xs,
  },
  warningText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '500',
    lineHeight: 16,
  },
  safetyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  safetyCard: {
    width: isSmallScreen ? '100%' : '48%',
    minWidth: 260,
    maxWidth: 380,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cloud,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  safetyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  ruleEmojiContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleEmoji: {
    fontSize: 24,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 8,
    fontWeight: '700',
  },
  ruleDescription: {
    fontSize: 13,
    color: COLORS.stone,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  tipsContainer: {
    backgroundColor: COLORS.sand,
    padding: SPACING.md,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.charcoal,
    marginBottom: 6,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tipText: {
    fontSize: 10,
    color: COLORS.stone,
    flex: 1,
    lineHeight: 15,
  },
  emergencyContainer: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.lg,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  emergencyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  emergencySteps: {
    gap: SPACING.md,
  },
  emergencyStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
  },
  emergencyNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#92400E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  stepText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },

  // Features Section - Reduced padding
  featuresSection: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  featuresGrid: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: SPACING.lg,
    justifyContent: 'center',
    alignItems: isSmallScreen ? 'stretch' : 'flex-start',
  },
  featureCard: {
    flex: isSmallScreen ? 0 : 1,
    maxWidth: isSmallScreen ? '100%' : 300,
    backgroundColor: COLORS.sand,
    padding: SPACING.lg,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.cloud,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 20,
  },

  // How It Works Section - Reduced padding
  howItWorksSection: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.sand,
  },
  stepsContainer: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: SPACING.lg,
    justifyContent: 'center',
    alignItems: isSmallScreen ? 'stretch' : 'flex-start',
  },
  stepCard: {
    flex: isSmallScreen ? 0 : 1,
    maxWidth: isSmallScreen ? '100%' : 280,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.cloud,
  },
  stepMushroomContainer: {
    marginBottom: SPACING.lg,
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.forest,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.forest,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  stepEmoji: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 13,
    color: COLORS.stone,
    lineHeight: 20,
    textAlign: 'center',
  },

  // CTA Section - Reduced padding
  ctaSection: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  ctaCard: {
    backgroundColor: COLORS.sage,
    borderRadius: 24,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  ctaMushroomLeft: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    opacity: 0.3,
  },
  ctaMushroomRight: {
    position: 'absolute',
    top: 15,
    right: 15,
    opacity: 0.3,
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaEmoji: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  ctaTitle: {
    fontSize: isSmallScreen ? 22 : 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
    maxWidth: 500,
  },
  ctaButton: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    width: '100%',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.forest,
  },
  ctaNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Safety Section - Reduced padding
  safetySection: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.sand,
  },
  safetyCard: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderRadius: 18,
    gap: SPACING.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  safetyEmoji: {
    fontSize: 36,
    flexShrink: 0,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: SPACING.sm,
  },
  safetyText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },

  // System Section - Reduced padding
  systemSection: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  systemCard: {
    backgroundColor: COLORS.sand,
    padding: SPACING.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cloud,
  },
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  systemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  systemEmoji: {
    fontSize: 22,
  },
  systemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.charcoal,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    backgroundColor: `${COLORS.stone}15`,
  },
  statusConnected: {
    backgroundColor: `${COLORS.success}15`,
  },
  statusFailed: {
    backgroundColor: `${COLORS.danger}15`,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.stone,
  },
  dotConnected: {
    backgroundColor: COLORS.success,
  },
  dotFailed: {
    backgroundColor: COLORS.danger,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.stone,
  },
  systemMessage: {
    fontSize: 12,
    color: COLORS.stone,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  testButton: {
    backgroundColor: COLORS.forest,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },

  // Footer - Reduced padding
  footer: {
    backgroundColor: COLORS.charcoal,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerBrand: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  footerEmoji: {
    fontSize: 40,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: SPACING.sm,
    marginBottom: 2,
  },
  footerTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  footerMushroomRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  copyright: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});