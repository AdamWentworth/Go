import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';

export type NativeTradeHubView = 'preferences' | 'activity';

type Props = {
  activeView: NativeTradeHubView;
  onViewChange: (view: NativeTradeHubView) => void;
  scrollX?: Animated.Value;
};

const VIEW_ORDER: NativeTradeHubView[] = ['preferences', 'activity'];

export const NativeTradeHubHeader = ({
  activeView,
  onViewChange,
  scrollX,
}: Props) => {
  const light = useColorScheme() === 'light';
  const { width } = useWindowDimensions();
  const tabWidth = Math.max(0, width - 24) / 2;
  const activeIndex = VIEW_ORDER.indexOf(activeView);
  const translateX = scrollX?.interpolate({
    inputRange: [0, Math.max(1, width)],
    outputRange: [0, tabWidth],
    extrapolate: 'clamp',
  }) ?? activeIndex * tabWidth;

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.tabs, light && styles.tabsLight]}
      testID="native-trade-hub-header"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          { width: tabWidth, transform: [{ translateX }] },
        ]}
        testID="native-trade-hub-indicator"
      />
      {VIEW_ORDER.map((view) => {
        const selected = activeView === view;
        return (
          <Pressable
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
              {view === 'preferences' ? 'Trade Preferences' : 'Trade Activity'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    minHeight: 56,
    marginHorizontal: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#24464b',
    borderRadius: 10,
    padding: 4,
    overflow: 'hidden',
    backgroundColor: '#0b1618',
  },
  tabsLight: { borderColor: '#9db8b2', backgroundColor: '#ffffff' },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 7,
    backgroundColor: '#36c5a4',
  },
  tab: {
    zIndex: 1,
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  label: { color: '#9eb8b3', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  labelLight: { color: '#60726f' },
  selectedLabel: { color: '#041411', fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
