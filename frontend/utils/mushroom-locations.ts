/**
 * Mushroom cultivation and growth locations worldwide
 */

export interface MushroomLocation {
  name: string;
  lat: number;
  lng: number;
  prevalence: 'high' | 'medium' | 'low';
  cultivated: boolean;
  season?: string;
  notes?: string;
}

export const MUSHROOM_LOCATIONS: { [key: string]: MushroomLocation[] } = {
  'enoki mushroom': [
    { name: 'Region 2 (Isabela)', lat: 16.8150, lng: 121.7510, prevalence: 'medium', cultivated: true, notes: 'Northern Luzon cultivation' },
  ],
  'oyster mushroom': [
    { name: 'NCR (Metro Manila)', lat: 14.5994, lng: 120.9842, prevalence: 'high', cultivated: true, notes: 'Most common in Philippines markets' },
    { name: 'Region 1 (Pangasinan)', lat: 15.8242, lng: 120.5724, prevalence: 'medium', cultivated: true },
  ],
  'shiitake': [
    { name: 'Region 4A (Cavite)', lat: 14.3540, lng: 120.9020, prevalence: 'low', cultivated: true },
  ],
  'button mushroom': [
    { name: 'Northern Luzon (Rizal)', lat: 14.5895, lng: 121.2914, prevalence: 'low', cultivated: true },
  ],
  'wood ear mushroom': [
    { name: 'Region 1 (Pangasinan)', lat: 15.8242, lng: 120.5724, prevalence: 'high', cultivated: true, notes: 'Wood substrates available' },
  ],
  'death cap': [
    { name: 'Region 4A (Cavite)', lat: 14.3540, lng: 120.9020, prevalence: 'low', cultivated: false, notes: 'Poisonous - avoid! Accidental introduction risk' },
  ],
  'false morel': [
    { name: 'CAR (Benguet)', lat: 16.4023, lng: 120.6026, prevalence: 'low', cultivated: false, notes: 'Mountain forests' },
  ],
  'jack o lantern mushroom': [
    { name: 'Region 4B (Quezon)', lat: 14.8242, lng: 121.5041, prevalence: 'low', cultivated: false, notes: 'Poisonous - avoid!' },
  ],
  'funeral bell': [
    { name: 'Region 2 (Isabela)', lat: 16.8150, lng: 121.7510, prevalence: 'low', cultivated: false, notes: 'Deadly toxins - avoid!' },
  ],
  'red cage fungus': [
    { name: 'Region 6 (Iloilo)', lat: 10.7202, lng: 122.5621, prevalence: 'low', cultivated: false, notes: 'Not edible' },
  ],
};

/**
 * Get locations for a specific mushroom
 */
export function getMushroomLocations(mushroomName: string): MushroomLocation[] {
  const normalized = mushroomName.toLowerCase().trim();
  
  // Try exact match first
  if (MUSHROOM_LOCATIONS[normalized]) {
    return MUSHROOM_LOCATIONS[normalized];
  }
  
  // Try partial match
  for (const [key, locations] of Object.entries(MUSHROOM_LOCATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return locations;
    }
  }
  
  // Default fallback
  return [
    { name: 'Philippines (Metro Manila)', lat: 14.5994, lng: 120.9842, prevalence: 'low', cultivated: false, notes: 'Mushroom location data not available' }
  ];
}

/**
 * Get color based on prevalence
 */
export function getPrevalenceColor(prevalence: 'high' | 'medium' | 'low'): string {
  switch (prevalence) {
    case 'high': return '#d32f2f'; // Red
    case 'medium': return '#f57c00'; // Orange
    case 'low': return '#fbc02d'; // Yellow
    default: return '#999';
  }
}
