import {
  Camera,
  Map,
  Marker,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import type { NativePokemonSearchResult } from './pokemonSearchModel';

type Props = {
  onOpenListing: (result: NativePokemonSearchResult) => void;
  onOpenProfile: (username: string) => void;
  results: NativePokemonSearchResult[];
};

const LIGHT_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

const DARK_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

const accentFor = (result: NativePokemonSearchResult): string => (
  result.mode === 'trade' ? '#35c680' : result.mode === 'wanted' ? '#f25f78' : '#2f9cff'
);

const initialCamera = (results: NativePokemonSearchResult[]) => {
  const coordinates = results.flatMap((result) => result.mapCoordinate ? [result.mapCoordinate] : []);
  if (coordinates.length === 0) return { center: [-123.009, 49.233] as [number, number], zoom: 8 };
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const span = Math.max(
    Math.max(...longitudes) - Math.min(...longitudes),
    Math.max(...latitudes) - Math.min(...latitudes),
  );
  return {
    center: [
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    ] as [number, number],
    zoom: span > 8 ? 3 : span > 2 ? 5 : span > 0.5 ? 7 : span > 0.1 ? 9 : 11,
  };
};

export const NativeSearchMapView = ({ onOpenListing, onOpenProfile, results }: Props) => {
  const light = useColorScheme() === 'light';
  const mappable = useMemo(() => results.filter((result) => result.mapCoordinate), [results]);
  const [selectedId, setSelectedId] = useState<string | null>(() => mappable[0]?.id ?? null);
  const selected = mappable.find((result) => result.id === selectedId) ?? mappable[0] ?? null;
  const camera = useMemo(() => initialCamera(mappable), [mappable]);

  if (mappable.length === 0) {
    return (
      <View style={[styles.empty, light && styles.emptyLight]}>
        <Text style={styles.emptyIcon}>⌖</Text>
        <Text style={[styles.emptyTitle, light && styles.textLight]}>No map locations available</Text>
        <Text style={[styles.emptyCopy, light && styles.mutedLight]}>
          These trainers have not shared even an approximate public area. Their listings remain available in List view.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.shell, light && styles.shellLight]} testID="native-search-map">
      <Map
        attribution
        compass
        mapStyle={light ? LIGHT_MAP_STYLE : DARK_MAP_STYLE}
        style={styles.map}
        touchPitch={false}
        touchRotate={false}
      >
        <Camera initialViewState={{ center: camera.center, zoom: camera.zoom }} maxZoom={16} minZoom={2} />
        {mappable.map((result) => {
          const accent = accentFor(result);
          const active = result.id === selected?.id;
          return (
            <Marker
              anchor="center"
              id={result.id}
              key={result.id}
              lngLat={result.mapCoordinate!}
              onPress={() => setSelectedId(result.id)}
            >
              <View
                accessibilityLabel={`${result.username}, ${result.row.name}${result.mapCoordinateIsApproximate ? ', approximate area' : ''}`}
                style={[
                  styles.marker,
                  { backgroundColor: accent },
                  result.mapCoordinateIsApproximate && styles.approximateMarker,
                  active && styles.markerActive,
                ]}
              >
                <Text style={styles.markerText}>{result.username.slice(0, 1).toLocaleUpperCase()}</Text>
              </View>
            </Marker>
          );
        })}
      </Map>
      <View style={[styles.mapCount, light && styles.mapCountLight]}>
        <Text style={[styles.mapCountText, light && styles.textLight]}>{mappable.length} on map</Text>
      </View>
      {selected ? (
        <View style={[styles.preview, light && styles.previewLight]}>
          <View style={styles.previewCopy}>
            <Text style={[styles.previewName, light && styles.textLight]} numberOfLines={1}>{selected.row.name}</Text>
            <Text style={[styles.previewMeta, light && styles.mutedLight]} numberOfLines={1}>
              {selected.username}{selected.mapCoordinateIsApproximate ? ' · approximate area' : ''}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => onOpenProfile(selected.username)} style={[styles.previewSecondary, light && styles.previewSecondaryLight]}>
            <Text style={[styles.previewSecondaryText, light && styles.textLight]}>Trainer</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onOpenListing(selected)} style={[styles.previewPrimary, { backgroundColor: accentFor(selected) }]}>
            <Text style={styles.previewPrimaryText}>Open</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: { height: 530, overflow: 'hidden', borderWidth: 1, borderColor: '#3d5256', borderRadius: 14, backgroundColor: '#11191b' },
  shellLight: { borderColor: '#aebdc0', backgroundColor: '#ffffff' },
  map: { flex: 1 },
  marker: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff', borderRadius: 17, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  approximateMarker: { borderStyle: 'dashed' },
  markerActive: { width: 42, height: 42, borderRadius: 21, borderWidth: 4 },
  markerText: { color: '#041312', fontSize: 13, fontWeight: '900' },
  mapCount: { position: 'absolute', top: 10, left: 10, minHeight: 34, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#53666a', borderRadius: 17, backgroundColor: '#131b1ddd' },
  mapCountLight: { borderColor: '#a6b4b7', backgroundColor: '#fffffff2' },
  mapCountText: { color: '#f7fbfc', fontSize: 12, fontWeight: '900' },
  preview: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: '#40565a', backgroundColor: '#151d1f' },
  previewLight: { borderTopColor: '#b5c1c4', backgroundColor: '#ffffff' },
  previewCopy: { flex: 1, minWidth: 0 },
  previewName: { color: '#f7fbfc', fontSize: 15, fontWeight: '900' },
  previewMeta: { marginTop: 2, color: '#9badb0', fontSize: 11, fontWeight: '700' },
  previewSecondary: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#52676a', borderRadius: 9, backgroundColor: '#20292b' },
  previewSecondaryLight: { borderColor: '#a7b5b8', backgroundColor: '#f5f8f8' },
  previewSecondaryText: { color: '#f7fbfc', fontSize: 12, fontWeight: '900' },
  previewPrimary: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 9 },
  previewPrimaryText: { color: '#041312', fontSize: 12, fontWeight: '900' },
  empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 24, borderWidth: 1, borderColor: '#3d5256', borderRadius: 14, backgroundColor: '#151d1f' },
  emptyLight: { borderColor: '#b4c1c3', backgroundColor: '#ffffff' },
  emptyIcon: { color: '#2f9cff', fontSize: 30, fontWeight: '900' },
  emptyTitle: { color: '#f7fbfc', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { maxWidth: 420, color: '#9badb0', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  textLight: { color: '#172124' },
  mutedLight: { color: '#5c696c' },
});
