// CoordinateSelector.jsx

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { Style, Circle, Fill } from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useTheme } from '../../contexts/ThemeContext';
import './CoordinateSelector.css';
import CloseButton from '../../components/CloseButton';
import LocationOptionsOverlay from './LocationOptionsOverlay';

const CoordinateSelector = ({ onCoordinatesSelect, onClose, onLocationSelect }) => {
  const mapContainer = useRef(null);
  const [markerSource] = useState(new VectorSource());
  const { isLightMode } = useTheme();

  const [locationOptions, setLocationOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false);

  useEffect(() => {
    const baseLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode
          ? 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      }),
    });

    const markerLayer = new VectorLayer({
      source: markerSource,
    });

    const map = new Map({
      target: mapContainer.current,
      layers: [baseLayer, markerLayer],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    map.on('click', async (event) => {
      const coordinates = toLonLat(event.coordinate);
      const [longitude, latitude] = coordinates;

      console.log(`Map clicked. Coordinates: latitude=${latitude}, longitude=${longitude}`);

      markerSource.clear();
      const marker = new Feature({
        geometry: new Point(event.coordinate),
      });
      marker.setStyle(
        new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({ color: '#FF0000' }),
          }),
        })
      );
      markerSource.addFeature(marker);

      await fetchLocationOptions(latitude, longitude);

      if (onCoordinatesSelect) {
        onCoordinatesSelect({ latitude, longitude });
      }
    });

    return () => {
      map.setTarget(null);
    };
  }, [isLightMode, markerSource, onCoordinatesSelect]);

  const fetchLocationOptions = async (latitude, longitude) => {
    setLoading(true);
    setLocationOptions([]);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_LOCATION_SERVICE_URL}/reverse?lat=${latitude}&lon=${longitude}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch location options: ${response.statusText}`);
      }
      const data = await response.json();
      setLocationOptions(data.locations || []);
      setShowOptionsOverlay(true);
    } catch (error) {
      console.error('Error fetching location options:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    onClose();
  };

  const handleDismissOptions = () => {
    setShowOptionsOverlay(false);
    setLocationOptions([]);
  };

  return (
    <div className="coordinate-selector-overlay">
      <div className="coordinate-selector-map" ref={mapContainer} />
      <CloseButton onClick={onClose} />

      {loading && <p className="loading-text">Loading location options...</p>}

      {showOptionsOverlay && (
        <LocationOptionsOverlay
          locations={locationOptions}
          onLocationSelect={handleLocationSelect}
          onDismiss={handleDismissOptions}
        />
      )}

      {!loading && locationOptions.length === 0 && !showOptionsOverlay && (
        <p className="no-locations-text">Click on the map to set coordinates.</p>
      )}
    </div>
  );
};

export default CoordinateSelector;