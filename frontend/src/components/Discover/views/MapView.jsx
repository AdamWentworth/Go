import React, { useEffect, useRef } from 'react';
import 'ol/ol.css'; // OpenLayers default styles
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
import './MapView.css'; // Custom styles for pop-up
import { useTheme } from '../../../contexts/ThemeContext';  // Import useTheme

const MapView = ({ data }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const { isLightMode } = useTheme();  // Use theme context to get isLightMode

  useEffect(() => {
    if (!data.length) return;

    const vectorSource = new VectorSource();
    const coordinatesArray = [];
    data.forEach((item) => {
      const coordinates = fromLonLat([item.coordinates.longitude, item.coordinates.latitude]);
      coordinatesArray.push(coordinates);

      const feature = new Feature({
        geometry: new Point(coordinates),
        name: item.name,
        location: item.location,
        isShiny: item.isShiny,
      });

      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 7,
            fill: new Fill({ color: '#00AAFF' }),
          }),
        })
      );

      vectorSource.addFeature(feature);
    });

    const extent = vectorSource.getExtent();
    const paddedExtent = bufferExtent(extent, Math.max(extent[2] - extent[0], extent[3] - extent[1]) * 0.25);

    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode ? 
          'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png' :
          'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
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
      positioning: 'bottom-center',
      stopEvent: false,
    });
    map.addOverlay(popupOverlay);

    map.on('click', (event) => {
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const coordinates = feature.getGeometry().getCoordinates();
        const name = feature.get('name');
        const location = feature.get('location');
        const isShiny = feature.get('isShiny') ? 'Yes' : 'No';

        popupOverlay.setPosition(coordinates);
        popupRef.current.innerHTML = `<div><strong>${name}</strong><br/>Location: ${location}<br/>Shiny: ${isShiny}</div>`;
      });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null);
      }
    };
  }, [data, isLightMode]); // Re-run this effect when isLightMode changes

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
      <div ref={popupRef} className="ol-popup" />
    </div>
  );
};

export default MapView;
