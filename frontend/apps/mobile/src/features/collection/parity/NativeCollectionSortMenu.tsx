import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collectionExperienceParityContract } from '@pokemongonexus/shared-ui-tokens';
import type { NativeCollectionSort, NativeCollectionSortDirection } from '../collectionModel';
import { useOptionalNativeDevicePreferences } from '../../settings/NativeDevicePreferencesProvider';
import { useNativeColorScheme } from '../../settings/useNativeColorScheme';
import { toNativeCollectionImageSource } from './nativeCollectionImageSource';

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

const SortBackdrop = ({ light }: { light: boolean }) => (
  <LinearGradient
    colors={[light ? '#e0f0e5' : '#111111', '#34807d']}
    end={{ x: 1, y: 1 }}
    pointerEvents="none"
    start={{ x: 0, y: 0 }}
    style={StyleSheet.absoluteFill}
    testID="native-collection-sort-menu-background"
  />
);

export const NativeCollectionSortMenu = memo(function NativeCollectionSortMenu({
  assetBaseUrl,
  direction,
  onClose,
  onCancelPreview,
  onPreview,
  onSelect,
  open,
  sort,
  visible = open,
}: {
  assetBaseUrl: string;
  direction: NativeCollectionSortDirection;
  onClose: () => void;
  onCancelPreview?: (sort: NativeCollectionSort) => void;
  onPreview?: (sort: NativeCollectionSort) => void;
  onSelect: (sort: NativeCollectionSort) => void;
  open: boolean;
  sort: NativeCollectionSort;
  visible?: boolean;
}) {
  const light = useNativeColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const reduceMotion = useOptionalNativeDevicePreferences()?.shouldReduceMotion ?? false;
  const [progress] = useState(() => new Animated.Value(0));
  const [backdropProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (open) {
      progress.setValue(0);
      backdropProgress.setValue(0);
      if (reduceMotion) {
        progress.setValue(1);
        backdropProgress.setValue(1);
        return undefined;
      }
      const frame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(progress, {
            damping: 19,
            mass: 0.85,
            stiffness: 145,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(backdropProgress, {
            duration: collectionExperienceParityContract.sortMenuTransitionMs,
            easing: Easing.inOut(Easing.ease),
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (reduceMotion) {
      progress.setValue(0);
      backdropProgress.setValue(0);
      return undefined;
    }
    const closing = Animated.parallel([
      Animated.timing(progress, {
        duration: 180,
        easing: Easing.in(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(backdropProgress, {
        duration: collectionExperienceParityContract.sortMenuTransitionMs,
        easing: Easing.inOut(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);
    closing.start();
    return () => closing.stop();
  }, [backdropProgress, open, progress, reduceMotion]);

  return (
    <Modal
      // Own the canonical 250 ms opacity transition on the native driver. An
      // Android Modal fade delayed mounting before this content could begin
      // its own motion, producing a visible dead tap.
      animationType="none"
      hardwareAccelerated
      navigationBarTranslucent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        accessibilityElementsHidden={!open}
        accessibilityViewIsModal
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        pointerEvents={open ? 'auto' : 'none'}
        style={styles.overlay}
        testID="native-collection-sort-menu"
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: backdropProgress }]}
        >
          <SortBackdrop light={light} />
        </Animated.View>
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
                  onPressIn={onPreview ? () => onPreview(option.key) : undefined}
                  onPressOut={onCancelPreview ? () => onCancelPreview(option.key) : undefined}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Image fadeDuration={0}
                    accessibilityElementsHidden
                    resizeMode="contain"
                    source={toNativeCollectionImageSource(assetBaseUrl, option.icon)}
                    style={styles.optionIcon}
                  />
                  {selected ? (
                    <Image fadeDuration={0}
                      accessibilityLabel={direction === 'ascending' ? 'Ascending' : 'Descending'}
                      resizeMode="contain"
                      source={toNativeCollectionImageSource(assetBaseUrl, '/images/sorting/arrow.png')}
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
          style={({ pressed }) => [
            styles.closeButton,
            { bottom: Math.max(18, insets.bottom) },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
    </Modal>
  );
});

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
