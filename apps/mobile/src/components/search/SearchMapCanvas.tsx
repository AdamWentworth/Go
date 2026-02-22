import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SearchMapPoint } from '../../features/search/searchMapModels';
import { buildSearchMapMarkerLayout } from '../../features/search/searchMapModels';
import { theme } from '../../ui/theme';

type SearchMapCanvasProps = {
  points: SearchMapPoint[];
  selectedMarkerId: string | null;
  onSelect: (markerId: string) => void;
  ownershipMode?: string;
};

const MAP_WIDTH = 320;
const MAP_HEIGHT = 220;
const MARKER_SIZE = 14;
const POPUP_WIDTH = 90;

export const SearchMapCanvas = ({
  points,
  selectedMarkerId,
  onSelect,
  ownershipMode,
}: SearchMapCanvasProps) => {
  const layout = useMemo(
    () => buildSearchMapMarkerLayout(points, MAP_WIDTH, MAP_HEIGHT),
    [points],
  );

  const selectedPoint = useMemo(
    () => (selectedMarkerId ? points.find((p) => p.markerId === selectedMarkerId) ?? null : null),
    [points, selectedMarkerId],
  );

  const selectedMarkerLayout = useMemo(
    () => (selectedMarkerId ? layout.find((m) => m.markerId === selectedMarkerId) ?? null : null),
    [layout, selectedMarkerId],
  );

  if (points.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No coordinate points available for map preview.</Text>
      </View>
    );
  }

  const popupLeft =
    selectedMarkerLayout !== null
      ? Math.min(
          selectedMarkerLayout.left + MARKER_SIZE / 2 + 4,
          MAP_WIDTH - POPUP_WIDTH - 4,
        )
      : 0;
  const popupTop =
    selectedMarkerLayout !== null ? Math.max(4, selectedMarkerLayout.top - 24) : 0;

  return (
    <View style={styles.canvas}>
      {layout.map((marker) => {
        const selected = marker.markerId === selectedMarkerId;
        return (
          <Pressable
            key={marker.markerId}
            accessibilityLabel={`Map marker #${marker.markerId.replace('marker-', '')}`}
            onPress={() => onSelect(marker.markerId)}
            style={[
              styles.marker,
              {
                left: marker.left - MARKER_SIZE / 2,
                top: marker.top - MARKER_SIZE / 2,
              },
              selected ? styles.markerSelected : null,
            ]}
          >
            <Text style={styles.markerText} />
          </Pressable>
        );
      })}
      {selectedPoint !== null && selectedMarkerLayout !== null ? (
        <View
          accessibilityLabel="Map marker popup"
          style={[styles.popup, { left: popupLeft, top: popupTop }]}
          pointerEvents="none"
        >
          <Text style={styles.popupText}>#{selectedPoint.pokemonId ?? '?'}</Text>
          {selectedPoint.username ? (
            <Text style={styles.popupText}>{selectedPoint.username}</Text>
          ) : null}
          {ownershipMode ? <Text style={styles.popupText}>{ownershipMode}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: theme.colors.selectedBorder,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerSelected: {
    width: MARKER_SIZE + 4,
    height: MARKER_SIZE + 4,
    borderRadius: (MARKER_SIZE + 4) / 2,
    backgroundColor: theme.colors.success,
  },
  markerText: {
    color: theme.colors.surface,
    fontSize: 8,
  },
  popup: {
    position: 'absolute',
    width: POPUP_WIDTH,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 4,
    zIndex: 10,
  },
  popupText: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    lineHeight: 14,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
