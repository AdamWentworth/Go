// PartnerInfoModal.jsx
import React, { useEffect, useRef } from 'react';
import './PartnerInfoModal.css'; // optional CSS file
import CloseButton from '../../../components/CloseButton';

// --- Additional OL imports for map ---
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Circle, Fill } from 'ol/style';
import { useTheme } from '../../../contexts/ThemeContext';

// Utility function to format the trainer code into groups of 4 digits.
// e.g., "123456789012" -> "1234 5678 9012"
function formatTrainerCode(code) {
  if (!code) return 'N/A';
  const stripped = code.replace(/\D/g, '');
  const matches = stripped.match(/.{1,4}/g);
  return matches ? matches.join(' ') : code;
}

function PartnerInfoModal({ partnerInfo, onClose }) {
  const mapContainer = useRef(null);
  const { isLightMode } = useTheme();

  // Always call hooks at the top level:
  useEffect(() => {
    if (!partnerInfo?.coordinates?.latitude || !partnerInfo?.coordinates?.longitude) {
      return;
    }

    const { latitude, longitude } = partnerInfo.coordinates;

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode
          ? 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      }),
    });

    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: markerSource,
    });

    const map = new Map({
      target: mapContainer.current,
      layers: [baseLayer, markerLayer],
      view: new View({
        center: fromLonLat([longitude, latitude]),
        zoom: 12,
      }),
    });

    const feature = new Feature({
      geometry: new Point(fromLonLat([longitude, latitude])),
    });
    feature.setStyle(
      new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#00AAFF' }),
        }),
      })
    );
    markerSource.addFeature(feature);

    return () => {
      map.setTarget(null);
    };
  }, [partnerInfo, isLightMode]);

  if (!partnerInfo) {
    return null;
  }

  const { trainerCode, pokemonGoName, coordinates } = partnerInfo;
  const formattedCode = formatTrainerCode(trainerCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formattedCode).then(() => {
      alert('Trainer code copied!');
    });
  };

  return (
    <div className="partner-modal-overlay">
      <div className="modal-content">
        <CloseButton onClick={onClose} />
        <h2>Partner Info</h2>

        {/* Trainer Code Row */}
        <p>
          Trainer Code: <strong>{formattedCode}{' '}</strong>
          {trainerCode && (
            <button style={{ marginLeft: '8px' }} onClick={handleCopyCode}>
              Copy
            </button>
          )}
        </p>

        {/* Pokémon GO Name */}
        <p>
          Pokémon GO Name: <strong>{pokemonGoName || 'N/A'}</strong>
        </p>

        {/* Map */}
        <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
          {coordinates?.latitude && coordinates?.longitude ? (
            <div 
              ref={mapContainer} 
              className="modal-map-container" 
            />
          ) : (
            <p>No location available.</p>
          )}
        </div>

        {/* Additional Text and Campfire Image Below the Map */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p>
            Please proceed with adding <strong>{pokemonGoName || 'this Trainer'}</strong> as a friend on Pokémon Go!
          </p>
          {/* Campfire Image with CSS class */}
          <img 
            src="/images/campfire.png" 
            alt="Campfire" 
            className="campfire-image" 
          />
          <p>
            We recommend installing and using Niantic's Campfire App to communicate and sync up for your Trade!
          </p>
        </div>
      </div>
    </div>
  );
}

export default PartnerInfoModal;
