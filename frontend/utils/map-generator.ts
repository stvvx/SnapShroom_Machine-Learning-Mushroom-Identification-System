/**
 * Web-compatible interactive map for mushroom locations
 * Uses Leaflet with OpenStreetMap for all platforms
 */

import type { MushroomLocation } from './mushroom-locations';
import { getPrevalenceColor } from './mushroom-locations';

export function generateMushroomLocationMap(
  mushroomName: string,
  locations: MushroomLocation[],
  isPlatformWeb: boolean = false
): string {
  if (!locations || locations.length === 0) {
    return getErrorMapHTML(mushroomName);
  }

  if (isPlatformWeb) {
    return generateWebMapHTML(mushroomName, locations);
  }

  return generateNativeMapHTML(mushroomName, locations);
}

/**
 * Generate interactive HTML map for web platform using Leaflet + OpenStreetMap
 */
function generateWebMapHTML(mushroomName: string, locations: MushroomLocation[]): string {
  // Pre-escape the mushroom name for use in the template
  const escapedMushroomName = escapeHtml(mushroomName);
  
  // Prepare marker data as JSON for JavaScript
  const locationsJSON = JSON.stringify(locations.map(l => ({
    name: escapeHtml(l.name),
    lat: l.lat,
    lng: l.lng,
    prevalence: l.prevalence,
    cultivated: l.cultivated,
    notes: l.notes ? escapeHtml(l.notes) : '',
    color: getPrevalenceColor(l.prevalence)
  })));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        #map {
          width: 100%;
          height: 500px;
          border-radius: 0;
        }
        .legend {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          padding: 30px;
          background: #f5f5f5;
          border-top: 1px solid #e0e0e0;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          font-size: 13px;
        }
        .legend-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          padding: 20px 30px;
          background: white;
          border-top: 1px solid #e0e0e0;
        }
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-card .value {
          font-size: 24px;
          font-weight: bold;
        }
        .stat-card .label {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 4px;
        }
        .locations-list {
          padding: 30px;
        }
        .location-item {
          padding: 16px;
          background: #f9f9f9;
          border-left: 4px solid;
          border-radius: 4px;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .location-item.high { border-left-color: #d32f2f; }
        .location-item.medium { border-left-color: #f57c00; }
        .location-item.low { border-left-color: #fbc02d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍄 ${escapedMushroomName}</h1>
          <p>Global Distribution & Cultivation Centers</p>
        </div>

        <div id="map"></div>

        <div class="stats">
          <div class="stat-card">
            <div class="value">${locations.length}</div>
            <div class="label">Locations</div>
          </div>
          <div class="stat-card">
            <div class="value">${locations.filter(l => l.cultivated).length}</div>
            <div class="label">Cultivated</div>
          </div>
          <div class="stat-card">
            <div class="value">${locations.filter(l => !l.cultivated).length}</div>
            <div class="label">Wild</div>
          </div>
        </div>

        <div class="legend">
          <div class="legend-item">
            <div class="legend-dot" style="background: #d32f2f;"></div>
            <span><strong>High</strong> Prevalence</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #f57c00;"></div>
            <span><strong>Medium</strong> Prevalence</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #fbc02d;"></div>
            <span><strong>Low</strong> Prevalence</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #4CAF50;"></div>
            <span>🌱 Cultivated Variety</span>
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #2196F3;"></div>
            <span>🌲 Wild Type</span>
          </div>
        </div>

        <div class="locations-list">
          <h2 style="margin-bottom: 16px; color: #333;">📍 Locations</h2>
          ${locations.map(l => {
            const cultivationIcon = l.cultivated ? '🌱' : '🌲';
            const notes = l.notes ? '<br><small style="color: #666;">📝 ' + l.notes + '</small>' : '';
            return '<div class="location-item ' + l.prevalence + '">' +
              '<strong>' + l.name + '</strong> ' +
              '<span style="float: right;">' + cultivationIcon + '</span><br>' +
              '<small>Prevalence: ' + l.prevalence + ' | ' + (l.cultivated ? 'Cultivated' : 'Wild') + '</small>' +
              notes +
              '</div>';
            }).join('')}
        </div>
      </div>

      <script>
        // Initialize Leaflet map with OpenStreetMap tiles
        const locations = ${locationsJSON};
        
        // Center on Philippines
        const map = L.map('map').setView([12.8797, 121.774], 6);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        
        // Add markers for each location
        locations.forEach(location => {
          const markerSize = location.prevalence === 'high' ? 50 : 
                            location.prevalence === 'medium' ? 40 : 30;
          
          const iconHtml = \`
            <div style="
              width: \${markerSize}px;
              height: \${markerSize}px;
              background: \${location.color};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: \${markerSize * 0.5}px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              🍄
            </div>
          \`;
          
          const customIcon = L.divIcon({
            html: iconHtml,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
            popupAnchor: [0, -(markerSize / 2)],
            className: 'custom-mushroom-marker',
          });
          
          const marker = L.marker([location.lat, location.lng], { icon: customIcon })
            .addTo(map);
          
          // Create popup content
          const popupContent = \`
            <div style="min-width: 200px; font-family: -apple-system, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #2E7D32;">\${location.name}</h3>
              <p style="margin: 4px 0;"><strong>Prevalence:</strong> \${location.prevalence.toUpperCase()}</p>
              <p style="margin: 4px 0;">\${location.cultivated ? '🌱 Cultivated' : '🌲 Wild'}</p>
              \${location.notes ? '<p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">📝 ' + location.notes + '</p>' : ''}
            </div>
          \`;
          
          marker.bindPopup(popupContent);
        });
        
        // Fit bounds to show all markers
        if (locations.length > 0) {
          const bounds = locations.map(l => [l.lat, l.lng]);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Generate map for native platforms using Leaflet + OpenStreetMap
 */
function generateNativeMapHTML(mushroomName: string, locations: MushroomLocation[]): string {
  const escapedMushroomName = escapeHtml(mushroomName);
  const locationsJSON = JSON.stringify(locations.map(l => ({
    name: escapeHtml(l.name),
    lat: l.lat,
    lng: l.lng,
    prevalence: l.prevalence,
    cultivated: l.cultivated,
    notes: l.notes ? escapeHtml(l.notes) : '',
    color: getPrevalenceColor(l.prevalence)
  })));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
          font-size: 16px;
        }
        .info-panel p {
          margin: 5px 0;
          font-size: 13px;
          color: #666;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="info-panel">
        <h3>🍄 ${escapedMushroomName}</h3>
        <p><strong>Total Locations:</strong> ${locations.length}</p>
        <p><strong>Cultivated:</strong> ${locations.filter(l => l.cultivated).length}</p>
        <p><strong>Wild:</strong> ${locations.filter(l => !l.cultivated).length}</p>
      </div>
      <div id="map"></div>
      <script>
        // Initialize Leaflet map with OpenStreetMap tiles
        const locations = ${locationsJSON};
        
        // Center on Philippines
        const map = L.map('map').setView([12.8797, 121.774], 6);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        
        // Add markers for each location
        locations.forEach(location => {
          const markerSize = location.prevalence === 'high' ? 45 : 
                            location.prevalence === 'medium' ? 35 : 28;
          
          const iconHtml = \`
            <div style="
              width: \${markerSize}px;
              height: \${markerSize}px;
              background: \${location.color};
              border: 3px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: \${markerSize * 0.5}px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              🍄
            </div>
          \`;
          
          const customIcon = L.divIcon({
            html: iconHtml,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
            popupAnchor: [0, -(markerSize / 2)],
            className: 'custom-mushroom-marker',
          });
          
          const marker = L.marker([location.lat, location.lng], { icon: customIcon })
            .addTo(map);
          
          // Create popup content
          const popupContent = \`
            <div style="min-width: 180px;">
              <h4 style="margin: 0 0 8px 0; color: #2E7D32;">\${location.name}</h4>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Prevalence:</strong> \${location.prevalence}</p>
              <p style="margin: 4px 0; font-size: 13px;">\${location.cultivated ? '🌱 Cultivated' : '🌲 Wild'}</p>
              \${location.notes ? '<p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">' + location.notes + '</p>' : ''}
            </div>
          \`;
          
          marker.bindPopup(popupContent);
        });
        
        // Fit bounds to show all markers
        if (locations.length > 0) {
          const bounds = locations.map(l => [l.lat, l.lng]);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Error map when no locations found
 */
function getErrorMapHTML(mushroomName: string): string {
  const escapedMushroomName = escapeHtml(mushroomName);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .error-container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .error-icon {
          font-size: 60px;
          margin-bottom: 20px;
        }
        h1 {
          color: #333;
          margin: 0 0 10px 0;
        }
        p {
          color: #666;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-icon">🔍</div>
        <h1>Location Data Not Available</h1>
        <p>We couldn't find location data for <strong>${escapedMushroomName}</strong></p>
        <p style="margin-top: 20px; font-size: 13px; color: #999;">
          This mushroom's distribution data is not yet in our database.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
