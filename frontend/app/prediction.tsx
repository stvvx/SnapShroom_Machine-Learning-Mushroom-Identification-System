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
  WebView,
  Platform,  
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

interface BackendResult {
  classification?: BackendClassification;
  [key: string]: any;
}

// Location coordinates for Philippine regions and provinces
const LOCATION_COORDINATES: { [key: string]: { lat: number; lng: number; name: string } } = {
  'region 1': { lat: 16.6, lng: 120.5, name: 'Region 1 (Ilocos)' },
  'region 2': { lat: 16.79, lng: 121.74, name: 'Region 2 (Cagayan Valley)' },
  'region 3': { lat: 14.87, lng: 121.77, name: 'Region 3 (Central Luzon)' },
  'region 4a': { lat: 13.94, lng: 121.87, name: 'Region 4A (CALABARZON)' },
  'region 4b': { lat: 13.6, lng: 122.5, name: 'Region 4B (MIMAROPA)' },
  'region 5': { lat: 13.15, lng: 123.75, name: 'Region 5 (Bicol)' },
  'region 6': { lat: 10.69, lng: 122.56, name: 'Region 6 (Western Visayas)' },
  'region 7': { lat: 10.32, lng: 123.98, name: 'Region 7 (Central Visayas)' },
  'region 8': { lat: 11.24, lng: 124.99, name: 'Region 8 (Eastern Visayas)' },
  'region 9': { lat: 8.67, lng: 123.72, name: 'Region 9 (Zamboanga Peninsula)' },
  'region 10': { lat: 8.67, lng: 125.03, name: 'Region 10 (Northern Mindanao)' },
  'region 11': { lat: 7.1, lng: 125.6, name: 'Region 11 (Davao)' },
  'region 12': { lat: 6.11, lng: 124.59, name: 'Region 12 (SOCCSKSARGEN)' },
  'car': { lat: 16.41, lng: 120.89, name: 'CAR (Cordillera)' },
  'ncr': { lat: 14.6, lng: 121.0, name: 'NCR (Metro Manila)' },
  'bangui': { lat: 18.55, lng: 121.95, name: 'Ilocos Norte' },
  'pangasinan': { lat: 15.82, lng: 120.37, name: 'Pangasinan' },
  'isabela': { lat: 16.84, lng: 121.77, name: 'Isabela' },
  'cavite': { lat: 14.35, lng: 120.90, name: 'Cavite' },
  'laguna': { lat: 14.00, lng: 121.43, name: 'Laguna' },
  'rizal': { lat: 14.65, lng: 121.32, name: 'Rizal' },
  'quezon': { lat: 14.27, lng: 121.95, name: 'Quezon' },
  'iloilo': { lat: 10.69, lng: 122.56, name: 'Iloilo' },
  'benguet': { lat: 16.41, lng: 120.89, name: 'Benguet' },
  'manila': { lat: 14.60, lng: 120.97, name: 'Manila' },
};

export default function PredictionScreen() {
  const { imageUri, imageBase64, cloudinaryUrl } = useLocalSearchParams();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mushroomData, setMushroomData] = useState<MushroomData | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapHtml, setMapHtml] = useState<string>('');
  
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

  // Load CSV data
  useEffect(() => {
    loadMushroomData();
  }, []);

  // Analyze image once loaded
  useEffect(() => {
    if (normalizedImageBase64) {
      analyzeImage();
    }
  }, [normalizedImageBase64]);

  // Load and parse CSV when result is available
  useEffect(() => {
    if (result?.image_analysis?.species) {
      matchMushroomFromCSV(result.image_analysis.species.english_name || result.image_analysis.species.species);
    }
  }, [result]);

  // Generate map when mushroom data is available
  useEffect(() => {
    if (mushroomData) {
      generateMap();
    }
  }, [mushroomData]);

  const loadMushroomData = async () => {
    // Mushroom data is hardcoded in matchMushroomFromCSV
    console.log('✅ Mushroom database ready');
  };

  const matchMushroomFromCSV = (detectedSpeciesName: string) => {
    // Hardcoded CSV data for matching
    const mushrooms: MushroomData[] = [
      {
        mushroom_id: '1',
        english_name: 'Wood Ear Mushroom',
        local_name: 'Tainga ng Daga',
        scientific_name: 'Auricularia polytricha',
        edible: 'TRUE',
        poisonous: 'FALSE',
        location_region: 'Region 1',
        location_province: 'Pangasinan',
        habitat: 'wood',
        cap_color: 'dark_brown',
        cap_size_cm: '6',
        gills_present: 'FALSE',
        gills_color: 'none',
        stem_color: 'brown',
        stem_length_cm: '1',
        size_reference: 'coin_5peso',
        spore_print_color: 'white',
        texture: 'gelatinous',
        season_month: 'July-October',
        cultivated: 'TRUE',
        wild: 'TRUE',
        notes: 'Ear-shaped grows on dead wood - used in soups and stir-fry'
      },
      {
        mushroom_id: '2',
        english_name: 'White Oyster Mushroom',
        local_name: 'Kabute',
        scientific_name: 'Pleurotus ostreatus',
        edible: 'TRUE',
        poisonous: 'FALSE',
        location_region: 'NCR',
        location_province: 'Manila',
        habitat: 'wood',
        cap_color: 'white',
        cap_size_cm: '10',
        gills_present: 'TRUE',
        gills_color: 'white',
        stem_color: 'white',
        stem_length_cm: '3',
        size_reference: 'coin_10peso',
        spore_print_color: 'white',
        texture: 'smooth',
        season_month: 'All_year',
        cultivated: 'TRUE',
        wild: 'TRUE',
        notes: 'Most commonly cultivated mushroom in Philippines - sold in markets'
      },
      {
        mushroom_id: '3',
        english_name: 'Enoki Mushroom',
        local_name: 'Enoki',
        scientific_name: 'Flammulina velutipes',
        edible: 'TRUE',
        poisonous: 'FALSE',
        location_region: 'Region 2',
        location_province: 'Isabela',
        habitat: 'wood',
        cap_color: 'white',
        cap_size_cm: '2',
        gills_present: 'TRUE',
        gills_color: 'white',
        stem_color: 'white',
        stem_length_cm: '10',
        size_reference: 'coin_1peso',
        spore_print_color: 'white',
        texture: 'smooth',
        season_month: 'All_year',
        cultivated: 'TRUE',
        wild: 'FALSE',
        notes: 'Long thin stems with tiny caps - grows in clusters - popular in Japanese dishes'
      },
      {
        mushroom_id: '4',
        english_name: 'Shiitake Mushroom',
        local_name: 'Shiitake',
        scientific_name: 'Lentinula edodes',
        edible: 'TRUE',
        poisonous: 'FALSE',
        location_region: 'Region 4A',
        location_province: 'Cavite',
        habitat: 'wood',
        cap_color: 'brown',
        cap_size_cm: '7',
        gills_present: 'TRUE',
        gills_color: 'cream',
        stem_color: 'brown',
        stem_length_cm: '4',
        size_reference: 'coin_5peso',
        spore_print_color: 'white',
        texture: 'smooth',
        season_month: 'All_year',
        cultivated: 'TRUE',
        wild: 'FALSE',
        notes: 'Popular cultivated variety - brown umbrella-shaped cap with white scales'
      },
      {
        mushroom_id: '5',
        english_name: 'Death Cap',
        local_name: 'Kabuting Nakamamatay',
        scientific_name: 'Amanita phalloides',
        edible: 'FALSE',
        poisonous: 'TRUE',
        location_region: 'Region 4A',
        location_province: 'Cavite',
        habitat: 'forest',
        cap_color: 'greenish_white',
        cap_size_cm: '10',
        gills_present: 'TRUE',
        gills_color: 'white',
        stem_color: 'white',
        stem_length_cm: '12',
        size_reference: 'coin_10peso',
        spore_print_color: 'white',
        texture: 'smooth',
        season_month: 'June-November',
        cultivated: 'FALSE',
        wild: 'TRUE',
        notes: '⚠️ EXTREMELY DEADLY - Contains amatoxins - Can be confused with edible mushrooms - Causes liver failure - DO NOT EAT'
      },
      {
        mushroom_id: '6',
        english_name: 'False Morel',
        local_name: 'Kabuting Utak',
        scientific_name: 'Gyromitra esculenta',
        edible: 'FALSE',
        poisonous: 'TRUE',
        location_region: 'CAR',
        location_province: 'Benguet',
        habitat: 'forest',
        cap_color: 'reddish_brown',
        cap_size_cm: '8',
        gills_present: 'FALSE',
        gills_color: 'none',
        stem_color: 'white',
        stem_length_cm: '5',
        size_reference: 'coin_10peso',
        spore_print_color: 'white',
        texture: 'wrinkled',
        season_month: 'March-May',
        cultivated: 'FALSE',
        wild: 'TRUE',
        notes: '⚠️ DEADLY - Brain-like wrinkled cap - Contains gyromitrin - Can be fatal even when cooked - Found in pine forests'
      },
      {
        mushroom_id: '7',
        english_name: 'Jack O Lantern Mushroom',
        local_name: 'Kabuting Nagniningning',
        scientific_name: 'Omphalotus olearius',
        edible: 'FALSE',
        poisonous: 'TRUE',
        location_region: 'Region 4B',
        location_province: 'Quezon',
        habitat: 'wood',
        cap_color: 'orange',
        cap_size_cm: '12',
        gills_present: 'TRUE',
        gills_color: 'orange',
        stem_color: 'orange',
        stem_length_cm: '8',
        size_reference: 'hand',
        spore_print_color: 'cream',
        texture: 'smooth',
        season_month: 'June-November',
        cultivated: 'FALSE',
        wild: 'TRUE',
        notes: '⚠️ POISONOUS - Bright orange color - Gills glow in the dark - Causes severe cramps and vomiting - Often confused with chanterelles'
      },
      {
        mushroom_id: '8',
        english_name: 'Funeral Bell',
        local_name: 'Kabuting Libing',
        scientific_name: 'Galerina marginata',
        edible: 'FALSE',
        poisonous: 'TRUE',
        location_region: 'Region 2',
        location_province: 'Isabela',
        habitat: 'wood',
        cap_color: 'brown',
        cap_size_cm: '4',
        gills_present: 'TRUE',
        gills_color: 'brown',
        stem_color: 'brown',
        stem_length_cm: '6',
        size_reference: 'coin_5peso',
        spore_print_color: 'rusty_brown',
        texture: 'smooth',
        season_month: 'All_year',
        cultivated: 'FALSE',
        wild: 'TRUE',
        notes: '⚠️ EXTREMELY DEADLY - Small brown mushroom - Contains same toxins as Death Cap - Often mistaken for edible mushrooms - Grows on decaying wood'
      },
      {
        mushroom_id: '9',
        english_name: 'Red Cage Fungus',
        local_name: 'Kabuting Kulungan',
        scientific_name: 'Clathrus ruber',
        edible: 'FALSE',
        poisonous: 'TRUE',
        location_region: 'Region 6',
        location_province: 'Iloilo',
        habitat: 'soil',
        cap_color: 'red',
        cap_size_cm: '8',
        gills_present: 'FALSE',
        gills_color: 'none',
        stem_color: 'red',
        stem_length_cm: '5',
        size_reference: 'coin_10peso',
        spore_print_color: 'none',
        texture: 'latticed',
        season_month: 'May-October',
        cultivated: 'FALSE',
        wild: 'TRUE',
        notes: '⚠️ NOT EDIBLE - Bright red lattice structure - Foul odor attracts flies - Not technically poisonous but inedible - Very distinctive appearance'
      },
      {
        mushroom_id: '10',
        english_name: 'Button Mushroom',
        local_name: 'Kabuting Paris',
        scientific_name: 'Agaricus bisporus',
        edible: 'TRUE',
        poisonous: 'FALSE',
        location_region: 'Northern Luzon',
        location_province: 'Rizal',
        habitat: 'farms',
        cap_color: 'white-light_brown',
        cap_size_cm: '3-10',
        gills_present: 'TRUE',
        gills_color: 'brown',
        stem_color: 'white',
        stem_length_cm: '5',
        size_reference: 'grocery-grade mushroom',
        spore_print_color: 'dark_brown',
        texture: 'smooth',
        season_month: 'All_year',
        cultivated: 'TRUE',
        wild: 'FALSE',
        notes: 'Most commonly consumed mushroom globally; same species as cremini and portobello at different maturity stages.'
      }
    ];

    // Match detected species with CSV data
    const matched = mushrooms.find(m => 
      m.english_name.toLowerCase().includes(detectedSpeciesName.toLowerCase()) ||
      detectedSpeciesName.toLowerCase().includes(m.english_name.toLowerCase())
    );

    if (matched) {
      setMushroomData(matched);
      console.log('✅ Matched mushroom from CSV:', matched.english_name);
    } else {
      console.log('⚠️ No match found for:', detectedSpeciesName);
    }
  };

  const generateMap = () => {
    if (!mushroomData) return;

    // Get coordinates for region and province
    const regionKey = mushroomData.location_region.toLowerCase();
    const provinceKey = mushroomData.location_province.toLowerCase();

    const regionCoords = LOCATION_COORDINATES[regionKey];
    const provinceCoords = LOCATION_COORDINATES[provinceKey];

    // Use province coordinates if available, otherwise use region
    const coords = provinceCoords || regionCoords || { lat: 12.8797, lng: 121.7740, name: 'Philippines' };

    // Create HTML with Plotly map
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
          }
          #map {
            width: 100%;
            height: 100vh;
          }
          .info-panel {
            position: absolute;
            top: 10px;
            left: 10px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 300px;
          }
          .info-panel h3 {
            margin: 0 0 10px 0;
            color: #2E7D32;
          }
          .info-panel p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
          }
          .location-badge {
            background: #4CAF50;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            margin-top: 10px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="info-panel">
          <h3>${mushroomData.english_name}</h3>
          <p><strong>Region:</strong> ${mushroomData.location_region}</p>
          <p><strong>Province:</strong> ${mushroomData.location_province}</p>
          <p><strong>Habitat:</strong> ${mushroomData.habitat}</p>
          <div class="location-badge">${coords.name}</div>
        </div>
        <div id="map"></div>
        <script>
          // Create map data
          var data = [{
            type: 'scattergeo',
            lat: [${coords.lat}],
            lon: [${coords.lng}],
            mode: 'markers',
            marker: {
              size: 15,
              color: '${mushroomData.poisonous === 'TRUE' ? '#F44336' : '#4CAF50'}',
              opacity: 0.8,
              line: {
                color: 'white',
                width: 2
              }
            },
            text: ['${coords.name}<br>${mushroomData.english_name}'],
            hoverinfo: 'text'
          }];

          var layout = {
            title: {
              text: '${mushroomData.english_name} - Geographic Location',
              font: { size: 18, color: '#333' }
            },
            geo: {
              scope: 'asia',
              center: { lat: 12, lon: 121 },
              projection: { type: 'mercator' },
              showland: true,
              landcolor: '#e5e3df',
              coastcolor: '#bfbfbf',
              showocean: true,
              oceancolor: '#e0f0ff',
              showlakes: true,
              lakecolor: '#d4f1f9',
              coastlinewidth: 1,
              countrywidth: 1,
              showcountries: true
            },
            margin: { l: 0, r: 0, t: 50, b: 0 },
            paper_bgcolor: '#f5f5f5',
            font: { family: 'Arial, sans-serif' }
          };

          var config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['select2d', 'lasso2d']
          };

          Plotly.newPlot('map', data, layout, config);
        </script>
      </body>
      </html>
    `;

    setMapHtml(html);
  };

  const analyzeImage = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

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
      matchMushroomFromCSV(label);
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

  const renderMushroomDetails = () => {
    if (!mushroomData) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.sectionTitle}>Mushroom Information (CSV Data)</Text>
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
        {renderRiskAssessment()}
        {renderSpeciesInfo()}
        {renderToxicityInfo()}
        {renderMushroomDetails()}
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

      {/* Map Modal */}
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

          {mapHtml ? (
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
    paddingTop: 12,
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