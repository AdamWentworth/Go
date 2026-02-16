import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, Style } from 'ol/style';

import CloseButton from '@/components/CloseButton';
import { useTheme } from '@/contexts/ThemeContext';

import 'ol/ol.css';
import './PartnerInfoModal.css';

interface PartnerCoordinates {
  latitude: number;
  longitude: number;
}

export interface PartnerInfo {
  trainerCode?: string | null;
  pokemonGoName?: string | null;
  coordinates?: PartnerCoordinates | null;
  location?: string | null;
}

interface PartnerInfoModalProps {
  partnerInfo: PartnerInfo | null;
  onClose: () => void;
}

export function formatTrainerCode(code?: string | null): string {
  if (!code) return 'N/A';

  const stripped = code.replace(/\D/g, '');
  const matches = stripped.match(/.{1,4}/g);
  return matches ? matches.join(' ') : code;
}

function PartnerInfoModal({ partnerInfo, onClose }: PartnerInfoModalProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const { isLightMode } = useTheme();

  useEffect(() => {
    const latitude = partnerInfo?.coordinates?.latitude;
    const longitude = partnerInfo?.coordinates?.longitude;
    if (latitude == null || longitude == null || !mapContainer.current) {
      return;
    }

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

    const markerFeature = new Feature({
      geometry: new Point(fromLonLat([longitude, latitude])),
    });

    markerFeature.setStyle(
      new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#00AAFF' }),
        }),
      }),
    );

    markerSource.addFeature(markerFeature);

    return () => {
      map.setTarget(undefined);
    };
  }, [partnerInfo, isLightMode]);

  if (!partnerInfo) {
    return null;
  }

  const { trainerCode, pokemonGoName, coordinates, location } = partnerInfo;
  const formattedCode = formatTrainerCode(trainerCode);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode);
      window.alert('Trainer code copied!');
    } catch {
      window.alert('Unable to copy trainer code.');
    }
  };

  return (
    <div className="partner-modal-overlay">
      <div className="modal-content">
        <CloseButton onClick={onClose} />
        <h2>Partner Info</h2>

        <p>
          Trainer Code: <strong>{formattedCode} </strong>
          {trainerCode ? (
            <button className="copy-button" onClick={handleCopyCode}>
              Copy
            </button>
          ) : null}
        </p>
        {!trainerCode ? <p className="info-message">We hope they'll add you!</p> : null}

        <p>
          Pokemon GO Name: <strong>{pokemonGoName || 'N/A'}</strong>
        </p>
        {!pokemonGoName ? <p className="info-message">We hope they'll add their name soon!</p> : null}

        <div className="map-wrapper">
          {coordinates?.latitude != null && coordinates?.longitude != null ? (
            <div ref={mapContainer} className="modal-map-container" />
          ) : location ? (
            <p>Location: {location}</p>
          ) : (
            <p>We have no location data for this trainer.</p>
          )}
        </div>

        <div className="additional-text-container">
          <p>
            Please proceed with adding <strong>{pokemonGoName || 'this Trainer'}</strong> as a friend on Pokemon Go!
          </p>
          <img src="/images/campfire.png" alt="Campfire" className="campfire-image" />
          <p>
            We recommend installing and using Niantic&apos;s Campfire App to communicate and sync up for your Trade!
          </p>
        </div>

        <p className="bottom-message">
          Pokemon Go friends can be messaged directly using Campfire!
        </p>
      </div>
    </div>
  );
}

export default PartnerInfoModal;
