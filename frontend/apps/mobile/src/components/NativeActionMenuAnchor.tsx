import { Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  assetBaseUrl: string;
  onPress: () => void;
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

export const NativeActionMenuAnchor = ({ assetBaseUrl, onPress }: Props) => {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityLabel="Open action menu"
      accessibilityRole="button"
      onPress={onPress}
      testID="native-action-menu-anchor"
      style={({ pressed }) => [
        styles.anchor,
        { bottom: Math.max(20, insets.bottom) },
        pressed && styles.pressed,
      ]}
    >
      <Image
        accessibilityElementsHidden
        resizeMode="contain"
        source={{ uri: toAssetUrl(assetBaseUrl, '/images/btn_action_menu.png') }}
        style={styles.ball}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: '50%',
    zIndex: 21,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -27,
    borderRadius: 27,
    backgroundColor: 'transparent',
  },
  ball: { width: 54, height: 54 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});
