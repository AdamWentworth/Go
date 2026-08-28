import { useEffect, useState } from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { NativeCollectionSort, NativeCollectionSortDirection } from '../collectionModel';
import { useOptionalNativeDevicePreferences } from '../../settings/NativeDevicePreferencesProvider';
import { useNativeColorScheme } from '../../settings/useNativeColorScheme';

export const NATIVE_SORT_OPTIONS: {
  key: NativeCollectionSort;
  label: string;
  icon: string;
}[] = [
  { key: 'releaseDate', label: 'RECENT', icon: '/images/sorting/recent.png' },
  { key: 'favorite', label: 'FAVORITE', icon: '/images/sorting/favorite.png' },
  { key: 'number', label: 'NUMBER', icon: '/images/sorting/number.png' },
  { key: 'hp', label: 'HP', icon: '/images/sorting/hp.png' },
  { key: 'name', label: 'NAME', icon: '/images/sorting/name.png' },
  { key: 'combatPower', label: 'COMBAT POWER', icon: '/images/sorting/cp.png' },
];

const toAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const SortBackdrop = ({ light }: { light: boolean }) => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg height="100%" width="100%">
      <Defs>
        <LinearGradient id="sort-menu-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor={light ? '#e0f0e5' : '#111111'} />
          <Stop offset="100%" stopColor="#34807d" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#sort-menu-gradient)" height="100%" width="100%" />
    </Svg>
  </View>
);

export const NativeCollectionSortMenu = ({
  assetBaseUrl,
  direction,
  onClose,
  onSelect,
  open,
  sort,
}: {
  assetBaseUrl: string;
  direction: NativeCollectionSortDirection;
  onClose: () => void;
  onSelect: (sort: NativeCollectionSort) => void;
  open: boolean;
  sort: NativeCollectionSort;
}) => {
  const light = useNativeColorScheme() === 'light';
  const reduceMotion = useOptionalNativeDevicePreferences()?.shouldReduceMotion ?? false;
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!open) {
      progress.setValue(0);
      return;
    }
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.spring(progress, {
      damping: 19,
      mass: 0.85,
      stiffness: 145,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [open, progress, reduceMotion]);

  return (
    <Modal
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={open}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        <SortBackdrop light={light} />
        <View accessibilityLabel="Sort Pokémon" style={styles.optionList}>
          {NATIVE_SORT_OPTIONS.map((option, index) => {
            const selected = option.key === sort;
            const animatedStyle = {
              opacity: progress.interpolate({
                inputRange: [Math.min(index * 0.06, 0.3), 1],
                outputRange: [0, 1],
                extrapolate: 'clamp' as const,
              }),
              transform: [{
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [240 + (index * 34), 0],
                }),
              }],
            };
            return (
              <Animated.View key={option.key} style={animatedStyle}>
                <Pressable
                  aria-checked={selected}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Image
                    accessibilityElementsHidden
                    resizeMode="contain"
                    source={{ uri: toAssetUrl(assetBaseUrl, option.icon) }}
                    style={styles.optionIcon}
                  />
                  {selected ? (
                    <Image
                      accessibilityLabel={direction === 'ascending' ? 'Ascending' : 'Descending'}
                      resizeMode="contain"
                      source={{ uri: toAssetUrl(assetBaseUrl, '/images/sorting/arrow.png') }}
                      style={[
                        styles.optionArrow,
                        direction === 'descending' ? styles.descending : null,
                      ]}
                    />
                  ) : <View style={styles.optionArrow} />}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
        <Pressable
          accessibilityLabel="Close sort menu"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  optionList: {
    alignSelf: 'center',
    width: '82%',
    maxWidth: 420,
    gap: 12,
    marginBottom: '18%',
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  optionLabel: {
    flex: 1,
    color: '#deffe1',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'right',
  },
  optionIcon: { width: 46, height: 46, marginLeft: 12 },
  optionArrow: { width: 25, height: 25, marginLeft: 10 },
  descending: { transform: [{ rotate: '180deg' }] },
  closeButton: {
    position: 'absolute',
    right: 22,
    bottom: 18,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#d9ffff',
    borderRadius: 27,
    backgroundColor: '#eefdfb',
    shadowColor: '#ffffff',
    shadowOpacity: 0.75,
    shadowRadius: 4,
    elevation: 5,
  },
  closeText: { color: '#168d97', fontSize: 34, fontWeight: '300', lineHeight: 38 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
