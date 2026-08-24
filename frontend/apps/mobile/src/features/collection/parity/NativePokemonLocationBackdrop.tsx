import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Image as SvgImage,
  Mask,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export const NativePokemonLocationBackdrop = ({ uri }: { uri: string }) => (
  <View
    accessibilityElementsHidden
    pointerEvents="none"
    style={styles.backdrop}
    testID="native-location-backdrop"
  >
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient cx="50%" cy="50%" id="location-backdrop-mask" r="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
          <Stop offset="65%" stopColor="#ffffff" stopOpacity="0.3" />
          <Stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
        <Mask id="location-backdrop-fade">
          <Rect fill="url(#location-backdrop-mask)" height="100%" width="100%" />
        </Mask>
      </Defs>
      <SvgImage
        height="100%"
        href={{ uri }}
        mask="url(#location-backdrop-fade)"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
      />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
