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
import './GlobeView.css'; // Custom styles for pop-up

const GlobeView = ({ data }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null); // Ref for the popup

  useEffect(() => {
    if (!data.length) return;

    // Create a vector source to hold the point features
    const vectorSource = new VectorSource();

    // Collect all the coordinates to calculate the bounding box
    const coordinatesArray = [];

    // Add Pokémon locations as points on the map
    data.forEach((item) => {
      const coordinates = fromLonLat([item.coordinates.longitude, item.coordinates.latitude]);
      coordinatesArray.push(coordinates);

      const feature = new Feature({
        geometry: new Point(coordinates),
        name: item.name,
        location: item.location,
        isShiny: item.isShiny,
      });

      // Set a blue circle as the marker style
      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 7, // Size of the circle marker
            fill: new Fill({ color: '#00AAFF' }), // Blue fill color for the circle
          }),
        })
      );

      vectorSource.addFeature(feature);
    });

    // Calculate the extent (bounding box) from the coordinates
    const extent = vectorSource.getExtent();
    
    // Add some padding to the extent (expand the extent by 25%)
    const paddedExtent = bufferExtent(extent, Math.max(extent[2] - extent[0], extent[3] - extent[1]) * 0.25);

    // Initialize the OpenLayers map with CartoDB Voyager tiles for a colorful map
    const map = new Map({
        target: mapContainer.current,
        layers: [
        // CartoDB Voyager base layer with English names and colorful styling
        new TileLayer({
            source: new XYZ({
            url: 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', // CartoDB Voyager tiles
            }),
        }),
        // Vector layer for Pokémon points
        new VectorLayer({
            source: vectorSource,
        }),
        ],
        view: new View({
        center: getCenter(paddedExtent), // Center the map on the padded extent
        zoom: 10, // You can set an initial zoom, but it will adjust based on fit
        minZoom: 5,
        }),
    });

    // Adjust the view to fit the padded extent
    map.getView().fit(paddedExtent, {
        padding: [20, 20, 20, 20], // Padding for fitting the points
        maxZoom: 15, // Set max zoom to ensure it zooms in more by default
        duration: 1000, // Smooth transition duration
    });

    // Create the popup overlay for the marker click
    const popupOverlay = new Overlay({
      element: popupRef.current,
      positioning: 'bottom-center',
      stopEvent: false,
    });
    map.addOverlay(popupOverlay);

    // Show popup with Pokémon details on click
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

    // Save map reference to clean up later
    mapRef.current = map;

    // Clean up when the component is unmounted
    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null); // Detach the map to clean up
      }
    };
  }, [data]);

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
      <div ref={popupRef} className="ol-popup" />
    </div>
  );
};

export default GlobeView;
