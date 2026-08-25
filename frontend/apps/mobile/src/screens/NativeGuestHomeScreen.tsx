import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  assetBaseUrl: string;
  onNavigate: (path: string) => void;
};

const FEATURES = [
  { accent: '#299cf5', glyph: '◉', title: 'Exact collection', detail: 'Track forms, costumes, backgrounds, moves, sizes, Favorites, and custom tags.', path: '/pokemon' },
  { accent: '#f05a70', glyph: '♥', title: 'Wanted & Most Wanted', detail: 'Describe exactly what you seek and which conditions truly matter.', path: '/getting-started' },
  { accent: '#35c984', glyph: '↔', title: 'Reciprocal trading', detail: 'Find compatible trainers, propose an exact exchange, and follow every state.', path: '/trades' },
  { accent: '#299cf5', glyph: '⌕', title: 'Search & discovery', detail: 'Search public listings or trainers with detailed location and variant filters.', path: '/search' },
] as const;

const STEPS = [
  ['01', 'Build your collection', 'Add one exact Pokémon and organize it your way.'],
  ['02', 'List and discover', 'Mark offers and wishes, then find reciprocal possibilities.'],
  ['03', 'Propose with confidence', 'Review both Pokémon, friendship, cost, and trade conditions.'],
] as const;

const TOOLS = [
  ['Pokédex', '/pokedex'], ['Raids', '/raid'], ['PvP', '/pvp'],
  ['Max Battles', '/max'], ['Rankings', '/rankings'], ['Trade Board', '/trade-board'],
] as const;

const toAssetUrl = (baseUrl: string, path: string): string => (
  `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

export const NativeGuestHomeScreen = ({ assetBaseUrl, onNavigate }: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-guest-home-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 106 }}>
        <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" onPress={() => onNavigate('/')} style={styles.brand}>
            <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/logo.png') }} style={styles.brandIcon} />
            <Text style={[styles.brandText, light && styles.textLight]}>Pokémon Go Nexus</Text>
          </Pressable>
          <View style={styles.topActions}>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('/login')} style={[styles.signIn, light && styles.signInLight]}><Text style={[styles.signInText, light && styles.textLight]}>Sign in</Text></Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroGlow} />
          <Image
            accessibilityLabel="Pokémon Go Nexus"
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/hero-lockup.png') }}
            style={styles.lockup}
          />
          <Text style={styles.eyebrow}>THE ULTIMATE TRAINER HUB</Text>
          <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Bring every catch, wishlist, and trade into one connected place.</Text>
          <Text style={[styles.lead, light && styles.mutedLight]}>Organize exact Pokémon. Discover trainers who fit. Plan exchanges both sides can understand before coordinating in Pokémon GO.</Text>
          <View style={styles.heroActions}>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('/register')} style={styles.primary}><Text style={styles.primaryText}>Create free account →</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('/getting-started')} style={[styles.secondary, light && styles.secondaryLight]}><Text style={[styles.secondaryText, light && styles.textLight]}>See how it works</Text></Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>EVERYTHING IN ONE TRAINER HUB</Text>
            <Text accessibilityRole="header" style={[styles.headingTitle, light && styles.textLight]}>Explore Pokémon Go Nexus</Text>
            <Text style={[styles.headingDetail, light && styles.mutedLight]}>Trading is the heart of the platform, supported by collection, discovery, social, and battle tools.</Text>
          </View>
          <View style={styles.features}>
            {FEATURES.map((feature) => (
              <Pressable key={feature.title} accessibilityRole="button" onPress={() => onNavigate(feature.path)} style={({ pressed }) => [styles.feature, light && styles.surfaceLight, pressed && styles.pressed]}>
                <View style={[styles.featureGlyph, { backgroundColor: `${feature.accent}24` }]}><Text style={[styles.featureGlyphText, { color: feature.accent }]}>{feature.glyph}</Text></View>
                <View style={styles.featureCopy}><Text style={[styles.featureTitle, light && styles.textLight]}>{feature.title}</Text><Text style={[styles.featureDetail, light && styles.mutedLight]}>{feature.detail}</Text></View>
                <Text style={[styles.arrow, light && styles.mutedLight]}>›</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.workflow, light && styles.surfaceLight]}>
            <View style={styles.heading}><Text style={styles.eyebrow}>FROM CATCH TO COORDINATION</Text><Text style={[styles.headingTitle, light && styles.textLight]}>One clear trading workflow</Text></View>
            <View style={styles.steps}>
              {STEPS.map(([number, title, detail]) => (
                <View key={number} style={[styles.step, light && styles.stepLight]}><Text style={styles.stepNumber}>{number}</Text><Text style={[styles.stepTitle, light && styles.textLight]}>{title}</Text><Text style={[styles.stepDetail, light && styles.mutedLight]}>{detail}</Text></View>
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('/getting-started')} style={styles.workflowLink}><Text style={styles.workflowLinkText}>Open the complete illustrated guide →</Text></Pressable>
          </View>

          <View style={styles.toolsBlock}>
            <Text style={[styles.blockTitle, light && styles.textLight]}>Trainer tools</Text>
            <View style={styles.tools}>
              {TOOLS.map(([label, path]) => (
                <Pressable accessibilityRole="button" key={path} onPress={() => onNavigate(path)} style={[styles.tool, light && styles.surfaceLight]}><Text style={[styles.toolText, light && styles.textLight]}>{label}</Text><Text style={[styles.arrow, light && styles.mutedLight]}>›</Text></Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.cta, light && styles.ctaLight]}>
            <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/lockup.png') }} style={styles.ctaLogo} />
            <View style={styles.ctaCopy}><Text style={styles.eyebrow}>READY TO TRADE SMARTER?</Text><Text style={[styles.ctaTitle, light && styles.textLight]}>Bring your collection. Find the right trainer.</Text><Text style={[styles.ctaDetail, light && styles.mutedLight]}>Create your free account, publish your trade list, and discover exchanges that work for both trainers.</Text></View>
            <View style={styles.ctaActions}><Pressable onPress={() => onNavigate('/register')} style={styles.primary}><Text style={styles.primaryText}>Create account →</Text></Pressable><Pressable onPress={() => onNavigate('/getting-started')} style={[styles.secondary, light && styles.secondaryLight]}><Text style={[styles.secondaryText, light && styles.textLight]}>Quick start guide</Text></Pressable></View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerBrand, light && styles.textLight]}>Pokémon Go Nexus</Text>
            <Text style={[styles.footerLegal, light && styles.mutedLight]}>An independent community project. Pokémon, Pokémon GO, related names, images, and trademarks belong to their respective owners.</Text>
            <View style={styles.footerLinks}>{['help', 'faq', 'about', 'safety', 'privacy', 'terms', 'data-deletion'].map((path) => <Pressable key={path} onPress={() => onNavigate(`/${path}`)}><Text style={styles.footerLink}>{path.replace('-', ' ')}</Text></Pressable>)}</View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#f1f5f7' }, textLight: { color: '#14232a' }, mutedLight: { color: '#576a73' },
  topbar: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, brandIcon: { width: 38, height: 38, resizeMode: 'contain' }, brandText: { color: '#fff', fontSize: 16, fontWeight: '900' }, topActions: { flexDirection: 'row' },
  signIn: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#66747d', borderRadius: 999, paddingHorizontal: 17, backgroundColor: '#171d22' }, signInLight: { borderColor: '#aebbc2', backgroundColor: '#fff' }, signInText: { color: '#fff', fontWeight: '900' },
  hero: { minHeight: 530, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 18, paddingVertical: 50 }, heroGlow: { position: 'absolute', width: 520, height: 520, borderRadius: 260, backgroundColor: '#0d4a7c', opacity: 0.28 }, lockup: { width: '92%', maxWidth: 560, height: 190 }, eyebrow: { color: '#299cf5', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' }, title: { maxWidth: 820, marginTop: 13, color: '#fff', fontSize: 34, lineHeight: 40, fontWeight: '900', textAlign: 'center' }, lead: { maxWidth: 720, marginTop: 13, color: '#b6c3ca', fontSize: 15, lineHeight: 22, textAlign: 'center' }, heroActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24 },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 20, backgroundColor: '#168ced' }, primaryText: { color: '#fff', fontWeight: '900' }, secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#66747d', borderRadius: 11, paddingHorizontal: 20, backgroundColor: '#161c21' }, secondaryLight: { borderColor: '#aebbc2', backgroundColor: '#fff' }, secondaryText: { color: '#fff', fontWeight: '900' },
  content: { width: '100%', maxWidth: 940, alignSelf: 'center', gap: 28, paddingHorizontal: 14 }, heading: { gap: 6 }, headingTitle: { color: '#fff', fontSize: 27, lineHeight: 32, fontWeight: '900', textAlign: 'center' }, headingDetail: { maxWidth: 720, alignSelf: 'center', color: '#afbdc5', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  features: { gap: 10 }, feature: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderColor: '#303b43', borderRadius: 16, padding: 14, backgroundColor: '#141a1f' }, surfaceLight: { borderColor: '#c6d1d6', backgroundColor: '#fff' }, featureGlyph: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14 }, featureGlyphText: { fontSize: 28, fontWeight: '900' }, featureCopy: { flex: 1, minWidth: 0 }, featureTitle: { color: '#fff', fontSize: 16, fontWeight: '900' }, featureDetail: { marginTop: 4, color: '#aebbc2', fontSize: 12, lineHeight: 17 }, arrow: { color: '#bdc6ca', fontSize: 26 }, pressed: { opacity: 0.77 },
  workflow: { gap: 18, borderWidth: 1, borderColor: '#334048', borderRadius: 20, padding: 18, backgroundColor: '#151b20' }, steps: { gap: 9 }, step: { borderLeftWidth: 3, borderLeftColor: '#299cf5', borderRadius: 10, padding: 13, backgroundColor: '#10161a' }, stepLight: { backgroundColor: '#f2f7fa' }, stepNumber: { color: '#299cf5', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, stepTitle: { marginTop: 3, color: '#fff', fontSize: 16, fontWeight: '900' }, stepDetail: { marginTop: 4, color: '#acb8bf', fontSize: 12, lineHeight: 17 }, workflowLink: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#123e62' }, workflowLinkText: { color: '#63baff', fontWeight: '900' },
  toolsBlock: { gap: 12 }, blockTitle: { color: '#fff', fontSize: 21, fontWeight: '900' }, tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, tool: { minWidth: '47%', flexGrow: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#303b43', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#141a1f' }, toolText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  cta: { alignItems: 'center', gap: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#2d668d', borderRadius: 20, padding: 18, backgroundColor: '#122331' }, ctaLight: { borderColor: '#9fc6df', backgroundColor: '#e6f4fc' }, ctaLogo: { width: 250, height: 110, resizeMode: 'contain' }, ctaCopy: { alignItems: 'center' }, ctaTitle: { marginTop: 6, color: '#fff', fontSize: 23, lineHeight: 28, fontWeight: '900', textAlign: 'center' }, ctaDetail: { marginTop: 7, color: '#afbdc5', fontSize: 13, lineHeight: 19, textAlign: 'center' }, ctaActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9 },
  footer: { alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#2b373f', paddingVertical: 24 }, footerBrand: { color: '#fff', fontSize: 16, fontWeight: '900' }, footerLegal: { maxWidth: 670, color: '#8e9da5', fontSize: 10, lineHeight: 15, textAlign: 'center' }, footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }, footerLink: { color: '#299cf5', fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
});
