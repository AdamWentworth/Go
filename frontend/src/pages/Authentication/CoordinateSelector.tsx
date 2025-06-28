// CoordinateSelector.tsx

import React, { useEffect, useRef, useState, FC } from 'react';
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
import { fetchLocationOptions } from '../../services/locationServices';
import type { LocationSuggestion } from '../../types/location';

// Define the props interface.
export interface CoordinateSelectorProps {
  onCoordinatesSelect?: (coords: { latitude: number; longitude: number }) => void;
  onClose: () => void;
  onLocationSelect?: (location: LocationSuggestion) => void;
}

const CoordinateSelector: FC<CoordinateSelectorProps> = ({
  onCoordinatesSelect,
  onClose,
  onLocationSelect,
}) => {
  // The ref for the map container div.
  const mapContainer = useRef<HTMLDivElement | null>(null);
  // Create a constant state for the marker source.
  const [markerSource] = useState<VectorSource>(new VectorSource());
  // Get the current theme flag.
  const { isLightMode } = useTheme();

  // State for location options, loading, and overlay visibility.
  const [locationOptions, setLocationOptions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showOptionsOverlay, setShowOptionsOverlay] = useState<boolean>(false);

  useEffect(() => {
    // Base layer based on the current theme.
    const baseLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode
          ? 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      }),
    });

    // Layer to display the marker.
    const markerLayer = new VectorLayer({
      source: markerSource,
    });

    // Create the map.
    const map = new Map({
      target: mapContainer.current as HTMLElement,
      layers: [baseLayer, markerLayer],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    // Attach a click event handler.
    map.on('click', async (event) => {
      // Convert event coordinate to longitude/latitude.
      const coordinates = toLonLat(event.coordinate);
      const [longitude, latitude] = coordinates;

      console.log(`Map clicked. Coordinates: latitude=${latitude}, longitude=${longitude}`);

      // Clear existing markers.
      markerSource.clear();
      // Create a new marker feature.
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

      // Fetch location options based on the selected coordinates.
      await fetchLocationOptionsWrapper(latitude, longitude);

      if (onCoordinatesSelect) {
        onCoordinatesSelect({ latitude, longitude });
      }
    });

    return () => {
      map.setTarget(undefined);
    };    
  }, [isLightMode, markerSource, onCoordinatesSelect]);

  // Wrap the fetchLocationOptions service.
  const fetchLocationOptionsWrapper = async (latitude: number, longitude: number) => {
    setLoading(true);
    setLocationOptions([]);
    try {
      const options = await fetchLocationOptions(latitude, longitude);
      setLocationOptions(options);
      setShowOptionsOverlay(true);
    } catch (error) {
      console.error('Failed to fetch location options:', error);
      alert('Unable to fetch location options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle when a location is selected from the overlay.
  const handleLocationSelect = (location: LocationSuggestion) => {
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
