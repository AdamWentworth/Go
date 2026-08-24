import { useState } from 'react';
import {
  Appearance,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

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

const toAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

export const NativeActionMenu = ({
  assetBaseUrl,
  onClose,
  onNavigate,
  visible,
}: Props) => {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const light = scheme === 'light';
  const { height, width } = useWindowDimensions();
  const [supportOpen, setSupportOpen] = useState(false);

  const compact = width <= 520;
  const short = height <= 700;
  const palette = light ? LIGHT : DARK;
  const iconSize = Math.min(
    compact ? 82 : 112,
    Math.max(short ? 54 : 66, Math.min(width / 4.6, height / 8.5)),
  );
  const navigate = (path: string) => {
    setSupportOpen(false);
    onNavigate(path);
  };
  const close = () => {
    setSupportOpen(false);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      hardwareAccelerated
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
            { backgroundColor: palette.surface, borderColor: palette.border, top: insets.top + 12 },
          ]}
        >
          <Text style={[styles.cornerIcon, { color: palette.trade }]}>↗</Text>
          <Text style={[styles.cornerLabel, { color: palette.text }]}>Share Trade Board</Text>
        </Pressable>

        <View
          style={[styles.settingsCluster, { top: insets.top + 12 }]}
        >
          <Pressable
            accessibilityLabel="Settings"
            accessibilityRole="button"
            onPress={() => navigate('/settings')}
            style={[styles.cornerButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={[styles.cornerLabel, { color: palette.text }]}>Settings</Text>
            <Image
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/btn_settings.png') }}
              style={styles.cornerImage}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={`Use ${light ? 'dark' : 'light'} theme`}
            accessibilityRole="switch"
            accessibilityState={{ checked: light }}
            onPress={() => Appearance.setColorScheme(light ? 'dark' : 'light')}
            style={[styles.themeSwitch, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={styles.themeGlyph}>{light ? '☀' : '☾'}</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.destinationGrid,
            {
              paddingBottom: Math.max(insets.bottom + 82, 92),
              paddingTop: Math.max(insets.top + 88, 104),
            },
          ]}
        >
          {DESTINATIONS.map((destination) => (
            <Pressable
              accessibilityLabel={destination.label}
              accessibilityRole="button"
              key={destination.path}
              onPress={() => navigate(destination.path)}
              style={styles.destination}
            >
              <Image
                resizeMode="contain"
                source={{ uri: toAssetUrl(assetBaseUrl, destination.icon) }}
                style={{ height: iconSize, width: iconSize }}
              />
              <Text numberOfLines={1} style={[styles.destinationLabel, { color: palette.text }]}>
                {destination.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          onPress={() => navigate('/profile')}
          style={[
            styles.cornerButton,
            styles.profileButton,
            { backgroundColor: palette.surface, borderColor: palette.border, bottom: insets.bottom + 12 },
          ]}
        >
          <Text style={[styles.cornerLabel, { color: palette.text }]}>Profile</Text>
          <Image
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/profile-icon.png') }}
            style={styles.cornerImage}
          />
        </Pressable>

        <View
          style={[styles.supportCluster, { bottom: insets.bottom + 12 }]}
        >
          {supportOpen ? (
            <View
              style={[
                styles.supportPanel,
                { backgroundColor: palette.panel, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.supportEyebrow, { color: palette.focus }]}>LEARN &amp; SUPPORT</Text>
              {SUPPORT_DESTINATIONS.map(([label, path]) => (
                <Pressable
                  accessibilityRole="button"
                  key={path}
                  onPress={() => navigate(path)}
                  style={styles.supportLink}
                >
                  <Text style={[styles.supportLinkIcon, { color: palette.focus }]}>›</Text>
                  <Text style={[styles.supportLinkText, { color: palette.text }]}>{label}</Text>
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
            <Text style={[styles.cornerIcon, { color: palette.focus }]}>?</Text>
            <Text style={[styles.cornerLabel, { color: palette.text }]}>Learn &amp; support</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          onPress={close}
          style={[styles.closeButton, { bottom: insets.bottom + 18 }]}
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
  destinationGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
  },
  destination: {
    width: '33.3333%',
    height: '33.3333%',
    minHeight: 94,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
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
  },
  cornerIcon: { fontSize: 20, fontWeight: '900' },
  cornerLabel: { fontSize: 13, fontWeight: '800' },
  cornerImage: { width: 34, height: 34, resizeMode: 'contain' },
  tradeBoardButton: { position: 'absolute', left: 12, zIndex: 5 },
  settingsCluster: { position: 'absolute', right: 12, zIndex: 5, alignItems: 'flex-end', gap: 7 },
  themeSwitch: {
    width: 60,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
  themeGlyph: { color: '#f7fcff', fontSize: 23, fontWeight: '800' },
  profileButton: { position: 'absolute', left: 12, zIndex: 5 },
  supportCluster: { position: 'absolute', right: 12, zIndex: 6, alignItems: 'flex-end' },
  supportPanel: {
    width: 250,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderRadius: 16,
  },
  supportEyebrow: { paddingHorizontal: 8, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
  supportLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 8 },
  supportLinkIcon: { width: 18, fontSize: 25, fontWeight: '800' },
  supportLinkText: { fontSize: 14, fontWeight: '800' },
  closeButton: { position: 'absolute', left: '50%', zIndex: 10, marginLeft: -30 },
  closeImage: { width: 60, height: 60 },
});
