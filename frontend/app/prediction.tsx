import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { analyzeMushroom, searchSpecies } from '@/utils/api';
import { generateMushroomLocationMap } from '@/utils/map-generator';
import { getMushroomLocations } from '@/utils/mushroom-locations';

// Conditionally import WebView only for native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView not available');
  }
}

const { width } = Dimensions.get('window');

interface PredictionResult {
  timestamp: string;
  image_analysis: {
    species: any;
    toxicity: any;
    habitat: any;
  };
  risk_assessment: any;
  recommendations: string[];
  safety_actions: string[];
}

interface MushroomData {
  mushroom_id: string;
  english_name: string;
  local_name: string;
  scientific_name: string;
  edible: string;
  poisonous: string;
  location_region: string;
  location_province: string;
  habitat: string;
  cap_color: string;
  cap_size_cm: string;
  gills_present: string;
  gills_color: string;
  stem_color: string;
  stem_length_cm: string;
  size_reference: string;
  spore_print_color: string;
  texture: string;
  season_month: string;
  cultivated: string;
  wild: string;
  notes: string;
}

interface BackendClassification {
  label?: string;
  confidence?: number;
  toxicity_level?: string;
}

interface BackendDetection {
  found?: boolean;
  confidence?: number;
  prediction?: string;
}

interface BackendResult {
  detection?: BackendDetection;
  classification?: BackendClassification;
  success?: boolean;
  message?: string;
  [key: string]: any;
}

interface DetectionStatus extends BackendDetection {
  message?: string;
}

export default function PredictionScreen() {
  const { imageUri, imageBase64, cloudinaryUrl } = useLocalSearchParams();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mushroomData, setMushroomData] = useState<MushroomData | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapHtml, setMapHtml] = useState<string>('');
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus | null>(null);
  
  // Ensure URLs are strings (useLocalSearchParams can return string or string[])
  const normalizeUrl = (url: string | string[] | undefined): string | undefined => {
    if (Array.isArray(url)) return url[0];
    return url;
  };

  const normalizedImageUri = normalizeUrl(imageUri as any);
  const normalizedImageBase64 = normalizeUrl(imageBase64 as any);
  const normalizedCloudinaryUrl = normalizeUrl(cloudinaryUrl as any);

  // Use cloudinaryUrl if available (persistent), otherwise fall back to imageUri
  const displayImageUrl = normalizedCloudinaryUrl || normalizedImageUri;

  // Analyze image once loaded
  useEffect(() => {
    if (normalizedImageBase64) {
      analyzeImage();
    }
  }, [normalizedImageBase64]);

  // Fetch mushroom data from database when result is available
  useEffect(() => {
    if (result?.image_analysis?.species) {
      fetchMushroomFromDatabase(result.image_analysis.species.english_name || result.image_analysis.species.species);
    }
  }, [result]);

  // Generate map when mushroom data is available
  useEffect(() => {
    if (mushroomData) {
      generateMap();
    }
  }, [mushroomData]);

  const fetchMushroomFromDatabase = async (detectedSpeciesName: string) => {
    try {
      console.log('🔍 Fetching mushroom data from database:', detectedSpeciesName);
      
      // Clean up species name (remove "Mushroom" suffix for better matching)
      let searchQuery = detectedSpeciesName;
      
      // Try exact match first
      let results = await searchSpecies(searchQuery);
      
      // If no results and query contains "Mushroom", try without it
      if ((!results || results.length === 0) && searchQuery.includes('Mushroom')) {
        searchQuery = searchQuery.replace(/\s*Mushroom\s*/gi, '').trim();
        console.log('🔍 Retrying search without "Mushroom":', searchQuery);
        results = await searchSpecies(searchQuery);
      }
      
      console.log('📊 Search results:', results?.length || 0, 'matches found');
      
      if (results && results.length > 0) {
        const species = results[0];
        
        // Transform database format to frontend format
        const transformedData: MushroomData = {
          mushroom_id: species._id || species.mushroom_id || '',
          english_name: species.english_name || '',
          local_name: species.local_name || '',
          scientific_name: species.scientific_name || '',
          edible: species.edible ? 'TRUE' : 'FALSE',
          poisonous: !species.edible ? 'TRUE' : 'FALSE',
          location_region: species.location || '',
          location_province: species.province || '',
          habitat: species.habitat || '',
          cap_color: species.cap_color || '',
          cap_size_cm: species.cap_size || '',
          gills_present: species.gills_present ? 'TRUE' : 'FALSE',
          gills_color: species.gills_color || 'none',
          stem_color: species.stem_color || '',
          stem_length_cm: species.stem_length || '',
          size_reference: species.size_reference || '',
          spore_print_color: species.spore_print_color || '',
          texture: species.texture || '',
          season_month: species.season || '',
          cultivated: species.cultivated ? 'TRUE' : 'FALSE',
          wild: species.wild ? 'TRUE' : 'FALSE',
          notes: species.description || species.notes || ''
        };
        
        setMushroomData(transformedData);
        console.log('✅ Fetched mushroom from database:', transformedData.english_name);
      } else {
        console.log('⚠️ No database match found for:', detectedSpeciesName);
        setMushroomData(null);
      }
    } catch (error) {
      console.error('❌ Error fetching mushroom data:', error);
      setMushroomData(null);
    }
  };

  const generateMap = () => {
    if (!mushroomData) return;

    // Get the mushroom species name
    const mushroomName = mushroomData.english_name || mushroomData.scientific_name || 'Unknown Mushroom';

    // Get global locations for this mushroom species
    const locations = getMushroomLocations(mushroomName);

    // Generate appropriate map based on platform
    const html = generateMushroomLocationMap(
      mushroomName,
      locations,
      Platform.OS === 'web'
    );

    setMapHtml(html);
  };

  const analyzeImage = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setDetectionStatus(null);

      // Clean base64 string (remove data URI prefix if present)
      let cleanBase64 = normalizedImageBase64 || '';
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      console.log('Sending image for analysis...');
      console.log('Image size:', cleanBase64.length, 'characters');

      // Send image to backend for analysis
      const backendResult: BackendResult = await analyzeMushroom({
        image_base64: cleanBase64,
        image_url: normalizedCloudinaryUrl,  // Include Cloudinary URL for database storage
        cloudinary_url: normalizedCloudinaryUrl,  // Alternative key
        location: {
          region: "Region 4A",
          province: "Laguna"
        },
        date: new Date().toISOString().split('T')[0],
        user_context: {
          experience_level: "intermediate",
          purpose: "identification"
        }
      });

      console.log('Analysis result received:', backendResult);

      // Check if mushroom was detected
      const detection = backendResult?.detection;
      const mushroomDetected = detection?.found !== false; // Default to true if not specified
      const detectionMessage = backendResult?.message;

      if (!mushroomDetected) {
        setDetectionStatus({
          found: false,
          confidence: detection?.confidence,
          prediction: detection?.prediction,
          message: detectionMessage || 'No mushroom detected in the image. Please try again with a clearer photo of the mushroom.'
        });
        setResult(null);
        setMushroomData(null);
        return;
      }

      setDetectionStatus({
        found: true,
        confidence: detection?.confidence,
        prediction: detection?.prediction,
        message: detectionMessage || 'Mushroom detected in the image.'
      });

      const classification = backendResult?.classification;
      const label = classification?.label || 'Unknown';
      const confidence = classification?.confidence || 0;
      const toxicityLevel = classification?.toxicity_level;

      const transformedResult: PredictionResult = {
        timestamp: new Date().toISOString(),
        image_analysis: {
          species: {
            english_name: label,
            species: label,
            scientific_name: '',
            confidence: confidence,
            metadata: {
              edible: label ? !['Death Cap', 'False Morel', 'Jack O Lantern Mushroom', 'Funeral Bell', 'Red Cage Fungus'].includes(label) : null,
              habitat: '',
              season_month: ''
            }
          },
          toxicity: {
            edible: label ? !['Death Cap', 'False Morel', 'Jack O Lantern Mushroom', 'Funeral Bell', 'Red Cage Fungus'].includes(label) : null,
            toxicity_status: toxicityLevel === 'DANGEROUS' ? 'POISONOUS' : 'EDIBLE',
            confidence: confidence,
            warning: toxicityLevel === 'DANGEROUS' ? '⚠️ DANGEROUS - Do not consume!' : null
          },
          habitat: {}
        },
        risk_assessment: {
          risk_level: toxicityLevel?.toLowerCase() === 'dangerous' ? 'extreme' : 'low',
          overall_risk_score: toxicityLevel?.toLowerCase() === 'dangerous' ? 95 : 10,
          risk_factors: toxicityLevel?.toLowerCase() === 'dangerous' ? ['Highly toxic species', 'Can be fatal if consumed', 'Similar appearance to edible species'] : []
        },
        recommendations: toxicityLevel?.toLowerCase() === 'dangerous' 
          ? ['Do NOT consume this mushroom', 'Seek expert identification if uncertain', 'Contact poison control if ingested']
          : ['Verify identification with local expert', 'Consider habitat and season', 'Ensure proper cooking if edible'],
        safety_actions: toxicityLevel?.toLowerCase() === 'dangerous'
          ? ['⚠️ AVOID - Extremely toxic species', 'Call poison control immediately if ingested: +63-1-522-4444']
          : ['Safe if properly identified and cooked']
      };

      setResult(transformedResult);
    
    } catch (err: any) {
      console.error('Analysis error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Analysis failed. ';
      if (err.message) {
        errorMessage += err.message;
      } else if (err.toString) {
        errorMessage += err.toString();
      } else {
        errorMessage += 'Please check your connection and ensure the backend server is running.';
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'extreme': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FBC02D';
      case 'low': return '#388E3C';
      case 'very_low': return '#2E7D32';
      default: return '#666';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'extreme': return 'warning';
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      case 'very_low': return 'shield-checkmark';
      default: return 'help-circle';
    }
  };

  const SafeComponent = ({ component }: { component: React.ReactNode }) => {
    if (!component) return null;
    return component;
  };

  const renderDetectionSummary = () => {
    if (!detectionStatus || !detectionStatus.found) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="search" size={24} color="#2E7D32" />
          <Text style={styles.sectionTitle}>Detection Result</Text>
        </View>

        <View style={styles.detectionCard}>
          <Text style={styles.detectionStatusText}>
            {detectionStatus.message || 'Mushroom detected'}
          </Text>
          {typeof detectionStatus.confidence === 'number' && (
            <Text style={styles.detectionConfidence}>
              Confidence: {Math.round(detectionStatus.confidence * 100)}%
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderRiskAssessment = () => {
    if (!result?.risk_assessment) return null;

    const risk = result.risk_assessment;
    const riskLevel = risk.risk_level;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={getRiskIcon(riskLevel)} size={24} color={getRiskColor(riskLevel)} />
          <Text style={[styles.sectionTitle, { color: getRiskColor(riskLevel) }]}>
            Risk Assessment: {riskLevel.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.riskCard, { borderColor: getRiskColor(riskLevel) }]}>
          <Text style={styles.riskScore}>
            Risk Score: {risk.overall_risk_score}/100
          </Text>

          {risk.risk_factors && risk.risk_factors.length > 0 && (
            <View style={styles.factorsList}>
              <Text style={styles.factorsTitle}>Risk Factors:</Text>
              {risk.risk_factors
                .filter((factor: string) => factor && typeof factor === 'string' && factor.trim().length > 0)
                .map((factor: string, index: number) => (
                  <Text key={index} style={styles.factorText}>• {factor.trim()}</Text>
                ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSpeciesInfo = () => {
    if (!result?.image_analysis?.species) return null;

    const species = result.image_analysis.species;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="leaf" size={24} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Species Identification</Text>
        </View>

        <View style={styles.speciesCard}>
          {/* Detection Status Badge */}
          <View style={styles.detectionBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.detectionText}>Mushroom Detected</Text>
          </View>

          <Text style={styles.speciesName}>
            {species.english_name || species.species}
          </Text>
          {species.scientific_name && (
            <Text style={styles.scientificName}>{species.scientific_name}</Text>
          )}
          {species.local_name && (
            <Text style={styles.localName}>{species.local_name}</Text>
          )}

          <View style={styles.confidenceBar}>
            <Text style={styles.confidenceText}>
              Confidence: {Math.round((species.confidence || 0) * 100)}%
            </Text>
            <View style={styles.confidenceFill}>
              <View
                style={[
                  styles.confidenceProgress,
                  { width: `${(species.confidence || 0) * 100}%` }
                ]}
              />
            </View>
          </View>

          {species.metadata && (
            <View style={styles.metadataContainer}>
              {species.metadata.edible !== undefined && (
                <View style={styles.metadataItem}>
                  <Ionicons
                    name={species.metadata.edible ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={species.metadata.edible ? "#4CAF50" : "#F44336"}
                  />
                  <Text style={styles.metadataText}>
                    {species.metadata.edible ? "Edible" : "Not Edible"}
                  </Text>
                </View>
              )}

              {species.metadata.habitat && (
                <View style={styles.metadataItem}>
                  <Ionicons name="home" size={16} color="#666" />
                  <Text style={styles.metadataText}>{species.metadata.habitat}</Text>
                </View>
              )}

              {species.metadata.season_month && (
                <View style={styles.metadataItem}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.metadataText}>{species.metadata.season_month}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderToxicityInfo = () => {
    if (!result?.image_analysis?.toxicity) return null;

    const toxicity = result.image_analysis.toxicity;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name={toxicity.edible ? "shield-checkmark" : "warning"}
            size={24}
            color={toxicity.edible ? "#4CAF50" : "#F44336"}
          />
          <Text style={styles.sectionTitle}>Toxicity Analysis</Text>
        </View>

        <View style={[styles.toxicityCard, {
          backgroundColor: toxicity.edible ? '#E8F5E8' : '#FFEBEE',
          borderColor: toxicity.edible ? '#4CAF50' : '#F44336'
        }]}>
          <Text style={[styles.toxicityStatus, {
            color: toxicity.edible ? '#2E7D32' : '#C62828'
          }]}>
            {toxicity.toxicity_status.toUpperCase()}
          </Text>

          <Text style={styles.confidenceText}>
            Confidence: {Math.round((toxicity.confidence || 0) * 100)}%
          </Text>

          {toxicity.warning && (
            <Text style={styles.warningText}>{toxicity.warning}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!result?.recommendations?.length) return null;

    const validRecommendations = result.recommendations.filter(
      (rec: string) => rec && typeof rec === 'string' && rec.trim().length > 0
    );

    if (!validRecommendations.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={24} color="#FF9800" />
          <Text style={styles.sectionTitle}>Recommendations</Text>
        </View>

        <View style={styles.recommendationsList}>
          {validRecommendations.map((rec: string, index: number) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>{rec.trim()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSafetyActions = () => {
    if (!result?.safety_actions?.length) return null;

    const validActions = result.safety_actions.filter(
      (action: string) => action && typeof action === 'string' && action.trim().length > 0
    );

    if (!validActions.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medical" size={24} color="#F44336" />
          <Text style={styles.sectionTitle}>Safety Actions</Text>
        </View>

        <View style={styles.safetyList}>
          {validActions.map((action: string, index: number) => (
            <View key={index} style={styles.safetyItem}>
              <Ionicons name="shield-checkmark" size={16} color="#F44336" />
              <Text style={styles.safetyText}>{action.trim()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMushroomDetails = () => {
    if (!mushroomData) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.sectionTitle}>Mushroom Information</Text>
        </View>

        {/* Map Button */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowMap(true)}
        >
          <Ionicons name="map" size={20} color="white" />
          <Text style={styles.mapButtonText}>View Location Map</Text>
        </TouchableOpacity>

        <View style={styles.detailsCard}>
          {/* Names */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>English Name:</Text>
            <Text style={styles.detailValue}>{mushroomData.english_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Local Name:</Text>
            <Text style={styles.detailValue}>{mushroomData.local_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scientific Name:</Text>
            <Text style={styles.detailValue}>{mushroomData.scientific_name}</Text>
          </View>

          {/* Size Information */}
          <Text style={styles.categoryTitle}>Physical Characteristics</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cap Size:</Text>
            <Text style={styles.detailValue}>{mushroomData.cap_size_cm} cm</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cap Color:</Text>
            <Text style={styles.detailValue}>{mushroomData.cap_color.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stem Length:</Text>
            <Text style={styles.detailValue}>{mushroomData.stem_length_cm} cm</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stem Color:</Text>
            <Text style={styles.detailValue}>{mushroomData.stem_color.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Texture:</Text>
            <Text style={styles.detailValue}>{mushroomData.texture}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gills Present:</Text>
            <Text style={styles.detailValue}>{mushroomData.gills_present === 'TRUE' ? 'Yes' : 'No'}</Text>
          </View>

          {mushroomData.gills_present === 'TRUE' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gills Color:</Text>
              <Text style={styles.detailValue}>{mushroomData.gills_color}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Location Information */}
          <Text style={styles.categoryTitle}>Location & Habitat</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Region:</Text>
            <Text style={styles.detailValue}>{mushroomData.location_region}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Province:</Text>
            <Text style={styles.detailValue}>{mushroomData.location_province}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Habitat Type:</Text>
            <Text style={styles.detailValue}>{mushroomData.habitat.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Season:</Text>
            <Text style={styles.detailValue}>{mushroomData.season_month.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.divider} />

          {/* Growing Information */}
          <Text style={styles.categoryTitle}>Growing Information</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cultivated:</Text>
            <Text style={styles.detailValue}>{mushroomData.cultivated === 'TRUE' ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Found in Wild:</Text>
            <Text style={styles.detailValue}>{mushroomData.wild === 'TRUE' ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Additional Information */}
          <Text style={styles.categoryTitle}>Additional Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Spore Print Color:</Text>
            <Text style={styles.detailValue}>{mushroomData.spore_print_color.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Size Reference:</Text>
            <Text style={styles.detailValue}>{mushroomData.size_reference.replace(/_/g, ' ')}</Text>
          </View>

          {mushroomData.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{mushroomData.notes}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analyzing mushroom...</Text>
        <Text style={styles.loadingSubtext}>
          This may take a few moments
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={80} color="#F44336" />
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorText}>{error}</Text>

        <View style={styles.errorActions}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={analyzeImage}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (detectionStatus && detectionStatus.found === false) {
    return (
      <View style={styles.noDetectionContainer}>
        <Ionicons name="search-circle" size={80} color="#FF9800" />
        <Text style={styles.noDetectionTitle}>No Mushroom Detected</Text>
        <Text style={styles.noDetectionText}>
          {detectionStatus.message || 'Please capture a closer, clearer image of the mushroom.'}
        </Text>
        {typeof detectionStatus.confidence === 'number' && (
          <Text style={styles.noDetectionConfidence}>
            Detector confidence: {Math.round(detectionStatus.confidence * 100)}%
          </Text>
        )}

        <View style={styles.noDetectionActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Retake Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Captured Image */}
        {displayImageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: displayImageUrl }} style={styles.capturedImage} />
            <Text style={styles.imageCaption}>Captured Image</Text>
          </View>
        )}

        {/* Analysis Results */}
        <SafeComponent component={renderDetectionSummary()} />
        <SafeComponent component={renderRiskAssessment()} />
        <SafeComponent component={renderSpeciesInfo()} />
        <SafeComponent component={renderToxicityInfo()} />
        <SafeComponent component={renderMushroomDetails()} />
        <SafeComponent component={renderRecommendations()} />
        <SafeComponent component={renderSafetyActions()} />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Take Another Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.secondaryButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Map Modal - Native */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showMap}
          animationType="slide"
          onRequestClose={() => setShowMap(false)}
        >
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Mushroom Location Map</Text>
              <TouchableOpacity
                onPress={() => setShowMap(false)}
                style={styles.closeMapButton}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {WebView && mapHtml ? (
              <WebView
                source={{ html: mapHtml }}
                style={styles.webView}
                scrollEnabled={true}
              />
            ) : (
              <View style={styles.mapLoadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.mapLoadingText}>Loading map...</Text>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* Map Modal - Web */}
      {Platform.OS === 'web' && showMap && mapHtml && (
        <Modal
          visible={showMap}
          animationType="fade"
          onRequestClose={() => setShowMap(false)}
        >
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Mushroom Location Map</Text>
              <TouchableOpacity
                onPress={() => setShowMap(false)}
                style={styles.closeMapButton}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, overflow: 'hidden' }}>
              <iframe
                srcDoc={mapHtml}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  noDetectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorActions: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  noDetectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  noDetectionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  noDetectionConfidence: {
    fontSize: 14,
    color: '#333',
    marginTop: 12,
  },
  noDetectionActions: {
    width: '100%',
    marginTop: 30,
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  capturedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  imageCaption: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  riskCard: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#FAFAFA',
  },
  riskScore: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  factorsList: {
    marginTop: 10,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  factorText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 3,
  },
  speciesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 15,
  },
  detectionCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 15,
  },
  detectionStatusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 6,
  },
  detectionConfidence: {
    fontSize: 14,
    color: '#2E7D32',
  },
  detectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  detectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 6,
  },
  speciesName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 5,
  },
  localName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  confidenceBar: {
    marginBottom: 15,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  confidenceFill: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceProgress: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  toxicityCard: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 15,
  },
  toxicityStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#C62828',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  recommendationsList: {
    gap: 10,
  },
  recommendationItem: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  safetyList: {
    gap: 8,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  safetyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  mapButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 0.4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 0.6,
    textAlign: 'right',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2196F3',
    marginTop: 12,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  actionButtons: {
    margin: 15,
    marginTop: 0,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  // Map Modal Styles
  mapContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingBottom: 12,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeMapButton: {
    padding: 8,
  },
  webView: {
    flex: 1,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
});