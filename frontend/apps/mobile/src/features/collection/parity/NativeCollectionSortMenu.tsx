import { memo, useEffect, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  iconHeight: number;
}[] = [
  { key: 'releaseDate', label: 'RECENT', icon: '/images/sorting/recent.png', iconHeight: 35 },
  { key: 'favorite', label: 'FAVORITE', icon: '/images/sorting/favorite.png', iconHeight: 35 },
  { key: 'number', label: 'NUMBER', icon: '/images/sorting/number.png', iconHeight: 34 },
  { key: 'hp', label: 'HP', icon: '/images/sorting/hp.png', iconHeight: 32 },
  { key: 'name', label: 'NAME', icon: '/images/sorting/name.png', iconHeight: 16 },
  { key: 'combatPower', label: 'COMBAT POWER', icon: '/images/sorting/cp.png', iconHeight: 22 },
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

export type NativeCollectionSortMenuContentProps = {
  assetBaseUrl: string;
  direction: NativeCollectionSortDirection;
  onClose: () => void;
  onSelect: (sort: NativeCollectionSort) => void;
  sort: NativeCollectionSort;
};

type NativeCollectionSortMenuProps = NativeCollectionSortMenuContentProps & {
  open: boolean;
  presentation?: 'modal' | 'inline';
  visible?: boolean;
};

export const NativeCollectionSortMenu = memo(function NativeCollectionSortMenu({
  assetBaseUrl,
  direction,
  onClose,
  onSelect,
  open,
  presentation = 'modal',
  sort,
  visible = open,
}: NativeCollectionSortMenuProps) {
  const light = useNativeColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const reduceMotion = useOptionalNativeDevicePreferences()?.shouldReduceMotion ?? false;
  const [optionProgress] = useState(() => (
    NATIVE_SORT_OPTIONS.map(() => new Animated.Value(0))
  ));
  const [backdropProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (open) {
      optionProgress.forEach((progress) => progress.setValue(0));
      backdropProgress.setValue(0);
      if (reduceMotion) {
        optionProgress.forEach((progress) => progress.setValue(1));
        backdropProgress.setValue(1);
        return undefined;
      }
      const frame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.stagger(50, optionProgress.map((progress) => Animated.timing(progress, {
            duration: 150,
            easing: Easing.ease,
            toValue: 1,
            useNativeDriver: true,
          }))),
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
      optionProgress.forEach((progress) => progress.setValue(0));
      backdropProgress.setValue(0);
      return undefined;
    }
    const closing = Animated.parallel([
      Animated.stagger(50, optionProgress.map((progress) => Animated.timing(progress, {
        duration: 150,
        easing: Easing.ease,
        toValue: 0,
        useNativeDriver: true,
      }))),
      Animated.timing(backdropProgress, {
        duration: collectionExperienceParityContract.sortMenuTransitionMs,
        easing: Easing.inOut(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);
    closing.start();
    return () => closing.stop();
  }, [backdropProgress, open, optionProgress, reduceMotion]);

  useEffect(() => {
    if (presentation !== 'inline' || !open || Platform.OS === 'web') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose, open, presentation]);

  const content = (
    <View
      accessibilityElementsHidden={!open}
      accessibilityViewIsModal
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      pointerEvents={open ? 'auto' : 'none'}
      style={[styles.overlay, presentation === 'inline' ? styles.inlineOverlay : null]}
      testID="native-collection-sort-menu"
    >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: backdropProgress }]}
        >
          <SortBackdrop light={light} />
        </Animated.View>
        <Pressable
          accessibilityElementsHidden
          accessibilityLabel="Dismiss sort menu"
          accessibilityRole="button"
          importantForAccessibility="no-hide-descendants"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="native-collection-sort-backdrop"
        />
        <View accessibilityLabel="Sort Pokémon" style={styles.optionList}>
          {NATIVE_SORT_OPTIONS.map((option, index) => {
            const selected = option.key === sort;
            const progress = optionProgress[index];
            const animatedStyle = {
              opacity: progress,
              transform: [{
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  // CSS starts every canonical row one full viewport below
                  // its final position. A large fixed native translation is
                  // equivalent and stays on the compositor.
                  outputRange: [1_000, 0],
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
                  <Image fadeDuration={0}
                    accessibilityElementsHidden
                    resizeMode="contain"
                    source={toNativeCollectionImageSource(assetBaseUrl, option.icon)}
                    style={[styles.optionIcon, { height: option.iconHeight }]}
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
                  ) : <View style={styles.optionArrowSpacer} />}
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
            { bottom: Math.max(14, insets.bottom) },
            pressed && styles.pressed,
          ]}
        >
          <Image
            fadeDuration={0}
            accessibilityElementsHidden
            resizeMode="contain"
            source={toNativeCollectionImageSource(
              assetBaseUrl,
              light ? '/images/close-button-light.png' : '/images/close-button.png',
            )}
            style={styles.closeImage}
          />
        </Pressable>
    </View>
  );

  if (presentation === 'inline') return visible ? content : null;

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
      {content}
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' },
  inlineOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2000,
    elevation: 24,
  },
  optionList: {
    // Vite lets its three-column grid size to the longest label. At phone
    // width that resolves to 250 px and keeps COMBAT POWER on one line.
    width: 250,
    maxWidth: '86%',
    gap: 20,
    // WindowOverlay's inherited column layout vertically centers the Vite
    // grid, aligns it to the right, then moves it down by 20% of its height.
    transform: [{ translateY: 91 }],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  optionLabel: {
    flex: 1,
    color: '#deffe1',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  optionIcon: { width: 35 },
  optionArrow: { width: 20, height: 20 },
  optionArrowSpacer: { width: 20, height: 0 },
  descending: { transform: [{ rotate: '180deg' }] },
  closeButton: {
    position: 'absolute',
    right: 29,
    bottom: 14,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeImage: { width: 50, height: 50 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
