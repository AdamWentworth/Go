import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { CollectionParityCardFixture } from './collectionParityFixtures';

const OWNERSHIP_GLOW: Record<
  NonNullable<CollectionParityCardFixture['ownership']>,
  string
> = {
  caught: '#0077ff',
  trade: '#28a745',
  wanted: '#dc3545',
};

export const NativePokemonStatusGlow = ({
  ownership,
}: {
  ownership: CollectionParityCardFixture['ownership'];
}) => {
  if (!ownership) return null;
  const color = OWNERSHIP_GLOW[ownership];

  return (
    <View
      accessibilityElementsHidden
      pointerEvents="none"
      style={styles.glow}
      testID={`native-${ownership}-status-glow`}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient cx="50%" cy="50%" id={`ownership-${ownership}`} r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="10%" stopColor={color} stopOpacity="0.4" />
            <Stop offset="50%" stopColor={color} stopOpacity="0" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill={`url(#ownership-${ownership})`} height="100%" width="100%" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    // Canonical web geometry: a 140% pseudo-element is centered at 50%/45%
    // and scaled to 0.5, producing a 70% glow centered slightly above the
    // card midpoint. The component is therefore mounted against the card,
    // not the smaller image stage, and expresses the effective geometry
    // directly instead of relying on a second transform.
    top: '10%',
    left: '15%',
    width: '70%',
    height: '70%',
  },
});
