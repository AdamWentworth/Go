import { Image, Pressable, StyleSheet } from 'react-native';

type Props = {
  assetBaseUrl: string;
  onPress: () => void;
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

export const NativeActionMenuAnchor = ({ assetBaseUrl, onPress }: Props) => (
  <Pressable
    accessibilityLabel="Open action menu"
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.anchor, pressed && styles.pressed]}
  >
    <Image
      accessibilityElementsHidden
      resizeMode="contain"
      source={{ uri: toAssetUrl(assetBaseUrl, '/images/btn_action_menu.png') }}
      style={styles.ball}
    />
  </Pressable>
);

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    zIndex: 21,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -27,
    borderWidth: 3,
    borderColor: '#d9ffff',
    borderRadius: 27,
    backgroundColor: '#ffffff',
  },
  ball: { width: 48, height: 48 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});
