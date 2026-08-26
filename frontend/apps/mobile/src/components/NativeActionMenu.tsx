import { useEffect, useState } from 'react';
import {
  Animated,
  Appearance,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { useOptionalNativeDevicePreferences } from '../features/settings/NativeDevicePreferencesProvider';

type Props = {
  assetBaseUrl: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
  visible: boolean;
};

type Destination = {
  icon: string;
  label: string;
  path: string;
};

const DESTINATIONS: Destination[] = [
  { icon: '/images/btn_raid.png', label: 'Raid', path: '/raid' },
  { icon: '/images/btn_pokedex.png', label: 'Pokedex', path: '/pokedex' },
  { icon: '/images/btn_pvp.png', label: 'PvP', path: '/pvp' },
  { icon: '/images/btn_search.png', label: 'Search', path: '/search' },
  { icon: '/images/btn_home.png', label: 'Home', path: '/' },
  { icon: '/images/btn_trades.png', label: 'Trades', path: '/trades' },
  { icon: '/images/btn_pokemon.png', label: 'Pokémon', path: '/pokemon' },
  { icon: '/images/btn_max.png', label: 'Max Battles', path: '/max' },
  { icon: '/images/btn_rankings.png', label: 'Rankings', path: '/rankings' },
];

const SUPPORT_DESTINATIONS = [
  ['Getting Started', '/getting-started'],
  ['FAQ', '/faq'],
  ['About', '/about'],
  ['Trade Safety', '/safety'],
  ['Help directory', '/help'],
] as const;

const RADIAL_POSITIONS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [0, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
] as const;

const clamp = (value: number, minimum: number, maximum: number): number => (
  Math.min(maximum, Math.max(minimum, value))
);

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

const HelpGlyph = ({ color, ink }: { color: string; ink: string }) => (
  <View style={[styles.helpGlyph, { backgroundColor: color }]}>
    <Text maxFontSizeMultiplier={1} style={[styles.helpGlyphText, { color: ink }]}>?</Text>
  </View>
);

const NativeThemeSwitch = ({
  dark,
  onPress,
}: {
  dark: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityLabel={`Use ${dark ? 'light' : 'dark'} theme`}
    accessibilityRole="switch"
    accessibilityState={{ checked: dark }}
    onPress={onPress}
    style={[styles.themeSwitch, dark ? styles.themeSwitchDark : styles.themeSwitchLight]}
  >
    {dark ? (
      <>
        <Text maxFontSizeMultiplier={1} style={styles.themeStars}>✦ ·</Text>
        <View style={[styles.themeOrb, styles.themeMoon]}>
          <View style={[styles.moonCrater, styles.moonCraterOne]} />
          <View style={[styles.moonCrater, styles.moonCraterTwo]} />
        </View>
      </>
    ) : (
      <>
        <View style={[styles.themeOrb, styles.themeSun]} />
        <Svg height={22} style={styles.themeCloud} viewBox="0 0 36 22" width={36}>
          <Path
            d="M3 19h28c2 0 3-1.5 3-3.3 0-2-1.5-3.5-3.5-3.5h-1C29 8.1 26 5 22 5c-3.5 0-6.4 2.2-7.5 5.3A6.2 6.2 0 0 0 4 12.8C1.5 13 0 14.5 0 16.5 0 18 1.2 19 3 19Z"
            fill="#eef7fb"
            opacity={0.92}
          />
        </Svg>
      </>
    )}
  </Pressable>
);

export const NativeActionMenu = ({
  assetBaseUrl,
  onClose,
  onNavigate,
  visible,
}: Props) => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const devicePreferences = useOptionalNativeDevicePreferences();
  const light = scheme === 'light';
  const { height, width } = useWindowDimensions();
  const [supportOpen, setSupportOpen] = useState(false);
  const [menuProgress] = useState(() => new Animated.Value(0));

  const short = height <= 620;
  const palette = light ? LIGHT : DARK;
  const shortestSide = Math.min(width, height);
  const iconSize = short
    ? clamp(height * 0.14, 54, 78)
    : clamp(width * 0.08, 66, 150);
  const columnOffset = clamp(shortestSide * 0.24, 112, 250);
  const rowOffset = short
    ? clamp(height * 0.22, 90, 126)
    : clamp(shortestSide * 0.22, 116, 220);
  const destinationWidth = Math.min(122, width / 3);
  const destinationHeight = iconSize + 29;
  const topInset = Platform.OS === 'android' ? 16 : insets.top + 12;
  const bottomInset = Math.max(
    insets.bottom,
    // Full-screen Android modals can report a zero safe-area inset even when
    // gesture navigation still reserves the bottom system strip.
    Platform.OS === 'android' ? 40 : 0,
  ) + 16;

  useEffect(() => {
    if (!visible) {
      menuProgress.setValue(0);
      return undefined;
    }

    menuProgress.setValue(0);
    const animation = Animated.timing(menuProgress, {
      delay: 75,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [menuProgress, visible]);

  const navigate = (path: string) => {
    setSupportOpen(false);
    onNavigate(path);
  };
  const close = () => {
    setSupportOpen(false);
    onClose();
  };
  const toggleTheme = devicePreferences?.toggleColorTheme
    ?? (() => Appearance.setColorScheme(light ? 'dark' : 'light'));

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      navigationBarTranslucent
      onRequestClose={supportOpen ? () => setSupportOpen(false) : close}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
    >
      <View
        accessibilityLabel="Quick navigation"
        accessibilityViewIsModal
        style={styles.overlay}
        testID="native-action-menu"
      >
        <StatusBar hidden />
        <Svg height="100%" pointerEvents="none" style={StyleSheet.absoluteFill} width="100%">
          <Defs>
            <LinearGradient id="action-menu-gradient" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor={palette.gradientStart} />
              <Stop offset="1" stopColor={palette.gradientEnd} />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#action-menu-gradient)" height="100%" width="100%" />
        </Svg>

        <Pressable
          accessibilityLabel="Share Trade Board"
          accessibilityRole="button"
          onPress={() => navigate('/trade-board')}
          style={[
            styles.cornerButton,
            styles.tradeBoardButton,
            { backgroundColor: palette.surface, borderColor: palette.border, top: topInset },
          ]}
        >
          <ShareGlyph color={palette.trade} />
          <Text
            maxFontSizeMultiplier={1}
            numberOfLines={2}
            style={[styles.cornerLabel, styles.tradeBoardLabel, { color: palette.text }]}
          >
            Share Trade Board
          </Text>
        </Pressable>

        <View style={[styles.settingsCluster, { top: topInset }]}>
          <Pressable
            accessibilityLabel="Settings"
            accessibilityRole="button"
            onPress={() => navigate('/settings')}
            style={[styles.cornerButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text maxFontSizeMultiplier={1} style={[styles.cornerLabel, { color: palette.text }]}>Settings</Text>
            <Image
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/btn_settings.png') }}
              style={[styles.cornerImage, light && styles.cornerImageLight]}
            />
          </Pressable>
          <NativeThemeSwitch dark={!light} onPress={toggleTheme} />
        </View>

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {DESTINATIONS.map((destination, index) => {
            const [column, row] = RADIAL_POSITIONS[index] ?? [0, 0];
            const left = (width / 2) + (column * columnOffset) - (destinationWidth / 2);
            const top = (height / 2) + (row * rowOffset) - (destinationHeight / 2);
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
                    transform: [{
                      translateY: menuProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [Math.max(120, height * 0.32), 0],
                      }),
                    }],
                    width: destinationWidth,
                  },
                ]}
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
                    maxFontSizeMultiplier={1}
                    numberOfLines={1}
                    style={[styles.destinationLabel, { color: palette.text }]}
                  >
                    {destination.label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          onPress={() => navigate('/profile')}
          style={[
            styles.cornerButton,
            styles.profileButton,
            { backgroundColor: palette.surface, borderColor: palette.border, bottom: bottomInset },
          ]}
        >
          <Text maxFontSizeMultiplier={1} style={[styles.cornerLabel, { color: palette.text }]}>Profile</Text>
          <Image
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/profile-icon.png') }}
            style={[styles.cornerImage, light && styles.cornerImageLight]}
          />
        </Pressable>

        <View style={[styles.supportCluster, { bottom: bottomInset }]}>
          {supportOpen ? (
            <View
              style={[
                styles.supportPanel,
                { backgroundColor: palette.panel, borderColor: palette.border },
              ]}
            >
              <Text maxFontSizeMultiplier={1} style={[styles.supportEyebrow, { color: palette.focus }]}>LEARN &amp; SUPPORT</Text>
              {SUPPORT_DESTINATIONS.map(([label, path]) => (
                <Pressable
                  accessibilityRole="button"
                  key={path}
                  onPress={() => navigate(path)}
                  style={({ pressed }) => [styles.supportLink, pressed && styles.pressed]}
                >
                  <Text maxFontSizeMultiplier={1} style={[styles.supportLinkIcon, { color: palette.focus }]}>›</Text>
                  <Text maxFontSizeMultiplier={1} style={[styles.supportLinkText, { color: palette.text }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Pressable
            accessibilityLabel="Learn and support"
            accessibilityRole="button"
            accessibilityState={{ expanded: supportOpen }}
            onPress={() => setSupportOpen((current) => !current)}
            style={[styles.cornerButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <HelpGlyph color={palette.focus} ink={light ? '#ffffff' : '#07252a'} />
            <Text maxFontSizeMultiplier={1} style={[styles.cornerLabel, { color: palette.text }]}>Learn &amp; support</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={close}
          style={[styles.closeButton, { bottom: bottomInset - 4 }]}
        >
          <Image
            resizeMode="contain"
            source={{
              uri: toAssetUrl(
                assetBaseUrl,
                light ? '/images/close-button-light.png' : '/images/close-button.png',
              ),
            }}
            style={styles.closeImage}
          />
        </Pressable>
      </View>
    </Modal>
  );
};

const DARK = {
  border: 'rgba(111, 217, 207, 0.44)',
  focus: '#82eee3',
  gradientEnd: '#34807d',
  gradientStart: '#111111',
  panel: 'rgba(7, 27, 31, 0.96)',
  surface: 'rgba(7, 27, 31, 0.72)',
  text: '#f7fcff',
  trade: '#63e2b4',
};

const LIGHT = {
  border: 'rgba(64, 126, 128, 0.42)',
  focus: '#006c78',
  gradientEnd: '#8fcfc7',
  gradientStart: '#f8fbff',
  panel: 'rgba(255, 255, 255, 0.96)',
  surface: 'rgba(255, 255, 255, 0.74)',
  text: '#173b42',
  trade: '#087454',
};

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  destination: { position: 'absolute' },
  destinationPressable: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  destinationLabel: {
    maxWidth: '100%',
    marginTop: 3,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  cornerButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  cornerLabel: { fontSize: 14, fontWeight: '800', lineHeight: 16 },
  tradeBoardLabel: { maxWidth: 84, textAlign: 'left' },
  cornerImage: { width: 40, height: 40, resizeMode: 'contain' },
  cornerImageLight: { padding: 4, borderRadius: 20, backgroundColor: '#214f55' },
  tradeBoardButton: { position: 'absolute', left: 16, zIndex: 5 },
  settingsCluster: {
    position: 'absolute',
    right: 16,
    zIndex: 5,
    alignItems: 'flex-end',
    gap: 7,
  },
  themeSwitch: { width: 60, height: 34, overflow: 'hidden', borderRadius: 999 },
  themeSwitchDark: { backgroundColor: '#000000' },
  themeSwitchLight: { backgroundColor: '#2196f3' },
  themeOrb: { position: 'absolute', top: 4, width: 26, height: 26, borderRadius: 13 },
  themeMoon: { right: 4, backgroundColor: '#f8fbff' },
  themeSun: { left: 4, backgroundColor: '#fff200' },
  themeStars: {
    position: 'absolute',
    top: 2,
    left: 6,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  themeCloud: { position: 'absolute', right: -3, bottom: -3 },
  moonCrater: { position: 'absolute', borderRadius: 999, backgroundColor: '#8b9299' },
  moonCraterOne: { top: 5, left: 8, width: 7, height: 7 },
  moonCraterTwo: { right: 4, bottom: 5, width: 4, height: 4 },
  profileButton: { position: 'absolute', left: 16, zIndex: 5 },
  supportCluster: { position: 'absolute', right: 16, zIndex: 6, alignItems: 'flex-end' },
  supportPanel: {
    width: 250,
    marginBottom: 8,
    padding: 10,
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
  supportLinkIcon: { width: 18, fontSize: 25, fontWeight: '800' },
  supportLinkText: { fontSize: 14, fontWeight: '800' },
  helpGlyph: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  helpGlyphText: { fontSize: 16, fontWeight: '900', lineHeight: 20 },
  closeButton: { position: 'absolute', left: '50%', zIndex: 10, marginLeft: -27 },
  closeImage: { width: 54, height: 54 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});
