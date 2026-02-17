import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
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
import { WKT } from 'ol/format';

import { useTheme } from '../../../contexts/ThemeContext';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { normalizeOwnershipMode } from '../utils/ownershipMode';
import { findVariantForInstance } from '../utils/findVariantForInstance';
import { createScopedLogger } from '@/utils/logger';
import CaughtPopup from './MapViewComponents/CaughtPopup';
import TradePopup from './MapViewComponents/TradePopup';
import WantedPopup from './MapViewComponents/WantedPopup';
import './MapView.css';

const log = createScopedLogger('MapView');

type MapDataItem = {
  longitude?: number | string | null;
  latitude?: number | string | null;
  boundary?: string | null;
  [key: string]: unknown;
};

type MapViewProps = {
  data: MapDataItem[];
  instanceData: 'caught' | 'trade' | 'wanted' | string;
  pokemonCache: PokemonVariant[] | null;
};

type FeatureLike = {
  getProperties: () => {
    item?: MapDataItem;
    geometry?: {
      getType: () => string;
    };
  };
  getGeometry: () => {
    getCoordinates: () => number[];
  };
};

const MapView: React.FC<MapViewProps> = ({ data, instanceData, pokemonCache }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const { isLightMode } = useTheme();
  const navigate = useNavigate();
  const [pokemonVariants, setPokemonVariants] = useState<PokemonVariant[]>([]);

  const ownershipMode = normalizeOwnershipMode(
    instanceData as Parameters<typeof normalizeOwnershipMode>[0],
  );

  useEffect(() => {
    if (pokemonCache) {
      setPokemonVariants(pokemonCache);
    }
  }, [pokemonCache]);

  const findPokemonByKey = useCallback(
    (
      keyOrInstanceId?: string | null,
      instanceLike?: Parameters<typeof findVariantForInstance>[2],
    ) => findVariantForInstance(pokemonVariants, keyOrInstanceId, instanceLike),
    [pokemonVariants],
  );

  const navigateToUserCatalog = useCallback(
    (
      username: string,
      instanceId: string,
      selectedInstanceData: string,
    ) => {
      navigate(`/pokemon/${username}`, {
        state: { instanceId, instanceData: selectedInstanceData },
      });
    },
    [navigate],
  );

  useEffect(() => {
    if (!data.length) return;

    const vectorSource = new VectorSource();
    const wktFormat = new WKT();

    data.forEach((item) => {
      const { longitude, latitude, boundary } = item;

      if (longitude && latitude) {
        const coordinates = fromLonLat([
          parseFloat(String(longitude)),
          parseFloat(String(latitude)),
        ]);

        let pointColor = '#00AAFF';
        if (ownershipMode === 'trade') pointColor = '#4cae4f';
        else if (ownershipMode === 'wanted') pointColor = '#FF0000';

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
          }),
        );
        vectorSource.addFeature(pointFeature);
      }

      if (boundary) {
        const polygonFeature = wktFormat.readFeature(boundary, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });

        let boundaryColor = '#00AAFF';
        if (ownershipMode === 'trade') boundaryColor = '#4cae4f';
        else if (ownershipMode === 'wanted') boundaryColor = '#FF0000';

        polygonFeature.setStyle(
          new Style({
            stroke: new Stroke({
              color: boundaryColor,
              width: 2,
            }),
            fill: new Fill({
              color: 'rgba(0, 0, 0, 0)',
            }),
          }),
        );

        vectorSource.addFeature(polygonFeature);
      }
    });

    const extent = vectorSource.getExtent();
    const paddedExtent = bufferExtent(
      extent,
      Math.max(extent[2] - extent[0], extent[3] - extent[1]) * 0.25,
    );

    const baseTileLayer = new TileLayer({
      source: new XYZ({
        url: isLightMode
          ? 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      }),
    });

    const map = new Map({
      target: mapContainer.current ?? undefined,
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
      element: popupRef.current ?? undefined,
      stopEvent: true,
    });
    map.addOverlay(popupOverlay);

    if (popupRef.current && !popupRootRef.current) {
      popupRootRef.current = createRoot(popupRef.current);
    }

    map.on('click', (event: { pixel: number[] }) => {
      let featureFound = false;

      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const typedFeature = feature as unknown as FeatureLike;
        const { item: featureItem, geometry } = typedFeature.getProperties();

        if (geometry && geometry.getType() === 'Point' && featureItem) {
          featureFound = true;

          let PopupComponent = CaughtPopup as React.ComponentType<Record<string, unknown>>;
          if (ownershipMode === 'trade') {
            PopupComponent = TradePopup as React.ComponentType<Record<string, unknown>>;
          } else if (ownershipMode === 'wanted') {
            PopupComponent = WantedPopup as React.ComponentType<Record<string, unknown>>;
          }

          if (pokemonVariants.length > 0 && popupRootRef.current) {
            popupRootRef.current.render(
              <PopupComponent
                item={featureItem}
                navigateToUserCatalog={navigateToUserCatalog}
                findPokemonByKey={findPokemonByKey}
                onClose={() => {
                  popupOverlay.setPosition(undefined);
                  popupRootRef.current?.render(null);
                }}
              />,
            );
          } else {
            log.warn('pokemonVariants not yet populated, skipping popup render');
          }

          const featureCoordinate = typedFeature.getGeometry().getCoordinates();
          const mapSize = map.getSize() ?? [0, 0];
          const viewportCenterY = mapSize[1] / 2;
          const clickY = event.pixel?.[1] ?? 0;

          const positioning =
            clickY > viewportCenterY ? 'bottom-center' : 'top-center';

          popupOverlay.setPositioning(positioning);
          popupOverlay.setPosition(featureCoordinate);
        }
      });

      if (!featureFound) {
        popupOverlay.setPosition(undefined);
        popupRootRef.current?.render(null);
      }
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
      }
    };
  }, [
    data,
    findPokemonByKey,
    isLightMode,
    navigateToUserCatalog,
    ownershipMode,
    pokemonVariants,
  ]);

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
      <div ref={popupRef} className="ol-popup" />
    </div>
  );
};

export default MapView;
