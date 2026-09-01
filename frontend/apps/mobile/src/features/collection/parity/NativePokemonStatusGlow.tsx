import { Image, StyleSheet } from 'react-native';
import type { CollectionParityCardFixture } from './collectionParityFixtures';

const STATUS_GLOW_SOURCE = require('../../../../assets/collection-status-glow.png');

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
    <Image
      accessibilityElementsHidden
      fadeDuration={0}
      resizeMode="stretch"
      source={STATUS_GLOW_SOURCE}
      style={[styles.glow, { tintColor: color }]}
      testID={`native-${ownership}-status-glow`}
    />
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
