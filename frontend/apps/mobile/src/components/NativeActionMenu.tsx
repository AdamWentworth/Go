import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Appearance,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Line,
  Path,
} from 'react-native-svg';
import {
  useOptionalNativeDevicePreferences,
} from '../features/settings/NativeDevicePreferencesProvider';
import { useOptionalNativeSession } from '../auth/NativeSessionContext';
import { useNativeFriendsQuery } from '../features/social/socialQueries';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import { useNativeAppLoading } from './NativeAppLoadingProvider';

type Props = {
  assetBaseUrl: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
  /** Overrides the live session for isolated visual/device fixtures. */
  signedIn?: boolean;
  /** Supplies deterministic friend-request state to isolated visual/device fixtures. */
  pendingFriendCount?: number;
  visible: boolean;
};

type Destination = {
  icon: string;
  label: string;
  path: string;
};

const DESTINATIONS: Destination[] = [
  { icon: '/images/btn_raid.png', label: 'Raid', path: '/raid' },
  { icon: '/images/btn_pokedex.png', label: 'Pokédex', path: '/pokedex' },
  { icon: '/images/btn_pvp.png', label: 'PvP', path: '/pvp' },
  { icon: '/images/btn_search.png', label: 'Search', path: '/search' },
  { icon: '/images/btn_home.png', label: 'Home', path: '/' },
  { icon: '/images/btn_trades.png', label: 'Trades', path: '/trades' },
  { icon: '/images/btn_pokemon.png', label: 'Pokémon', path: '/pokemon' },
  { icon: '/images/btn_max.png', label: 'Max Battles', path: '/max' },
  { icon: '/images/btn_rankings.png', label: 'Rankings', path: '/rankings' },
];

const SUPPORT_DESTINATIONS = [
  { glyph: 'compass', label: 'Getting Started', path: '/getting-started' },
  { glyph: 'question', label: 'FAQ', path: '/faq' },
  { glyph: 'info', label: 'About', path: '/about' },
  { glyph: 'shield', label: 'Trade Safety', path: '/safety' },
  { glyph: 'book', label: 'Help directory', path: '/help' },
] as const;

const ACTION_MENU_NAVIGATION_SOURCE = 'action-menu-navigation';

type SupportGlyphName = typeof SUPPORT_DESTINATIONS[number]['glyph'];

const RADIAL_POSITIONS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [0, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
] as const;

const clamp = (value: number, minimum: number, maximum: number): number => (
  Math.min(maximum, Math.max(minimum, value))
);

export const getNativeActionMenuGeometry = (
  width: number,
  height: number,
  bottomInset: number,
) => {
  const short = height <= 620;
  const shortestSide = Math.min(width, height);
  const iconSize = short
    ? clamp(height * 0.14, 54, 78)
    : clamp(width * 0.08, 66, 150);
  const closeBottom = Math.max(20, bottomInset);
  return {
    bottomCornerMaxWidth: Math.max(96, (width / 2) - 49),
    closeBottom,
    closeSize: width <= 480
      ? clamp(width * 0.12, 50, 80)
      : width < 768
        ? clamp(width * 0.1, 60, 90)
        : clamp(width * 0.035, 60, 80),
    closedDestinationY: (height / 2) - Math.max(25, bottomInset),
    columnOffset: clamp(shortestSide * 0.24, 112, 250),
    cornerBottom: Math.max(16, bottomInset),
    cornerIconSize: clamp(width * 0.04, 30, 40),
    destinationFontSize: short
      ? clamp(height * 0.028, 12.48, 16.8)
      : clamp(width * 0.015, 16.8, 28),
    destinationHeight: iconSize + 38,
    destinationWidth: clamp(width * 0.28, 92, 160),
    iconSize,
    rowOffset: short
      ? clamp(height * 0.22, 90, 126)
      : clamp(shortestSide * 0.22, 116, 220),
    smallUtilityFontSize: clamp(width * 0.0125, 12.48, 16.8),
    supportPanelWidth: width <= 520
      ? Math.max(240, width - 16)
      : Math.min(304, width - 32),
    utilityFontSize: width <= 520 ? 14.4 : clamp(width * 0.015, 15.2, 20),
  };
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const ShareGlyph = ({ color }: { color: string }) => (
  <Svg height={20} viewBox="0 0 24 24" width={20}>
    <Line stroke={color} strokeLinecap="round" strokeWidth={2.6} x1={7} x2={17} y1={8} y2={5} />
    <Line stroke={color} strokeLinecap="round" strokeWidth={2.6} x1={7} x2={17} y1={16} y2={19} />
    <Circle cx={5} cy={12} fill={color} r={3.1} />
    <Circle cx={19} cy={4} fill={color} r={3.1} />
    <Circle cx={19} cy={20} fill={color} r={3.1} />
  </Svg>
);

const HelpGlyph = ({ color }: { color: string }) => (
  <Svg height={20} viewBox="0 0 24 24" width={20}>
    <Path
      d="M3 4.5h6.1A3.9 3.9 0 0 1 12 5.8v14.1a4.7 4.7 0 0 0-3.5-1.4H3v-14Zm18 0h-6.1A3.9 3.9 0 0 0 12 5.8v14.1a4.7 4.7 0 0 1 3.5-1.4H21v-14Z"
      fill={color}
    />
  </Svg>
);

const SupportGlyph = ({ color, name }: { color: string; name: SupportGlyphName }) => {
  if (name === 'compass') {
    return (
      <Svg height={14} viewBox="0 0 24 24" width={14}>
        <Circle cx={12} cy={12} fill="none" r={9} stroke={color} strokeWidth={2} />
        <Path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z" fill={color} />
      </Svg>
    );
  }
  if (name === 'question') {
    return (
      <Svg height={14} viewBox="0 0 24 24" width={14}>
        <Circle cx={12} cy={12} fill="none" r={9} stroke={color} strokeWidth={2} />
        <Path d="M9.7 9a2.5 2.5 0 1 1 3.3 2.36c-.8.3-1 .8-1 1.64" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2} />
        <Circle cx={12} cy={17} fill={color} r={1.1} />
      </Svg>
    );
  }
  if (name === 'info') {
    return (
      <Svg height={14} viewBox="0 0 24 24" width={14}>
        <Circle cx={12} cy={12} fill="none" r={9} stroke={color} strokeWidth={2} />
        <Circle cx={12} cy={7.7} fill={color} r={1.1} />
        <Line stroke={color} strokeLinecap="round" strokeWidth={2} x1={12} x2={12} y1={11} y2={17} />
      </Svg>
    );
  }
  if (name === 'shield') {
    return (
      <Svg height={14} viewBox="0 0 24 24" width={14}>
        <Path d="M12 3 20 6v5.4c0 4.7-3.1 7.7-8 9.6-4.9-1.9-8-4.9-8-9.6V6l8-3Z" fill="none" stroke={color} strokeLinejoin="round" strokeWidth={2} />
        <Path d="m8.5 12 2.2 2.2 4.8-5" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      </Svg>
    );
  }
  return (
    <Svg height={14} viewBox="0 0 24 24" width={14}>
      <Path d="M4.5 4.5H10a2 2 0 0 1 2 2V20a3.5 3.5 0 0 0-3.5-3.5h-4v-12Zm15 0H14a2 2 0 0 0-2 2V20a3.5 3.5 0 0 1 3.5-3.5h4v-12Z" fill="none" stroke={color} strokeLinejoin="round" strokeWidth={2} />
    </Svg>
  );
};

const NativeThemeSwitch = ({
  dark,
  onPress,
  reduceMotion,
}: {
  dark: boolean;
  onPress: () => void;
  reduceMotion: boolean;
}) => {
  const [progress] = useState(() => new Animated.Value(dark ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(dark ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      toValue: dark ? 1 : 0,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [dark, progress, reduceMotion]);

  return (
    <Pressable
      aria-checked={dark}
      accessibilityLabel={`Use ${dark ? 'light' : 'dark'} theme`}
      accessibilityRole="switch"
      accessibilityState={{ checked: dark }}
      onPress={onPress}
      style={styles.themeSwitch}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.themeTrack,
          {
            backgroundColor: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['#2196f3', '#000000'],
            }),
          },
        ]}
      >
        <Animated.View style={[styles.themeStars, { opacity: progress }]}>
          <Text maxFontSizeMultiplier={1} style={[styles.themeStar, styles.themeStarOne]}>✦</Text>
          <Text maxFontSizeMultiplier={1} style={[styles.themeStar, styles.themeStarTwo]}>✦</Text>
          <Text maxFontSizeMultiplier={1} style={[styles.themeStar, styles.themeStarThree]}>✦</Text>
          <Text maxFontSizeMultiplier={1} style={[styles.themeStar, styles.themeStarFour]}>✦</Text>
        </Animated.View>
        <Svg height={22} style={styles.themeCloud} viewBox="0 0 36 22" width={36}>
          <Path
            d="M3 19h28c2 0 3-1.5 3-3.3 0-2-1.5-3.5-3.5-3.5h-1C29 8.1 26 5 22 5c-3.5 0-6.4 2.2-7.5 5.3A6.2 6.2 0 0 0 4 12.8C1.5 13 0 14.5 0 16.5 0 18 1.2 19 3 19Z"
            fill={dark ? '#cccccc' : '#eeeeee'}
            opacity={0.92}
          />
        </Svg>
        <Animated.View
          style={[
            styles.themeOrb,
            {
              backgroundColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['#fff200', '#f8fbff'],
              }),
              transform: [{
                translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 26] }),
              }],
            },
          ]}
        >
          <Animated.View style={[styles.moonCrater, styles.moonCraterOne, { opacity: progress }]} />
          <Animated.View style={[styles.moonCrater, styles.moonCraterTwo, { opacity: progress }]} />
          <Animated.View style={[styles.moonCrater, styles.moonCraterThree, { opacity: progress }]} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const NativeProfileButton = ({
  assetBaseUrl,
  bottom,
  count,
  iconSize,
  light,
  labelFontSize,
  maxWidth,
  onPress,
  palette,
}: {
  assetBaseUrl: string;
  bottom: number;
  count: number;
  iconSize: number;
  light: boolean;
  labelFontSize: number;
  maxWidth: number;
  onPress: () => void;
  palette: typeof DARK;
}) => {
  const normalizedCount = Math.max(0, Math.floor(count));
  const accessibilityLabel = normalizedCount > 0
    ? `Profile, ${normalizedCount} pending friend ${normalizedCount === 1 ? 'request' : 'requests'}`
    : 'Profile';
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.cornerButton,
        styles.profileButton,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          bottom,
          maxWidth,
        },
      ]}
      testID="native-action-menu-profile"
    >
      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.15}
        minimumFontScale={0.85}
        numberOfLines={1}
        style={[styles.cornerLabel, { color: palette.text, fontSize: labelFontSize }]}
      >
        Profile
      </Text>
      <View style={styles.profileImageWrap}>
        <Image
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/profile-icon.png') }}
          style={[
            styles.cornerImage,
            { height: iconSize, width: iconSize },
            light && styles.cornerImageLight,
          ]}
          testID="native-action-menu-profile-icon"
        />
        {normalizedCount > 0 ? (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.notification, { borderColor: palette.surface }]}>
            <Text maxFontSizeMultiplier={1} style={styles.notificationText}>
              {normalizedCount > 9 ? '9+' : normalizedCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const LiveNativeProfileButton = ({ viewerId, ...props }: Omit<Parameters<typeof NativeProfileButton>[0], 'count'> & { viewerId: string }) => {
  const friendsQuery = useNativeFriendsQuery(viewerId);
  return <NativeProfileButton {...props} count={friendsQuery.data?.incoming.length ?? 0} />;
};

export const NativeActionMenu = ({
  assetBaseUrl,
  onClose,
  onNavigate,
  pendingFriendCount = 0,
  signedIn,
  visible,
}: Props) => {
  const insets = useSafeAreaInsets();
  const scheme = useNativeColorScheme();
  const devicePreferences = useOptionalNativeDevicePreferences();
  const { runWithLoading } = useNativeAppLoading();
  const session = useOptionalNativeSession();
  const isSignedIn = signedIn ?? Boolean(session?.user);
  const reduceMotion = devicePreferences?.shouldReduceMotion ?? false;
  const light = scheme === 'light';
  const { height, width } = useWindowDimensions();
  const [supportOpen, setSupportOpen] = useState(false);
  const [menuProgress] = useState(() => new Animated.Value(0));
  const [supportProgress] = useState(() => new Animated.Value(0));
  const closeEnabledRef = useRef(false);
  const closingRef = useRef(false);

  const palette = light ? LIGHT : DARK;
  const {
    bottomCornerMaxWidth,
    closeBottom,
    closeSize,
    closedDestinationY,
    columnOffset,
    cornerBottom,
    cornerIconSize,
    destinationFontSize,
    destinationHeight,
    destinationWidth,
    iconSize,
    rowOffset,
    smallUtilityFontSize,
    supportPanelWidth,
    utilityFontSize,
  } = getNativeActionMenuGeometry(width, height, insets.bottom);
  const topInset = Math.max(16, insets.top);

  useEffect(() => {
    if (!visible) {
      menuProgress.setValue(0);
      closeEnabledRef.current = false;
      closingRef.current = false;
      return undefined;
    }

    if (reduceMotion) {
      menuProgress.setValue(1);
      closeEnabledRef.current = true;
      return undefined;
    }

    closingRef.current = false;
    closeEnabledRef.current = false;
    menuProgress.setValue(0);
    const animation = Animated.timing(menuProgress, {
      delay: 75,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) closeEnabledRef.current = true;
    });
    return () => animation.stop();
  }, [menuProgress, reduceMotion, visible]);

  useEffect(() => {
    if (!supportOpen) {
      supportProgress.setValue(0);
      return undefined;
    }
    if (reduceMotion) {
      supportProgress.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(supportProgress, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, supportOpen, supportProgress]);

  const navigate = (path: string) => {
    if (closingRef.current) return;
    closingRef.current = true;
    closeEnabledRef.current = false;
    setSupportOpen(false);
    runWithLoading(ACTION_MENU_NAVIGATION_SOURCE, () => {
      // Do not leave the menu's separate Android window underneath the route
      // loader. Gesture-navigation areas can expose the window below a
      // transparent modal even when the loader content fills the viewport.
      onClose();
      onNavigate(path);
    });
  };
  const close = () => {
    if (!closeEnabledRef.current || closingRef.current) return;
    closingRef.current = true;
    closeEnabledRef.current = false;
    setSupportOpen(false);
    if (reduceMotion) {
      onClose();
      return;
    }
    Animated.timing(menuProgress, {
      duration: 300,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };
  const toggleTheme = devicePreferences?.toggleColorTheme
    ?? (() => Appearance.setColorScheme(light ? 'dark' : 'light'));

  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      navigationBarTranslucent
      onRequestClose={supportOpen ? () => setSupportOpen(false) : close}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Animated.View
        accessibilityLabel="Quick navigation"
        accessibilityViewIsModal
        style={[
          styles.overlay,
          {
            backgroundColor: palette.gradientEnd,
            opacity: menuProgress,
          },
        ]}
        testID="native-action-menu"
      >
        <LinearGradient
          colors={[palette.gradientStart, palette.gradientEnd]}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
          testID="native-action-menu-background"
        />

        {isSignedIn ? (
          <Pressable
            accessibilityLabel="Share Trade Board"
            accessibilityRole="button"
            onPress={() => navigate('/trade-board')}
            style={[
              styles.cornerButton,
              styles.tradeBoardButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                top: topInset,
              },
            ]}
          >
            <ShareGlyph color={palette.trade} />
              <Text
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.15}
                minimumFontScale={0.9}
                numberOfLines={2}
              style={[
                styles.cornerLabel,
                styles.tradeBoardLabel,
                { color: palette.text, fontSize: smallUtilityFontSize },
              ]}
            >
              Share Trade Board
            </Text>
          </Pressable>
        ) : null}

        <View
          style={[styles.settingsCluster, { top: topInset }]}
          testID="native-action-menu-settings-cluster"
        >
          <Pressable
            accessibilityLabel="Settings"
            accessibilityRole="button"
            onPress={() => navigate('/settings')}
            style={[
              styles.cornerButton,
              styles.settingsButton,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
              minimumFontScale={0.85}
              numberOfLines={1}
              style={[styles.cornerLabel, { color: palette.text, fontSize: utilityFontSize }]}
            >
              Settings
            </Text>
            <Image
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/btn_settings.png') }}
              style={[
                styles.cornerImage,
                { height: cornerIconSize, width: cornerIconSize },
                light && styles.cornerImageLight,
              ]}
            />
          </Pressable>
          <NativeThemeSwitch dark={!light} onPress={toggleTheme} reduceMotion={reduceMotion} />
        </View>

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {DESTINATIONS.map((destination, index) => {
            const [column, row] = RADIAL_POSITIONS[index] ?? [0, 0];
            const left = (width / 2) - (destinationWidth / 2);
            const top = (height / 2) - (destinationHeight / 2);
            return (
              <Animated.View
                key={destination.path}
                style={[
                  styles.destination,
                  {
                    height: destinationHeight,
                    left,
                    opacity: menuProgress,
                    top,
                    transform: [
                      {
                        translateX: menuProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, column * columnOffset],
                        }),
                      },
                      {
                        translateY: menuProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [closedDestinationY, row * rowOffset],
                        }),
                      },
                    ],
                    width: destinationWidth,
                  },
                ]}
                testID={`native-action-menu-item-${destination.path === '/' ? 'home' : destination.path.slice(1)}`}
              >
                <Pressable
                  accessibilityLabel={destination.label}
                  accessibilityRole="button"
                  onPress={() => navigate(destination.path)}
                  style={({ pressed }) => [styles.destinationPressable, pressed && styles.pressed]}
                  testID={`native-action-menu-destination-${destination.path === '/' ? 'home' : destination.path.slice(1)}`}
                >
                  <Image
                    resizeMode="contain"
                    source={{ uri: toAssetUrl(assetBaseUrl, destination.icon) }}
                    style={{ height: iconSize, width: iconSize }}
                  />
                  <Text
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={1.15}
                    minimumFontScale={0.78}
                    numberOfLines={1}
                    style={[
                      styles.destinationLabel,
                      { color: palette.text, fontSize: destinationFontSize, width: destinationWidth },
                    ]}
                  >
                    {destination.label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {isSignedIn ? (
          session?.user ? (
            <LiveNativeProfileButton
              assetBaseUrl={assetBaseUrl}
              bottom={cornerBottom}
              iconSize={cornerIconSize}
              labelFontSize={utilityFontSize}
              light={light}
              maxWidth={bottomCornerMaxWidth}
              onPress={() => navigate('/profile')}
              palette={palette}
              viewerId={session.user.user_id}
            />
          ) : (
            <NativeProfileButton
              assetBaseUrl={assetBaseUrl}
              bottom={cornerBottom}
              count={pendingFriendCount}
              iconSize={cornerIconSize}
              labelFontSize={utilityFontSize}
              light={light}
              maxWidth={bottomCornerMaxWidth}
              onPress={() => navigate('/profile')}
              palette={palette}
            />
          )
        ) : (
          <View style={[styles.guestAuthCluster, { bottom: cornerBottom }]}>
            {[
              ['Register', '/register', '/images/register-icon.png'],
              ['Login', '/login', '/images/login-icon.png'],
            ].map(([label, path, icon]) => (
              <Pressable
                accessibilityLabel={label}
                accessibilityRole="button"
                key={path}
                onPress={() => navigate(path)}
                style={[
                  styles.cornerButton,
                  styles.guestAuthButton,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <Text
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.15}
                  minimumFontScale={0.85}
                  numberOfLines={1}
                  style={[styles.cornerLabel, { color: palette.text, fontSize: utilityFontSize }]}
                >
                  {label}
                </Text>
                <Image
                  source={{ uri: toAssetUrl(assetBaseUrl, icon) }}
                  style={[styles.guestAuthImage, light && styles.cornerImageLight]}
                />
              </Pressable>
            ))}
          </View>
        )}

        <View
          style={[styles.supportCluster, { bottom: cornerBottom }]}
          testID="native-action-menu-support-cluster"
        >
          {supportOpen ? (
            <Animated.View
              style={[
                styles.supportPanel,
                {
                  backgroundColor: palette.panel,
                  borderColor: palette.border,
                  marginRight: width <= 520 ? -8 : 0,
                  opacity: supportProgress,
                  transform: [{
                    translateY: supportProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [6.4, 0],
                    }),
                  }, {
                    scale: supportProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  }],
                  width: supportPanelWidth,
                },
              ]}
              testID="native-action-menu-support-panel"
            >
              <Text style={[styles.supportEyebrow, { color: palette.focus }]}>LEARN &amp; SUPPORT</Text>
              {SUPPORT_DESTINATIONS.map(({ glyph, label, path }) => (
                <Pressable
                  accessibilityRole="button"
                  key={path}
                  onPress={() => navigate(path)}
                  style={({ pressed }) => [styles.supportLink, pressed && styles.pressed]}
                >
                  <View style={styles.supportLinkIcon} testID={`native-support-glyph-${glyph}`}>
                    <SupportGlyph color={palette.focus} name={glyph} />
                  </View>
                  <Text style={[styles.supportLinkText, { color: palette.text }]}>{label}</Text>
                </Pressable>
              ))}
            </Animated.View>
          ) : null}
          <Pressable
            accessibilityLabel="Learn and support"
            accessibilityRole="button"
            accessibilityState={{ expanded: supportOpen }}
            onPress={() => setSupportOpen((current) => !current)}
            style={[
              styles.cornerButton,
              styles.helpButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                maxWidth: bottomCornerMaxWidth,
              },
            ]}
          >
            <HelpGlyph color={palette.focus} />
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
              minimumFontScale={0.8}
              numberOfLines={1}
              style={[styles.cornerLabel, { color: palette.text, fontSize: smallUtilityFontSize }]}
            >
              Learn &amp; support
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={close}
          style={[
            styles.closeButton,
            {
              bottom: closeBottom,
              height: closeSize,
              marginLeft: -(closeSize / 2),
              width: closeSize,
            },
          ]}
          testID="native-action-menu-close"
        >
          <Image
            resizeMode="contain"
            source={{
              uri: toAssetUrl(
                assetBaseUrl,
                light ? '/images/close-button-light.png' : '/images/close-button.png',
              ),
            }}
            style={{ height: closeSize, width: closeSize }}
          />
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const DARK = {
  border: 'rgba(111, 217, 207, 0.44)',
  focus: '#82eee3',
  gradientEnd: '#34807d',
  gradientStart: '#111111',
  panel: 'rgba(17, 17, 17, 0.92)',
  surface: 'rgba(7, 27, 31, 0.72)',
  text: '#f7fcff',
  trade: '#63e2b4',
};

const LIGHT = {
  border: 'rgba(64, 126, 128, 0.42)',
  focus: '#006c78',
  gradientEnd: '#8fcfc7',
  gradientStart: '#f8fbff',
  panel: 'rgba(248, 251, 255, 0.92)',
  surface: 'rgba(255, 255, 255, 0.74)',
  text: '#173b42',
  trade: '#087454',
};

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  destination: { position: 'absolute' },
  destinationPressable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  destinationLabel: {
    marginTop: 3,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  cornerButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  cornerLabel: { minWidth: 0, flexShrink: 1, fontWeight: '800', lineHeight: 17 },
  tradeBoardLabel: { maxWidth: 84, lineHeight: 14, textAlign: 'left' },
  cornerImage: { resizeMode: 'contain' },
  cornerImageLight: { padding: 4, borderRadius: 20, backgroundColor: '#214f55' },
  tradeBoardButton: {
    position: 'absolute',
    left: 16,
    zIndex: 5,
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  settingsButton: { gap: 8, paddingLeft: 10, paddingRight: 10, paddingVertical: 7 },
  settingsCluster: {
    position: 'absolute',
    right: 16,
    zIndex: 5,
    alignItems: 'flex-end',
    gap: 7,
  },
  themeSwitch: { width: 60, height: 34, overflow: 'hidden', borderRadius: 999 },
  themeTrack: { overflow: 'hidden', borderRadius: 999 },
  themeOrb: { position: 'absolute', top: 4, width: 26, height: 26, borderRadius: 13 },
  themeStars: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 34,
    height: 34,
  },
  themeStar: {
    position: 'absolute',
    color: '#ffffff',
    fontWeight: '900',
    lineHeight: 16,
  },
  themeStarOne: { top: 1, left: 3, fontSize: 17 },
  themeStarTwo: { top: 14, left: 3, fontSize: 6 },
  themeStarThree: { top: 18, left: 10, fontSize: 10 },
  themeStarFour: { top: -1, left: 18, fontSize: 15 },
  themeCloud: { position: 'absolute', right: -3, bottom: -3 },
  moonCrater: { position: 'absolute', borderRadius: 999, backgroundColor: '#8b9299' },
  moonCraterOne: { top: 3, left: 10, width: 6, height: 6 },
  moonCraterTwo: { top: 10, left: 2, width: 10, height: 10 },
  moonCraterThree: { top: 18, left: 16, width: 3, height: 3 },
  profileButton: {
    position: 'absolute',
    left: 16,
    zIndex: 5,
    gap: 6,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 7,
  },
  profileImageWrap: { position: 'relative' },
  notification: {
    position: 'absolute',
    top: -7,
    right: -9,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderRadius: 999,
    backgroundColor: '#e94f68',
  },
  notificationText: { color: '#ffffff', fontSize: 10, fontWeight: '900', lineHeight: 12 },
  guestAuthCluster: {
    position: 'absolute',
    left: 16,
    zIndex: 6,
    alignItems: 'flex-start',
    gap: 7,
  },
  guestAuthButton: {
    minWidth: 116,
    justifyContent: 'space-between',
    gap: 6,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 7,
  },
  guestAuthImage: { width: 28, height: 28, resizeMode: 'contain' },
  supportCluster: { position: 'absolute', right: 16, zIndex: 6, alignItems: 'flex-end' },
  supportPanel: {
    marginBottom: 8,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 21,
    elevation: 12,
  },
  supportEyebrow: { paddingHorizontal: 8, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
  supportLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 8,
    borderRadius: 11,
  },
  supportLinkIcon: { width: 25, alignItems: 'center', justifyContent: 'center' },
  supportLinkText: { fontSize: 13.12, fontWeight: '800' },
  helpButton: { gap: 7, paddingHorizontal: 10, paddingVertical: 9 },
  closeButton: { position: 'absolute', left: '50%', zIndex: 10 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});
