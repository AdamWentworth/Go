// MapView.jsx

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useNavigate } from 'react-router-dom';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import { getCenter } from 'ol/extent';
import { buffer as bufferExtent } from 'ol/extent';
import { WKT } from 'ol/format'; // Add the WKT format parser
import './MapView.css';
import { useTheme } from '../../../contexts/ThemeContext';

import CaughtPopup from './MapViewComponents/CaughtPopup';
import TradePopup from './MapViewComponents/TradePopup';
import WantedPopup from './MapViewComponents/WantedPopup';
import { findVariantForInstance } from '../utils/findVariantForInstance';

const MapView = ({ data, instanceData, pokemonCache }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const popupRootRef = useRef(null);
  const { isLightMode } = useTheme();
  const navigate = useNavigate();
  const [pokemonVariants, setPokemonVariants] = useState([]);

  useEffect(() => {
    if (pokemonCache) {
      setPokemonVariants(pokemonCache);
    }
  }, [pokemonCache]);

  const findPokemonByKey = (keyOrInstanceId, instanceLike) =>
    findVariantForInstance(pokemonVariants, keyOrInstanceId, instanceLike);

  const navigateToUserCatalog = (username, instanceId, instanceData) => {
    navigate(`/pokemon/${username}`, { state: { instanceId, instanceData } });
  };

  useEffect(() => {
    if (!data.length) return;

    const vectorSource = new VectorSource();
    const wktFormat = new WKT(); // WKT parser instance

    data.forEach((item) => {
      const { longitude, latitude, boundary } = item;

      // Add point feature as before
      if (longitude && latitude) {
        const coordinates = fromLonLat([parseFloat(longitude), parseFloat(latitude)]);
        let pointColor = '#00AAFF';
        if (instanceData === 'trade') pointColor = '#4cae4f';
        else if (instanceData === 'wanted') pointColor = '#FF0000';

        const pointFeature = new Feature({
          geometry: new Point(coordinates),
          item,
        });

        pointFeature.setStyle(
          new Style({
            image: new Circle({
              radius: 7,
              fill: new Fill({ color: pointColor }),
            }),
          })
        );
        vectorSource.addFeature(pointFeature);
      }

      if (boundary) {
        const polygonFeature = wktFormat.readFeature(boundary, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });
      
        // Set the color for the boundary based on instanceData
        let boundaryColor = '#00AAFF'; // Default blue
        if (instanceData === 'trade') boundaryColor = '#4cae4f'; // Green for trade
        else if (instanceData === 'wanted') boundaryColor = '#FF0000'; // Red for wanted
      
        polygonFeature.setStyle(
          new Style({
            stroke: new Stroke({
              color: boundaryColor, // Use the same color as the point
              width: 2, // Adjust width as needed
            }),
            fill: new Fill({
              color: 'rgba(0, 0, 0, 0)' // Transparent fill
            }),
          })
        );
      
        vectorSource.addFeature(polygonFeature);
      }            
    });

    const extent = vectorSource.getExtent();
    const paddedExtent = bufferExtent(
      extent,
      Math.max(extent[2] - extent[0], extent[3] - extent[1]) * 0.25
    );

    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode
          ? 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      }),
    });

    const map = new Map({
      target: mapContainer.current,
      layers: [
        baseTileLayer,
        new VectorLayer({
          source: vectorSource,
        }),
      ],
      view: new View({
        center: getCenter(paddedExtent),
        zoom: 10,
        minZoom: 5,
      }),
    });

    map.getView().fit(paddedExtent, {
      padding: [20, 20, 20, 20],
      maxZoom: 15,
      duration: 1000,
    });

    const popupOverlay = new Overlay({
      element: popupRef.current,
      stopEvent: true,
    });
    map.addOverlay(popupOverlay);

    if (!popupRootRef.current) {
      popupRootRef.current = createRoot(popupRef.current);
    }

    map.on('click', (event) => {
      let featureFound = false;
    
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const { item, geometry } = feature.getProperties();
    
        // Check if the feature is a point (ignore boundaries)
        if (geometry && geometry.getType() === 'Point' && item) {
          featureFound = true;
    
          let PopupComponent;
          if (instanceData === 'trade') {
            PopupComponent = TradePopup;
          } else if (instanceData === 'wanted') {
            PopupComponent = WantedPopup;
          } else {
            PopupComponent = CaughtPopup;
          }
    
          if (pokemonVariants.length > 0) {
            popupRootRef.current.render(
              <PopupComponent
                item={item}
                navigateToUserCatalog={navigateToUserCatalog}
                findPokemonByKey={findPokemonByKey}
                onClose={() => {
                  popupOverlay.setPosition(undefined); // Close the popup
                  popupRootRef.current.render(null);   // Clear the popup content
                }}
              />
            );
          } else {
            console.warn("pokemonVariants not yet populated, skipping popup render");
          }
    
          const featureCoordinate = feature.getGeometry().getCoordinates();
          const viewportCenterY = map.getSize()[1] / 2;
    
          const positioning =
            event.pixel[1] > viewportCenterY ? 'bottom-center' : 'top-center';
    
          popupOverlay.setPositioning(positioning);
          popupOverlay.setPosition(featureCoordinate);
        }
      });
    
      if (!featureFound) {
        popupOverlay.setPosition(undefined); // Close the popup
        popupRootRef.current.render(null);   // Clear the popup content
      }
    });      

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, [data, isLightMode, instanceData, pokemonVariants]);

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
      <div ref={popupRef} className="ol-popup" />
    </div>
  );
};

export default MapView;
