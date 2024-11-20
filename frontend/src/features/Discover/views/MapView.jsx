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
import { Style, Circle, Fill } from 'ol/style';
import { getCenter } from 'ol/extent';
import { buffer as bufferExtent } from 'ol/extent';
import './MapView.css';
import { useTheme } from '../../../contexts/ThemeContext';

import OwnedPopup from './MapViewComponents/OwnedPopup';
import TradePopup from './MapViewComponents/TradePopup';
import WantedPopup from './MapViewComponents/WantedPopup';

const MapView = ({ data, ownershipStatus, pokemonCache }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const popupRootRef = useRef(null);
  const { isLightMode } = useTheme();
  const navigate = useNavigate();
  const [pokemonVariants, setPokemonVariants] = useState([]);

  // Populate pokemonVariants when pokemonCache is available
  useEffect(() => {
    if (pokemonCache) {
      setPokemonVariants(pokemonCache);
    }
  }, [pokemonCache]);

  // Helper to find a Pokemon by key
  const findPokemonByKey = (baseKey) => {
    const matchedPokemon = pokemonVariants.find((pokemon) => pokemon.pokemonKey === baseKey);
    return matchedPokemon;
  };

  // Function to navigate based on selected Pokemon
  const navigateToUserCatalog = (username, instanceId, ownershipStatus) => {
    navigate(`/collection/${username}`, { state: { instanceId, ownershipStatus } });
  };

  useEffect(() => {
    if (!data.length) return;

    const vectorSource = new VectorSource();

    data.forEach((item) => {
      const { longitude, latitude } = item;
      const coordinates = fromLonLat([
        longitude ? parseFloat(longitude) : -123.113952,
        latitude ? parseFloat(latitude) : 49.2608724,
      ]);

      let pointColor = '#00AAFF';
      if (ownershipStatus === 'trade') pointColor = '#4cae4f';
      else if (ownershipStatus === 'wanted') pointColor = '#FF0000';

      const feature = new Feature({
        geometry: new Point(coordinates),
        item,
      });

      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 7,
            fill: new Fill({ color: pointColor }),
          }),
        })
      );

      vectorSource.addFeature(feature);
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
        featureFound = true;
        const { item } = feature.getProperties();

        let PopupComponent;
        if (ownershipStatus === 'trade') {
          PopupComponent = TradePopup;
        } else if (ownershipStatus === 'wanted') {
          PopupComponent = WantedPopup;
        } else {
          PopupComponent = OwnedPopup;
        }

        if (pokemonVariants.length > 0) {
          popupRootRef.current.render(
            <PopupComponent
              item={item}
              navigateToUserCatalog={navigateToUserCatalog}
              findPokemonByKey={findPokemonByKey} // Pass down findPokemonByKey
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
      });

      if (!featureFound) {
        popupOverlay.setPosition(undefined);
        popupRootRef.current.render(null);
      }
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, [data, isLightMode, ownershipStatus, pokemonVariants]);

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
      <div ref={popupRef} className="ol-popup" />
    </div>
  );
};

export default MapView;