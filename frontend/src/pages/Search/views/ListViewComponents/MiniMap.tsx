import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import './MiniMap.css';
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
import Zoom from 'ol/control/Zoom';
import { useTheme } from '../../../../contexts/ThemeContext';

type MiniMapInstanceData = 'caught' | 'trade' | 'wanted';

type MiniMapProps = {
  latitude?: number;
  longitude?: number;
  instanceData: MiniMapInstanceData;
};

const getPointColor = (instanceData: MiniMapInstanceData): string => {
  if (instanceData === 'caught') return '#00AAFF';
  if (instanceData === 'trade') return '#4cae4f';
  return '#FF0000';
};

const isFiniteCoordinate = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const MiniMap: React.FC<MiniMapProps> = ({ latitude, longitude, instanceData }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const { isLightMode } = useTheme();

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    if (!mapContainer) {
      return;
    }

    if (!isFiniteCoordinate(latitude) || !isFiniteCoordinate(longitude)) {
      return;
    }

    const coordinates = fromLonLat([longitude, latitude]);

    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode
          ? 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      }),
    });

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
          radius: 6,
          fill: new Fill({ color: getPointColor(instanceData) }),
        }),
      }),
    });

    const map = new Map({
      target: mapContainer,
      layers: [baseTileLayer, vectorLayer],
      view: new View({
        center: coordinates,
        zoom: 11,
      }),
      controls: [
        new Zoom({
          className: 'mini-map-zoom',
          target: mapContainer,
        }),
      ],
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.updateSize();
    });

    resizeObserver.observe(mapContainer);

    return () => {
      resizeObserver.disconnect();
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [latitude, longitude, isLightMode, instanceData]);

  return (
    <div className="mini-map-wrapper">
      <div ref={mapContainerRef} className="mini-map-container" />
    </div>
  );
};

export default MiniMap;
