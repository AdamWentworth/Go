import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';

export type NativeSearchHubView = 'pokemon' | 'trainers';

type Props = {
  activeView: NativeSearchHubView;
  onViewChange: (view: NativeSearchHubView) => void;
  scrollX?: Animated.Value;
};

const VIEW_ORDER: NativeSearchHubView[] = ['pokemon', 'trainers'];

export const NativeSearchHubHeader = ({
  activeView,
  onViewChange,
  scrollX,
}: Props) => {
  const light = useColorScheme() === 'light';
  const { width } = useWindowDimensions();
  const tabWidth = Math.max(0, width - 20) / VIEW_ORDER.length;
  const activeIndex = VIEW_ORDER.indexOf(activeView);
  const translateX = scrollX?.interpolate({
    inputRange: [0, Math.max(1, width)],
    outputRange: [0, tabWidth],
    extrapolate: 'clamp',
  }) ?? activeIndex * tabWidth;

  return (
    <View style={[styles.header, light && styles.headerLight]}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>COMMUNITY DISCOVERY</Text>
        <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>
          Search
        </Text>
        <Text style={[styles.description, light && styles.secondaryLight]}>
          Find Pokémon listings and connect with trainers nearby.
        </Text>
      </View>
      <View
        accessibilityRole="tablist"
        style={[styles.tabs, light && styles.tabsLight]}
        testID="native-search-hub-header"
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { width: tabWidth, transform: [{ translateX }] },
          ]}
          testID="native-search-hub-indicator"
        />
        {VIEW_ORDER.map((view) => {
          const selected = activeView === view;
          return (
            <Pressable
              accessibilityLabel={view === 'pokemon' ? 'Pokémon search' : 'Trainer search'}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={view}
              onPress={() => onViewChange(view)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Text style={[
                styles.label,
                light && styles.labelLight,
                selected && styles.selectedLabel,
              ]}>
                {view === 'pokemon' ? '⌕  Pokémon' : '♟  Trainers'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    zIndex: 2,
    paddingTop: 6,
    paddingBottom: 5,
    backgroundColor: '#080d0f',
  },
  headerLight: { backgroundColor: '#eef4f5' },
  heading: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7 },
  eyebrow: { color: '#2f9cff', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: '#f8fcfd', fontSize: 29, fontWeight: '900' },
  description: {
    maxWidth: 520,
    marginTop: 1,
    color: '#a5b1b3',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  tabs: {
    position: 'relative',
    flexDirection: 'row',
    minHeight: 54,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#35494d',
    borderRadius: 11,
    padding: 4,
    overflow: 'hidden',
    backgroundColor: '#0d1416',
  },
  tabsLight: { borderColor: '#aab9bc', backgroundColor: '#ffffff' },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderWidth: 1,
    borderColor: '#2f9cff',
    borderRadius: 8,
    backgroundColor: '#123b66',
  },
  tab: {
    zIndex: 1,
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  label: { color: '#a7b1b3', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  labelLight: { color: '#5c6a6d' },
  selectedLabel: { color: '#ffffff' },
  pressed: { opacity: 0.72 },
  textLight: { color: '#172124' },
  secondaryLight: { color: '#566467' },
});
