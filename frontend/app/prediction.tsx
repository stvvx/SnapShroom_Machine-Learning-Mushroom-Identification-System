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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { analyzeMushroom } from '@/utils/api';

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

export default function PredictionScreen() {
  const { imageUri, imageBase64 } = useLocalSearchParams();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imageBase64) {
      analyzeImage();
    }
  }, [imageBase64]);

  const analyzeImage = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      // Clean base64 string (remove data URI prefix if present)
      let cleanBase64 = imageBase64 as string;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      console.log('Sending image for analysis...');
      console.log('Image size:', cleanBase64.length, 'characters');

      // Send image to backend for analysis
      const result = await analyzeMushroom({
        image_base64: cleanBase64,
        // Add location and date if available
        location: {
          region: "Region 4A", // Default, could be made dynamic
          province: "Laguna"
        },
        date: new Date().toISOString().split('T')[0],
        user_context: {
          experience_level: "intermediate", // Could be user preference
          purpose: "identification"
        }
      });

      console.log('Analysis result received:', result);
      setResult(result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // More detailed error messages
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

          {risk.risk_factors.length > 0 && (
            <View style={styles.factorsList}>
              <Text style={styles.factorsTitle}>Risk Factors:</Text>
              {risk.risk_factors.map((factor: string, index: number) => (
                <Text key={index} style={styles.factorText}>• {factor}</Text>
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

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={24} color="#FF9800" />
          <Text style={styles.sectionTitle}>Recommendations</Text>
        </View>

        <View style={styles.recommendationsList}>
          {result.recommendations.map((rec: string, index: number) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSafetyActions = () => {
    if (!result?.safety_actions?.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medical" size={24} color="#F44336" />
          <Text style={styles.sectionTitle}>Safety Actions</Text>
        </View>

        <View style={styles.safetyList}>
          {result.safety_actions.map((action: string, index: number) => (
            <View key={index} style={styles.safetyItem}>
              <Ionicons name="shield-checkmark" size={16} color="#F44336" />
              <Text style={styles.safetyText}>{action}</Text>
            </View>
          ))}
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

  return (
    <ScrollView style={styles.container}>
      {/* Captured Image */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.capturedImage} />
          <Text style={styles.imageCaption}>Captured Image</Text>
        </View>
      )}

      {/* Analysis Results */}
      {renderRiskAssessment()}
      {renderSpeciesInfo()}
      {renderToxicityInfo()}
      {renderRecommendations()}
      {renderSafetyActions()}

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
});