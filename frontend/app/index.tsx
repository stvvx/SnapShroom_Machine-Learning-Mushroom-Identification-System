import { Image } from 'expo-image';
import { TouchableOpacity, StyleSheet, Alert, ScrollView, View, Dimensions, Animated, Linking } from 'react-native';
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
import { styles } from '../styles/index.styles';

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

// Spacing system
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
const StepCard = ({ step, index }: { step: { number: string; title: string; description: string; icon: string }; index: number }) => {
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
        <View style={styles.stepIconContainer}>
          <Ionicons name={step.icon as any} size={32} color={COLORS.forest} />
        </View>
        <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
        <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
      </View>
    </Animated.View>
  );
};
// ============ PART 2: MUSHROOM INFOGRAPHICS SECTION ============

// CONTINUE FROM PART 1...

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
          <Ionicons name="book-outline" size={14} color={COLORS.forest} style={{ marginRight: 6 }} />
          <ThemedText style={styles.sectionLabel}>MYCOLOGY 101</ThemedText>
        </View>
        <ThemedText style={styles.sectionTitle}>Mushroom Mastery</ThemedText>
        <ThemedText style={styles.sectionDescription}>
          Essential knowledge about the fascinating world of fungi
        </ThemedText>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'facts', label: 'Fun Facts', icon: 'sparkles-outline' },
          { key: 'anatomy', label: 'Anatomy', icon: 'fitness-outline' },
          { key: 'types', label: 'Types', icon: 'albums-outline' },
          { key: 'safety', label: 'Safety', icon: 'alert-circle-outline' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={activeTab === tab.key ? COLORS.white : COLORS.stone} 
              style={{ marginRight: 4 }}
            />
            <ThemedText style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
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
      icon: 'globe-outline',
      title: '5.1M+ Species',
      description: 'Estimated fungal species on Earth',
      color: COLORS.sage,
      stat: '91%',
      subtext: 'Undiscovered',
    },
    {
      id: 2,
      icon: 'git-network-outline',
      title: 'Underground',
      description: 'Mycelium can span thousands of acres',
      color: COLORS.moss,
      stat: '2,385',
      subtext: 'Acres in Oregon',
    },
    {
      id: 3,
      icon: 'time-outline',
      title: 'Ancient Organisms',
      description: 'Fungi predate plants by millions of years',
      color: COLORS.forest,
      stat: '1.3B',
      subtext: 'Years old',
    },
    {
      id: 4,
      icon: 'medical-outline',
      title: 'Medical Marvels',
      description: 'Medicines derived from fungi',
      color: COLORS.olive,
      stat: '40+',
      subtext: 'Pharmaceuticals',
    },
    {
      id: 5,
      icon: 'flashlight-outline',
      title: "Nature's Nightlights",
      description: 'Bioluminescent mushroom species',
      color: COLORS.terracotta,
      stat: '80+',
      subtext: 'Glowing species',
    },
    {
      id: 6,
      icon: 'pulse-outline',
      title: 'Fungal Intelligence',
      description: 'Can solve mazes and make decisions',
      color: COLORS.coral,
      stat: '50',
      subtext: 'Neuron-like signals',
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
              <View style={[styles.factIconContainer, { backgroundColor: `${fact.color}15` }]}>
                <Ionicons name={fact.icon as any} size={28} color={fact.color} />
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
      icon: 'umbrella-outline',
      color: COLORS.sage,
      features: ['Protects spores', 'Various shapes', 'Color indicates species'],
    },
    {
      id: 2,
      name: 'Gills (Lamellae)',
      description: 'Thin structures under cap producing spores',
      icon: 'reorder-four-outline',
      color: COLORS.moss,
      features: ['Spore production', 'Radial pattern', 'Color varies'],
    },
    {
      id: 3,
      name: 'Stem (Stipe)',
      description: 'Supports the cap and transports nutrients',
      icon: 'remove-outline',
      color: COLORS.forest,
      features: ['Structural support', 'Nutrient transport', 'May have ring'],
    },
    {
      id: 4,
      name: 'Mycelium',
      description: 'Underground network of thread-like cells',
      icon: 'git-network-outline',
      color: COLORS.olive,
      features: ['Absorbs nutrients', 'Massive networks', 'Main organism'],
    },
    {
      id: 5,
      name: 'Volva',
      description: 'Cup-like structure at base of some mushrooms',
      icon: 'wine-outline',
      color: COLORS.terracotta,
      features: ['Protective cup', 'Found in Amanitas', 'Important ID feature'],
    },
    {
      id: 6,
      name: 'Spores',
      description: 'Microscopic reproductive units',
      icon: 'water-outline',
      color: COLORS.coral,
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
              <View style={[styles.partIconContainer, { backgroundColor: `${part.color}15` }]}>
                <Ionicons name={part.icon as any} size={28} color={part.color} />
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
      icon: 'restaurant-outline',
      safety: 'Verified Safe',
    },
    {
      id: 2,
      name: 'Medicinal',
      description: 'Used in traditional medicine',
      examples: ['Reishi', 'Turkey Tail', "Lion's Mane", 'Cordyceps'],
      color: COLORS.moss,
      icon: 'medical-outline',
      safety: 'Therapeutic',
    },
    {
      id: 3,
      name: 'Narcotic',
      description: 'Contain psychoactive compounds',
      examples: ['Psilocybe', 'Amanita Muscaria', 'Liberty Cap'],
      color: COLORS.forest,
      icon: 'eye-outline',
      safety: 'Controlled Use',
    },
    {
      id: 4,
      name: 'Poisonous',
      description: 'Toxic or deadly if consumed',
      examples: ['Death Cap', 'Destroying Angel', 'False Morel'],
      color: COLORS.danger,
      icon: 'skull-outline',
      safety: 'Dangerous',
    },
    {
      id: 5,
      name: 'Scavenging',
      description: 'Decompose dead organic matter',
      examples: ['Shaggy Mane', 'Ink Cap', 'Parasol'],
      color: COLORS.olive,
      icon: 'reload-circle-outline',
      safety: 'Ecosystem Role',
    },
    {
      id: 6,
      name: 'Fungal',
      description: 'Symbiotic with plant roots',
      examples: ['Chanterelle', 'Porcini', 'Truffle', 'Morel'],
      color: COLORS.terracotta,
      icon: 'git-branch-outline',
      safety: 'Symbiotic',
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
              <View style={[styles.typeIconContainer, { backgroundColor: `${type.color}25` }]}>
                <Ionicons name={type.icon as any} size={32} color={type.color} />
              </View>
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
      icon: 'ban-outline',
      severity: 'high',
      tips: ['Always cook thoroughly', 'Destroys toxins', 'Improves digestion'],
    },
    {
      id: 2,
      rule: 'Positive ID',
      description: '100% certainty before consumption',
      icon: 'checkmark-circle-outline',
      severity: 'critical',
      tips: ['Use multiple sources', 'Check all features', 'Compare with look-alikes'],
    },
    {
      id: 3,
      rule: 'Start Small',
      description: 'Test tolerance with small amounts first',
      icon: 'thermometer-outline',
      severity: 'medium',
      tips: ['¼ portion first', 'Wait 24 hours', 'Watch for reactions'],
    },
    {
      id: 4,
      rule: 'Avoid Alcohol',
      description: 'Never mix with alcohol consumption',
      icon: 'wine-outline',
      severity: 'high',
      tips: ['48-hour gap', 'Inhibits digestion', 'Increases toxicity'],
    },
    {
      id: 5,
      rule: 'Know Look-alikes',
      description: 'Study poisonous species in your area',
      icon: 'eye-outline',
      severity: 'critical',
      tips: ['Learn deadly species', 'Note differences', 'When in doubt, throw out'],
    },
    {
      id: 6,
      rule: 'Document Findings',
      description: 'Take photos and notes for expert review',
      icon: 'camera-outline',
      severity: 'medium',
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
        <Ionicons name="warning-outline" size={32} color={COLORS.danger} />
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
                <View style={[styles.ruleIconContainer, { backgroundColor: `${severityColor}15` }]}>
                  <Ionicons name={rule.icon as any} size={28} color={severityColor} />
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md }}>
          <Ionicons name="alert-circle" size={24} color="#92400E" style={{ marginRight: 8 }} />
          <ThemedText style={styles.emergencyTitle}>In Case of Poisoning:</ThemedText>
        </View>
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
// ============ PART 3: MAIN COMPONENT ============

// CONTINUE FROM PART 2...

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
    router.push('/(tabs)/about');
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
            <Ionicons name="leaf" size={24} color={COLORS.forest} />
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
        {/* Hero Section */}
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
              <Ionicons 
                name={isLoggedIn ? 'person-circle-outline' : 'sparkles-outline'} 
                size={18} 
                color={COLORS.white} 
              />
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
                <ThemedText style={styles.secondaryButtonText}>About Us</ThemedText>
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

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Ionicons name="leaf-outline" size={28} color={COLORS.forest} />
            <ThemedText style={styles.statNumber}>10</ThemedText>
            <ThemedText style={styles.statLabel}>Species</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="analytics-outline" size={28} color={COLORS.forest} />
            <ThemedText style={styles.statNumber}>ML-Powered</ThemedText>
            <ThemedText style={styles.statLabel}>Identification</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="shield-checkmark-outline" size={28} color={COLORS.forest} />
            <ThemedText style={styles.statNumber}>Safety</ThemedText>
            <ThemedText style={styles.statLabel}>First Approach</ThemedText>
          </View>
        </View>

        {/* Mushroom Resources Section */}
        <View style={styles.resourcesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Ionicons name="library-outline" size={14} color={COLORS.forest} style={{ marginRight: 6 }} />
              <ThemedText style={styles.sectionLabel}>RESOURCES</ThemedText>
            </View>
            <ThemedText style={styles.sectionTitle}>Learn More About Mushrooms</ThemedText>
            <ThemedText style={styles.sectionDescription}>
              Explore trusted sources to deepen your mycology knowledge
            </ThemedText>
          </View>

          <View style={styles.resourcesGrid}>
            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => Linking.openURL('https://www.mushroomexpert.com/')}
            >
              <View style={[styles.resourceIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="book" size={24} color="#4CAF50" />
              </View>
              <View style={styles.resourceContent}>
                <ThemedText style={styles.resourceTitle}>MushroomExpert</ThemedText>
                <ThemedText style={styles.resourceDesc}>Comprehensive identification guides & photos</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => Linking.openURL('https://www.inaturalist.org/taxa/47170-Fungi')}
            >
              <View style={[styles.resourceIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="globe" size={24} color="#FF9800" />
              </View>
              <View style={styles.resourceContent}>
                <ThemedText style={styles.resourceTitle}>iNaturalist Fungi</ThemedText>
                <ThemedText style={styles.resourceDesc}>Community-powered species observations</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => Linking.openURL('https://www.mykoweb.com/')}
            >
              <View style={[styles.resourceIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="camera" size={24} color="#2196F3" />
              </View>
              <View style={styles.resourceContent}>
                <ThemedText style={styles.resourceTitle}>MykoWeb</ThemedText>
                <ThemedText style={styles.resourceDesc}>California fungi photo gallery & info</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => Linking.openURL('https://www.first-nature.com/fungi/')}
            >
              <View style={[styles.resourceIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="leaf" size={24} color="#9C27B0" />
              </View>
              <View style={styles.resourceContent}>
                <ThemedText style={styles.resourceTitle}>First Nature</ThemedText>
                <ThemedText style={styles.resourceDesc}>UK & European fungi identification</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => Linking.openURL('https://www.shroomery.org/')}
            >
              <View style={[styles.resourceIcon, { backgroundColor: '#ECEFF1' }]}>
                <Ionicons name="people" size={24} color="#607D8B" />
              </View>
              <View style={styles.resourceContent}>
                <ThemedText style={styles.resourceTitle}>Shroomery</ThemedText>
                <ThemedText style={styles.resourceDesc}>Active mycology community & forums</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceCard}
              onPress={() => Linking.openURL('https://namyco.org/')}
            >
              <View style={[styles.resourceIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="school" size={24} color="#388E3C" />
              </View>
              <View style={styles.resourceContent}>
                <ThemedText style={styles.resourceTitle}>NAMA</ThemedText>
                <ThemedText style={styles.resourceDesc}>North American Mycological Association</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mushroom Infographics Section */}
        <MushroomInfographics />

        {/* Features Section */}
        <View style={styles.featuresSection}>
          {/* Decorative mushroom cluster */}
          <MushroomCluster position="left" />

          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Ionicons name="star-outline" size={14} color={COLORS.forest} style={{ marginRight: 6 }} />
              <ThemedText style={styles.sectionLabel}>FEATURES</ThemedText>
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

        {/* How It Works Section */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Ionicons name="bulb-outline" size={14} color={COLORS.forest} style={{ marginRight: 6 }} />
              <ThemedText style={styles.sectionLabel}>HOW IT WORKS</ThemedText>
            </View>
            <ThemedText style={styles.sectionTitle}>Three Simple Steps</ThemedText>
          </View>

          <View style={styles.stepsContainer}>
            {[
              {
                number: '1',
                title: 'Take a Photo',
                description: 'Capture clear images of the mushroom from multiple angles for best results',
                icon: 'camera-outline',
              },
              {
                number: '2',
                title: 'Machine Learning Analysis',
                description: 'Our ML algorithm instantly analyzes and identifies the species',
                icon: 'analytics-outline',
              },
              {
                number: '3',
                title: 'Learn & Explore',
                description: 'Get detailed information, safety tips, and scientific data',
                icon: 'book-outline',
              },
            ].map((step, index) => (
              <StepCard key={step.number} step={step} index={index} />
            ))}
          </View>
        </View>

        {/* Call to Action Section */}
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
                <Ionicons name="rocket-outline" size={48} color={COLORS.white} />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={16} color="rgba(255, 255, 255, 0.8)" />
                  <ThemedText style={styles.ctaNote}>No credit card required • Free forever</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Safety Notice */}
        <View style={styles.safetySection}>
          <View style={styles.safetyCard}>
            <Ionicons name="warning-outline" size={40} color="#92400E" />
            <View style={styles.safetyContent}>
              <ThemedText style={styles.safetyTitle}>Safety First</ThemedText>
              <ThemedText style={styles.safetyText}>
                Never consume any mushroom based solely on app identification. Always consult multiple sources and
                experts before consuming wild mushrooms. This app is for educational purposes only.
              </ThemedText>
            </View>
          </View>
        </View>

        {/* System Status */}
        {isLoggedIn && (
          <View style={styles.systemSection}>
            <View style={styles.systemCard}>
              <View style={styles.systemHeader}>
                <View style={styles.systemTitleContainer}>
                  <Ionicons name="hardware-chip-outline" size={24} color={COLORS.charcoal} />
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

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <Ionicons name="leaf" size={48} color={COLORS.white} />
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

