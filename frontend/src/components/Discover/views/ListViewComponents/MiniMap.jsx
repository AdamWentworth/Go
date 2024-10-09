// MiniMap.jsx
import React, { useEffect, useRef } from 'react';
import 'ol/ol.css'; // OpenLayers default styles
import './MiniMap.css'; // Import custom CSS for MiniMap
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle, Fill } from 'ol/style';
import Zoom from 'ol/control/Zoom'; // Import Zoom control from OpenLayers
import { useTheme } from '../../../../contexts/ThemeContext';  // Import useTheme

const MiniMap = ({ latitude, longitude, ownershipStatus }) => {
  const mapContainerRef = useRef(null);
  const { isLightMode } = useTheme();  // Use theme context to get isLightMode

  useEffect(() => {
    const coordinates = fromLonLat([longitude, latitude]);

    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode
          ? 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      }),
    });

    // Set the color based on ownershipStatus
    let pointColor;
    if (ownershipStatus === 'owned') {
      pointColor = '#00AAFF'; // Blue for owned
    } else if (ownershipStatus === 'trade') {
      pointColor = '#00FF00'; // Green for trade
    } else {
      pointColor = '#FF0000'; // Red for wanted (default)
    }

    // Create a vector source and layer for the point feature
    const vectorSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Point(coordinates),
        }),
      ],
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({ color: pointColor }), // Set color based on ownershipStatus
        }),
      }),
    });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [baseTileLayer, vectorLayer],
      view: new View({
        center: coordinates,
        zoom: 14, // Increased zoom level for a closer view
      }),
      controls: [
        new Zoom({
          className: 'mini-map-zoom', // Add a custom class to the zoom control
          target: mapContainerRef.current,
        }),
      ],
    });

    return () => {
      map.setTarget(null); // Clean up the map instance on unmount
    };
  }, [latitude, longitude, isLightMode, ownershipStatus]);

  return (
    <div className="mini-map-wrapper">
      <div ref={mapContainerRef} className="mini-map-container" />
    </div>
  );
};

export default MiniMap;