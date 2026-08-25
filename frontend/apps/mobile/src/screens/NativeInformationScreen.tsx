import { useMemo, useState } from 'react';
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
import type {
  NativeInformationPage,
  NativeInformationSection,
} from '../features/information/nativeInformationContent';

type Props = {
  assetBaseUrl: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
  page: NativeInformationPage;
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const InformationSection = ({
  expanded,
  isFaq,
  light,
  onNavigate,
  onToggle,
  section,
}: {
  expanded: boolean;
  isFaq: boolean;
  light: boolean;
  onNavigate: (path: string) => void;
  onToggle: () => void;
  section: NativeInformationSection;
}) => {
  const bodyVisible = !isFaq || expanded;
  return (
    <View style={[styles.section, light && styles.sectionLight]}>
      <Pressable
        accessibilityRole={isFaq ? 'button' : undefined}
        accessibilityState={isFaq ? { expanded } : undefined}
        disabled={!isFaq}
        onPress={onToggle}
        style={styles.sectionHeader}
      >
        <View style={styles.sectionHeaderCopy}>
          {section.category ? <Text style={styles.sectionCategory}>{section.category}</Text> : null}
          <Text accessibilityRole="header" style={[styles.sectionTitle, light && styles.textLight]}>{section.title}</Text>
          {section.detail ? <Text style={[styles.sectionDetail, light && styles.mutedLight]}>{section.detail}</Text> : null}
        </View>
        {isFaq ? <Text style={[styles.chevron, light && styles.textLight]}>{expanded ? '−' : '+'}</Text> : null}
      </Pressable>
      {bodyVisible ? (
        <View style={styles.sectionBody}>
          {section.paragraphs?.map((paragraph) => (
            <Text key={paragraph} style={[styles.paragraph, light && styles.mutedLight]}>{paragraph}</Text>
          ))}
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={[styles.bulletText, light && styles.mutedLight]}>{bullet}</Text>
            </View>
          ))}
          {section.links?.length ? (
            <View style={styles.links}>
              {section.links.map((link) => (
                <Pressable
                  accessibilityRole="button"
                  key={`${section.id}-${link.path}`}
                  onPress={() => onNavigate(link.path)}
                  style={[styles.link, link.primary ? styles.linkPrimary : light ? styles.linkLight : styles.linkDark]}
                >
                  <Text style={[styles.linkText, link.primary ? styles.linkTextPrimary : light && styles.textLight]}>{link.label}</Text>
                  <Text style={[styles.linkArrow, link.primary ? styles.linkTextPrimary : light && styles.textLight]}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export const NativeInformationScreen = ({ assetBaseUrl, onBack, onNavigate, page }: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const isFaq = page.slug === 'faq';
  const categories = useMemo(() => (
    Array.from(new Set(page.sections.map(({ category }) => category).filter(Boolean))) as string[]
  ), [page.sections]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const visibleSections = activeCategory
    ? page.sections.filter(({ category }) => category === activeCategory)
    : page.sections;

  return (
    <View style={[styles.root, light && styles.rootLight]} testID={`native-information-${page.slug}`}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: 14,
        }}
      >
        <View style={styles.topbar}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}>
            <Text style={[styles.backGlyph, light && styles.textLight]}>‹</Text>
          </Pressable>
          <Pressable accessibilityLabel="Pokémon Go Nexus home" accessibilityRole="button" onPress={() => onNavigate('/')} style={styles.brand}>
            <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/logo.png') }} style={styles.logo} />
            <Text style={[styles.brandName, light && styles.textLight]}>Pokémon Go Nexus</Text>
          </Pressable>
          <View style={styles.topbarSpacer} />
        </View>

        <View style={[styles.hero, light && styles.heroLight]}>
          <Text style={styles.eyebrow}>{page.eyebrow}</Text>
          <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>{page.title}</Text>
          <Text style={[styles.intro, light && styles.mutedLight]}>{page.intro}</Text>
          {page.updated ? <Text style={[styles.updated, light && styles.mutedLight]}>Last updated {page.updated}</Text> : null}
        </View>

        {isFaq && categories.length ? (
          <ScrollView
            contentContainerStyle={styles.categoryContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryRail}
          >
            <Pressable accessibilityLabel="Show all FAQ categories" accessibilityRole="button" onPress={() => setActiveCategory(null)} style={[styles.category, !activeCategory && styles.categoryActive]}>
              <Text style={[styles.categoryLabel, !activeCategory && styles.categoryLabelActive]}>All</Text>
            </Pressable>
            {categories.map((category) => (
              <Pressable accessibilityLabel={`Filter FAQ by ${category}`} accessibilityRole="button" key={category} onPress={() => setActiveCategory(category)} style={[styles.category, activeCategory === category && styles.categoryActive]}>
                <Text style={[styles.categoryLabel, activeCategory === category && styles.categoryLabelActive]}>{category}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.sections}>
          {visibleSections.map((section) => (
            <InformationSection
              expanded={openIds.has(section.id)}
              isFaq={isFaq}
              key={section.id}
              light={light}
              onNavigate={onNavigate}
              onToggle={() => setOpenIds((current) => {
                const next = new Set(current);
                if (next.has(section.id)) next.delete(section.id);
                else next.add(section.id);
                return next;
              })}
              section={section}
            />
          ))}
        </View>

        <View style={[styles.footer, light && styles.footerLight]}>
          <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/lockup.png') }} style={styles.footerLogo} />
          <Text style={[styles.footerText, light && styles.mutedLight]}>An independent community project. Pokémon and related marks belong to their respective owners.</Text>
          <View style={styles.footerLinks}>
            {(['help', 'privacy', 'terms', 'safety'] as const).map((slug) => (
              <Pressable key={slug} onPress={() => onNavigate(`/${slug}`)}><Text style={styles.footerLink}>{slug.replace('-', ' ')}</Text></Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#eef4f7' },
  topbar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3f4b54', borderRadius: 22, backgroundColor: '#171d22' },
  backLight: { borderColor: '#bdcbd3', backgroundColor: '#fff' }, backGlyph: { marginTop: -4, color: '#fff', fontSize: 40, fontWeight: '300' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, logo: { width: 34, height: 34, resizeMode: 'contain' }, brandName: { color: '#fff', fontSize: 16, fontWeight: '900' }, topbarSpacer: { width: 44 },
  hero: { maxWidth: 860, width: '100%', alignSelf: 'center', marginTop: 18, borderWidth: 1, borderColor: '#244e6f', borderRadius: 20, padding: 22, backgroundColor: '#121a23' },
  heroLight: { borderColor: '#a7cae3', backgroundColor: '#fff' }, eyebrow: { color: '#299cf5', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { marginTop: 6, color: '#fff', fontSize: 31, lineHeight: 36, fontWeight: '900' }, intro: { marginTop: 9, maxWidth: 720, color: '#b6c2ca', fontSize: 14, lineHeight: 21 }, updated: { marginTop: 10, color: '#91a1ab', fontSize: 11, fontWeight: '700' },
  categoryRail: { maxWidth: 860, width: '100%', alignSelf: 'center', marginTop: 16 }, categoryContent: { gap: 8, paddingRight: 10 },
  category: { minHeight: 42, justifyContent: 'center', borderWidth: 1, borderColor: '#46535c', borderRadius: 999, paddingHorizontal: 16, backgroundColor: '#141a1f' }, categoryActive: { borderColor: '#299cf5', backgroundColor: '#123b61' }, categoryLabel: { color: '#b7c2c8', fontSize: 12, fontWeight: '900' }, categoryLabelActive: { color: '#fff' },
  sections: { maxWidth: 860, width: '100%', alignSelf: 'center', gap: 10, marginTop: 16 },
  section: { overflow: 'hidden', borderWidth: 1, borderColor: '#344149', borderRadius: 16, backgroundColor: '#171d21' }, sectionLight: { borderColor: '#c4d0d6', backgroundColor: '#fff' },
  sectionHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 }, sectionHeaderCopy: { flex: 1, minWidth: 0 }, sectionCategory: { color: '#299cf5', fontSize: 9, fontWeight: '900', letterSpacing: 1.25 }, sectionTitle: { marginTop: 2, color: '#fff', fontSize: 18, lineHeight: 23, fontWeight: '900' }, sectionDetail: { marginTop: 4, color: '#acb8bf', fontSize: 12, lineHeight: 17 }, chevron: { color: '#fff', fontSize: 26, fontWeight: '400' },
  sectionBody: { gap: 10, borderTopWidth: 1, borderTopColor: '#334047', padding: 15, paddingTop: 12 }, paragraph: { color: '#b8c3ca', fontSize: 13.5, lineHeight: 20 }, bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, bulletCheck: { color: '#36cb86', fontSize: 15, fontWeight: '900' }, bulletText: { flex: 1, color: '#b8c3ca', fontSize: 13.5, lineHeight: 20 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 }, link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14 }, linkPrimary: { borderColor: '#299cf5', backgroundColor: '#168ced' }, linkLight: { borderColor: '#aabac2', backgroundColor: '#f5f8fa' }, linkDark: { borderColor: '#526068', backgroundColor: '#22292e' }, linkText: { color: '#fff', fontSize: 12, fontWeight: '900' }, linkTextPrimary: { color: '#fff' }, linkArrow: { color: '#fff', fontSize: 20 },
  footer: { maxWidth: 860, width: '100%', alignSelf: 'center', alignItems: 'center', gap: 9, marginTop: 22, borderTopWidth: 1, borderTopColor: '#27343b', paddingTop: 20 }, footerLight: { borderTopColor: '#c4d0d6' }, footerLogo: { width: 176, height: 76, resizeMode: 'contain' }, footerText: { maxWidth: 620, color: '#8f9ca3', fontSize: 10.5, lineHeight: 15, textAlign: 'center' }, footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }, footerLink: { color: '#299cf5', fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  textLight: { color: '#132229' }, mutedLight: { color: '#53666f' },
});
