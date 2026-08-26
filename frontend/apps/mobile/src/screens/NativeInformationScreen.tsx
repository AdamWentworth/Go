import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
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

const FAQ_CATEGORIES = [
  { category: 'ACCOUNT', countLabel: 'Account & access', description: 'Login methods, password recovery, and account control.', icon: '♙' },
  { category: 'COLLECTION', countLabel: 'Collection & tags', description: 'Statuses, custom organization, and collection synchronization.', icon: '◆' },
  { category: 'TRADING', countLabel: 'Trading', description: 'Preferences, proposals, eligibility, costs, and trade states.', icon: '↔' },
  { category: 'DISCOVERY', countLabel: 'Discovery & privacy', description: 'Search, friends, location, visibility, and public sharing.', icon: '⌕' },
] as const;

const FAQ_COMMON_IDS = new Set([
  'same-email-account',
  'collection-statuses',
  'propose-trade',
  'search-matchmaker',
]);

const faqCategoryLabel = (category?: string): string => (
  FAQ_CATEGORIES.find((candidate) => candidate.category === category)?.countLabel
  ?? category
  ?? 'Common questions'
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

const NativeInformationPageScreen = ({ assetBaseUrl, onBack, onNavigate, page }: Props) => {
  const light = useColorScheme() === 'light';
  const compact = useWindowDimensions().width < 600;
  const insets = useSafeAreaInsets();
  const isFaq = page.slug === 'faq';
  const isAbout = page.slug === 'about';
  const isHelp = page.slug === 'help';
  const isLegal = page.slug === 'privacy' || page.slug === 'terms' || page.slug === 'data-deletion';
  const isSafety = page.slug === 'safety';
  const categories = useMemo(() => (
    Array.from(new Set(page.sections.map(({ category }) => category).filter(Boolean))) as string[]
  ), [page.sections]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const validActiveCategory = activeCategory && categories.includes(activeCategory)
    ? activeCategory
    : null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleSections = isFaq
    ? page.sections.filter((section) => {
        if (normalizedQuery) {
          return [section.title, ...(section.paragraphs ?? []), faqCategoryLabel(section.category)]
            .join(' ')
            .toLocaleLowerCase()
            .includes(normalizedQuery);
        }
        if (validActiveCategory) return section.category === validActiveCategory;
        return FAQ_COMMON_IDS.has(section.id);
      })
    : validActiveCategory
      ? page.sections.filter(({ category }) => category === activeCategory)
      : page.sections;
  const allVisibleOpen = visibleSections.length > 0
    && visibleSections.every(({ id }) => openIds.has(id));

  if (isFaq) {
    return (
      <View style={[styles.root, light && styles.rootLight]} testID="native-information-faq">
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 96, paddingHorizontal: 10 }} keyboardShouldPersistTaps="handled">
          <View style={styles.topbar}>
            <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}><Text style={[styles.backGlyph, light && styles.textLight]}>‹</Text></Pressable>
            <Pressable accessibilityLabel="Pokémon Go Nexus home" accessibilityRole="button" onPress={() => onNavigate('/')} style={styles.brand}><Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/logo.png') }} style={styles.logo} /><Text style={[styles.brandName, light && styles.textLight]}>Pokémon Go Nexus</Text></Pressable>
            <View style={styles.topbarSpacer} />
          </View>

          <View style={[styles.faqHero, light && styles.faqHeroLight]}>
            <View style={styles.faqHeroIcon}><Text style={styles.faqHeroIconText}>?</Text></View>
            <Text style={styles.eyebrow}>{page.eyebrow}</Text>
            <Text accessibilityRole="header" style={[styles.faqTitle, light && styles.textLight]}>{page.title}</Text>
            <Text style={[styles.faqIntro, light && styles.mutedLight]}>{page.intro}</Text>
          </View>

          <View style={[styles.faqTools, light && styles.faqToolsLight]}>
            <View style={[styles.faqSearch, light && styles.faqSearchLight]}>
              <Text style={[styles.faqSearchIcon, light && styles.mutedLight]}>⌕</Text>
              <TextInput
                accessibilityLabel="Search questions and answers"
                onChangeText={(value) => { setQuery(value); if (value.trim()) setActiveCategory(null); }}
                placeholder="Search questions and answers"
                placeholderTextColor={light ? '#66757d' : '#87959d'}
                style={[styles.faqSearchInput, light && styles.textLight]}
                value={query}
              />
              {query ? <Pressable accessibilityLabel="Clear FAQ search" accessibilityRole="button" onPress={() => setQuery('')} style={styles.faqClear}><Text style={[styles.faqClearText, light && styles.textLight]}>×</Text></Pressable> : null}
            </View>
            <View accessibilityLabel="Browse FAQ topics" style={styles.faqCategories}>
              {FAQ_CATEGORIES.map((meta) => {
                const selected = activeCategory === meta.category;
                const count = page.sections.filter(({ category }) => category === meta.category).length;
                return <Pressable accessibilityLabel={`Browse ${meta.countLabel} questions`} accessibilityRole="button" accessibilityState={{ selected }} key={meta.category} onPress={() => { setActiveCategory(meta.category); setQuery(''); }} style={[styles.faqCategory, light && styles.faqCategoryLight, selected && styles.faqCategorySelected]}>
                  <View style={styles.faqCategoryIcon}><Text style={styles.faqCategoryIconText}>{meta.icon}</Text></View>
                  <View style={styles.faqCategoryCopy}><Text style={[styles.faqCategoryTitle, light && styles.textLight]}>{meta.countLabel}</Text><Text style={[styles.faqCategoryDetail, light && styles.mutedLight]}>{meta.description}</Text></View>
                  <View style={styles.faqCategoryCount}><Text style={styles.faqCategoryCountText}>{count}</Text></View>
                  <Text style={[styles.faqCategoryArrow, light && styles.mutedLight]}>›</Text>
                </Pressable>;
              })}
            </View>
          </View>

          <View style={styles.faqResults}>
            <View style={styles.faqResultsHeader}>
              <View style={styles.faqResultsCopy}><Text style={styles.sectionCategory}>KNOWLEDGE BASE</Text><Text style={[styles.faqResultsTitle, light && styles.textLight]}>{normalizedQuery ? 'Search results' : validActiveCategory ? faqCategoryLabel(validActiveCategory) : 'Common questions'}</Text><Text style={[styles.faqResultsDetail, light && styles.mutedLight]}>{visibleSections.length} {visibleSections.length === 1 ? 'question' : 'questions'}{normalizedQuery ? ` matching “${query.trim()}”` : ''}</Text></View>
              <View style={styles.faqResultsActions}>
                {validActiveCategory && !normalizedQuery ? <Pressable accessibilityRole="button" onPress={() => setActiveCategory(null)} style={[styles.faqPill, light && styles.faqPillLight]}><Text style={styles.faqPillAccent}>‹ All topics</Text></Pressable> : null}
                {visibleSections.length ? <Pressable accessibilityRole="button" onPress={() => setOpenIds((current) => { const next = new Set(current); visibleSections.forEach(({ id }) => { if (allVisibleOpen) next.delete(id); else next.add(id); }); return next; })} style={[styles.faqPill, light && styles.faqPillLight]}><Text style={[styles.faqPillText, light && styles.textLight]}>{allVisibleOpen ? 'Collapse answers' : 'Expand answers'}</Text></Pressable> : null}
              </View>
            </View>
            <View style={styles.sections}>
              {visibleSections.map((section) => <InformationSection expanded={openIds.has(section.id)} isFaq key={section.id} light={light} onNavigate={onNavigate} onToggle={() => setOpenIds((current) => { const next = new Set(current); if (next.has(section.id)) next.delete(section.id); else next.add(section.id); return next; })} section={{ ...section, category: faqCategoryLabel(section.category) }} />)}
              {!visibleSections.length ? <View style={[styles.faqEmpty, light && styles.sectionLight]}><Text style={styles.faqEmptyIcon}>⌕</Text><Text style={[styles.faqEmptyTitle, light && styles.textLight]}>No matching questions</Text><Text style={[styles.faqEmptyText, light && styles.mutedLight]}>Try a shorter phrase or search all categories.</Text><Pressable accessibilityRole="button" onPress={() => { setActiveCategory(null); setQuery(''); }} style={[styles.faqPill, light && styles.faqPillLight]}><Text style={[styles.faqPillText, light && styles.textLight]}>Reset FAQ filters</Text></Pressable></View> : null}
            </View>
          </View>

          <View style={[styles.faqGuide, light && styles.faqGuideLight]}><View style={styles.faqGuideIcon}><Text style={styles.faqGuideIconText}>▤</Text></View><View style={styles.faqGuideCopy}><Text style={[styles.faqGuideTitle, light && styles.textLight]}>Would you rather follow the complete workflow?</Text><Text style={[styles.faqGuideDetail, light && styles.mutedLight]}>The illustrated guide walks from creating a collection to reviewing a trade.</Text></View><Pressable accessibilityRole="button" onPress={() => onNavigate('/getting-started')} style={styles.faqGuideButton}><Text style={styles.faqGuideButtonText}>Open Getting Started</Text></Pressable></View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, light && styles.rootLight]} testID={`native-information-${page.slug}`}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: 14,
        }}
      >
        {!isLegal ? <View style={styles.topbar}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}>
            <Text style={[styles.backGlyph, light && styles.textLight]}>‹</Text>
          </Pressable>
          <Pressable accessibilityLabel="Pokémon Go Nexus home" accessibilityRole="button" onPress={() => onNavigate('/')} style={styles.brand}>
            <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/logo.png') }} style={styles.logo} />
            <Text style={[styles.brandName, light && styles.textLight]}>Pokémon Go Nexus</Text>
          </Pressable>
          <View style={styles.topbarSpacer} />
        </View> : null}

        <View style={[styles.hero, isLegal && styles.legalHero, compact && isLegal && styles.legalHeroCompact, light && styles.heroLight, light && isLegal && styles.legalHeroLight, light && compact && isLegal && styles.legalHeroCompactLight]}>
          <Text style={styles.eyebrow}>{page.eyebrow}</Text>
          <Text accessibilityRole="header" style={[styles.title, isLegal && styles.legalTitle, light && styles.textLight]}>{page.title}</Text>
          {!isLegal ? <Text style={[styles.intro, light && styles.mutedLight]}>{page.intro}</Text> : null}
          {page.updated ? <Text style={[styles.updated, light && styles.mutedLight]}>Last updated: {page.updated}</Text> : null}
        </View>

        {isLegal ? (
          <View style={[styles.legalDocument, compact && styles.legalDocumentCompact, light && styles.legalDocumentLight]}>
            {page.sections.map((section) => <View key={section.id} style={styles.legalSection}><Text style={[styles.legalSectionTitle, light && styles.textLight]}>{section.title}</Text>{section.bullets?.map((bullet, index) => <View key={bullet} style={styles.legalOrderedRow}><Text style={styles.legalOrderedNumber}>{index + 1}.</Text><Text style={[styles.legalParagraph, light && styles.mutedLight]}>{bullet}</Text></View>)}{section.paragraphs?.map((paragraph) => <Text key={paragraph} style={[styles.legalParagraph, light && styles.mutedLight]}>{paragraph}</Text>)}{section.links?.map((link) => <Pressable accessibilityRole="link" key={link.path} onPress={() => onNavigate(link.path)}><Text style={styles.legalLink}>{link.label}</Text></Pressable>)}</View>)}
            <View style={styles.legalFooter}><Pressable accessibilityRole="link" onPress={() => onNavigate('/help')}><Text style={styles.legalLink}>Help &amp; information</Text></Pressable><Pressable accessibilityRole="link" onPress={() => onNavigate('/')}><Text style={styles.legalLink}>Return to Pokémon Go Nexus</Text></Pressable></View>
          </View>
        ) : isAbout ? (
          <View style={[styles.aboutBody, light && styles.groupShellLight]}>
            <View style={[styles.aboutStory, light && styles.sectionLight]}>
              <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/lockup.png') }} style={styles.aboutStoryLogo} />
              <View style={styles.aboutStoryCopy}>
                <Text style={styles.sectionCategory}>{page.sections[0]?.category}</Text>
                <Text style={[styles.aboutHeading, light && styles.textLight]}>{page.sections[0]?.title}</Text>
                {page.sections[0]?.paragraphs?.map((paragraph) => <Text key={paragraph} style={[styles.paragraph, light && styles.mutedLight]}>{paragraph}</Text>)}
              </View>
            </View>

            <View style={styles.aboutGroup}>
              <Text style={styles.sectionCategory}>PRODUCT PRINCIPLES</Text>
              <Text style={[styles.aboutHeading, light && styles.textLight]}>One connected model, not a pile of unrelated tools.</Text>
              <View style={styles.aboutCards}>
                {page.sections.filter(({ category }) => category === 'PRODUCT PRINCIPLES').map((section, index) => <View key={section.id} style={[styles.aboutCard, light && styles.sectionLight]}><View style={styles.aboutCardIcon}><Text style={styles.aboutCardIconText}>{['◆', '⌕', '✓'][index] ?? '◆'}</Text></View><Text style={[styles.aboutCardTitle, light && styles.textLight]}>{section.title}</Text>{section.paragraphs?.map((paragraph) => <Text key={paragraph} style={[styles.aboutCardText, light && styles.mutedLight]}>{paragraph}</Text>)}</View>)}
              </View>
            </View>

            <View style={styles.aboutGroup}>
              <Text style={styles.sectionCategory}>THE TRAINER HUB</Text>
              <Text style={[styles.aboutHeading, light && styles.textLight]}>Move naturally from a collection to the right trainer.</Text>
              <View style={styles.aboutLinks}>
                {page.sections.filter(({ category }) => category === 'THE TRAINER HUB').map((section, index) => <Pressable accessibilityRole="button" key={section.id} onPress={() => onNavigate(section.links?.[0]?.path ?? '/')} style={[styles.aboutLink, light && styles.sectionLight]}><View style={styles.aboutLinkIcon}><Text style={styles.aboutLinkIconText}>{['◆', '⌕', '↔', '♙'][index] ?? '◆'}</Text></View><View style={styles.aboutLinkCopy}><Text style={[styles.aboutLinkTitle, light && styles.textLight]}>{section.title}</Text><Text style={[styles.aboutLinkDetail, light && styles.mutedLight]}>{section.detail}</Text></View><Text style={[styles.aboutLinkArrow, light && styles.mutedLight]}>›</Text></Pressable>)}
              </View>
            </View>

            {page.sections.filter(({ id }) => id === 'independent').map((section) => <View key={section.id} style={[styles.aboutCallout, light && styles.aboutCalloutLight]}><View style={styles.aboutCalloutIcon}><Text style={styles.aboutCalloutIconText}>✓</Text></View><View style={styles.aboutCalloutCopy}><Text style={[styles.aboutCardTitle, light && styles.textLight]}>Independent by design</Text>{section.paragraphs?.map((paragraph) => <Text key={paragraph} style={[styles.aboutCardText, light && styles.mutedLight]}>{paragraph}</Text>)}</View></View>)}

            <View style={[styles.aboutCta, light && styles.aboutCtaLight]}><View style={styles.aboutCtaCopy}><Text style={styles.sectionCategory}>SEE IT IN CONTEXT</Text><Text style={[styles.aboutHeading, light && styles.textLight]}>Follow the collection-to-trade workflow.</Text><Text style={[styles.aboutCardText, light && styles.mutedLight]}>The illustrated guide shows how the major parts of Pokémon Go Nexus fit together.</Text></View><View style={styles.aboutCtaActions}><Pressable accessibilityRole="button" onPress={() => onNavigate('/getting-started')} style={styles.aboutPrimaryButton}><Text style={styles.aboutPrimaryButtonText}>Getting Started  ›</Text></Pressable><Pressable accessibilityRole="button" onPress={() => onNavigate('/faq')} style={[styles.aboutSecondaryButton, light && styles.aboutSecondaryButtonLight]}><Text style={[styles.aboutSecondaryButtonText, light && styles.textLight]}>Read the FAQ</Text></Pressable></View></View>
          </View>
        ) : isHelp ? (
          <View style={[styles.helpDirectory, light && styles.groupShellLight]}>
            {page.sections.map((section) => <View key={section.id} style={styles.helpGroup}><View style={styles.helpGroupHeader}><Text style={[styles.helpGroupTitle, light && styles.textLight]}>{section.title}</Text><Text style={[styles.helpGroupDetail, light && styles.mutedLight]}>{section.detail}</Text></View><View style={styles.helpLinks}>{section.links?.map((link, index) => <Pressable accessibilityRole="button" key={link.path} onPress={() => onNavigate(link.path)} style={[styles.helpLink, light && styles.sectionLight]}><View style={styles.helpLinkIcon}><Text style={styles.helpLinkIconText}>{['?', '↗', '◎'][index % 3]}</Text></View><View style={styles.helpLinkCopy}><Text style={[styles.helpLinkTitle, light && styles.textLight]}>{link.label}</Text><Text style={[styles.helpLinkDetail, light && styles.mutedLight]}>{link.description}</Text></View><Text style={[styles.aboutLinkArrow, light && styles.mutedLight]}>›</Text></Pressable>)}</View></View>)}
          </View>
        ) : isSafety ? (
          <View style={[styles.safetyBody, light && styles.groupShellLight]}>
            {page.sections.filter(({ id }) => id === 'boundary').map((section) => <View key={section.id} style={[styles.safetyImportant, light && styles.safetyImportantLight]}><View style={styles.safetyImportantIcon}><Text style={styles.safetyImportantIconText}>↔</Text></View><View style={styles.aboutCalloutCopy}><Text style={[styles.aboutCardTitle, light && styles.textLight]}>{section.title}</Text>{section.paragraphs?.map((paragraph) => <Text key={paragraph} style={[styles.aboutCardText, light && styles.mutedLight]}>{paragraph}</Text>)}</View></View>)}
            <View style={styles.aboutGroup}><Text style={styles.sectionCategory}>BEFORE AND DURING A TRADE</Text><Text style={[styles.aboutHeading, light && styles.textLight]}>Keep the interaction clear, private, and voluntary.</Text><View style={styles.safetyCards}>{page.sections.filter(({ id, category }) => id !== 'boundary' && !category).map((section, index) => <View key={section.id} style={[styles.safetyCard, light && styles.sectionLight]}><View style={styles.aboutCardIcon}><Text style={styles.aboutCardIconText}>{['✓', '⌾', '⌖', '♙', '◌', '⊘', '!'][index] ?? '✓'}</Text></View><View style={styles.safetyCardCopy}><Text style={[styles.aboutCardTitle, light && styles.textLight]}>{section.title}</Text>{section.bullets?.map((bullet) => <View key={bullet} style={styles.safetyBullet}><Text style={styles.safetyBulletMark}>•</Text><Text style={[styles.aboutCardText, light && styles.mutedLight]}>{bullet}</Text></View>)}</View></View>)}</View></View>
            <View style={[styles.safetyBoundaries, light && styles.safetyBoundariesLight]}><Text style={styles.sectionCategory}>KNOW THE BOUNDARY</Text><Text style={[styles.aboutHeading, light && styles.textLight]}>What the platform can—and cannot—establish.</Text>{page.sections.filter(({ category }) => category === 'KNOW THE BOUNDARY').map((section) => <View key={section.id} style={[styles.safetyBoundaryCard, light && styles.sectionLight]}><Text style={[styles.aboutCardTitle, light && styles.textLight]}>{section.title}</Text>{section.bullets?.map((bullet) => <View key={bullet} style={styles.safetyBullet}><Text style={styles.safetyBulletMark}>•</Text><Text style={[styles.aboutCardText, light && styles.mutedLight]}>{bullet}</Text></View>)}</View>)}</View>
            {page.sections.filter(({ id }) => id === 'controls').map((section) => <View key={section.id} style={[styles.aboutCta, light && styles.aboutCtaLight]}><View style={styles.aboutCtaCopy}><Text style={styles.sectionCategory}>{section.category}</Text><Text style={[styles.aboutHeading, light && styles.textLight]}>{section.title}</Text><Text style={[styles.aboutCardText, light && styles.mutedLight]}>{section.detail}</Text></View><View style={styles.aboutCtaActions}>{section.links?.map((link) => <Pressable accessibilityRole="button" key={link.path} onPress={() => onNavigate(link.path)} style={link.primary ? styles.aboutPrimaryButton : [styles.aboutSecondaryButton, light && styles.aboutSecondaryButtonLight]}><Text style={link.primary ? styles.aboutPrimaryButtonText : [styles.aboutSecondaryButtonText, light && styles.textLight]}>{link.label}</Text></Pressable>)}</View></View>)}
          </View>
        ) : (
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
        )}

        {!isLegal ? <View style={[styles.footer, light && styles.footerLight]}>
          <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/lockup.png') }} style={styles.footerLogo} />
          <Text style={[styles.footerText, light && styles.mutedLight]}>An independent community project. Pokémon and related marks belong to their respective owners.</Text>
          <View style={styles.footerLinks}>
            {(['help', 'privacy', 'terms', 'safety'] as const).map((slug) => (
              <Pressable accessibilityRole="button" key={slug} onPress={() => onNavigate(`/${slug}`)}><Text style={styles.footerLink}>{slug.replace('-', ' ')}</Text></Pressable>
            ))}
          </View>
        </View> : null}
      </ScrollView>
    </View>
  );
};

export const NativeInformationScreen = (props: Props) => (
  <NativeInformationPageScreen key={props.page.slug} {...props} />
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090d12' }, rootLight: { backgroundColor: '#eef4f7' },
  topbar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3f4b54', borderRadius: 22, backgroundColor: '#171d22' },
  backLight: { borderColor: '#bdcbd3', backgroundColor: '#fff' }, backGlyph: { marginTop: -4, color: '#fff', fontSize: 40, fontWeight: '300' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, logo: { width: 34, height: 34, resizeMode: 'contain' }, brandName: { color: '#fff', fontSize: 16, fontWeight: '900' }, topbarSpacer: { width: 44 },
  hero: { maxWidth: 860, width: '100%', alignSelf: 'center', marginTop: 18, borderWidth: 1, borderColor: '#244e6f', borderRadius: 20, padding: 22, backgroundColor: '#121a23' },
  heroLight: { borderColor: '#a7cae3', backgroundColor: '#fff' }, eyebrow: { color: '#299cf5', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { marginTop: 6, color: '#fff', fontSize: 31, lineHeight: 36, fontWeight: '900' }, intro: { marginTop: 9, maxWidth: 720, color: '#b6c2ca', fontSize: 14, lineHeight: 21 }, updated: { marginTop: 10, color: '#91a1ab', fontSize: 11, fontWeight: '700' },
  legalHero: { marginTop: 0, borderWidth: 0, borderRadius: 0, paddingHorizontal: 6, paddingTop: 18, paddingBottom: 18, backgroundColor: 'transparent' },
  legalHeroCompact: { width: 'auto', alignSelf: 'stretch', marginHorizontal: -14, paddingHorizontal: 20, paddingTop: 24, backgroundColor: '#171d21' },
  legalHeroLight: { backgroundColor: 'transparent' },
  legalHeroCompactLight: { backgroundColor: '#fff' },
  legalTitle: { marginTop: 5, fontSize: 39, lineHeight: 43, letterSpacing: -1.2 },
  legalDocument: { maxWidth: 840, width: '100%', alignSelf: 'center', borderWidth: 1, borderColor: '#344149', borderRadius: 20, paddingHorizontal: 17, paddingBottom: 18, backgroundColor: '#171d21' },
  legalDocumentCompact: { width: 'auto', alignSelf: 'stretch', marginHorizontal: -14, borderWidth: 0, borderRadius: 0, paddingHorizontal: 20 },
  legalDocumentLight: { borderColor: '#c4d0d6', backgroundColor: '#fff' },
  legalSection: { gap: 8, borderTopWidth: 1, borderTopColor: '#344149', paddingVertical: 18 },
  legalSectionTitle: { color: '#fff', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  legalParagraph: { flex: 1, color: '#b8c3ca', fontSize: 13.5, lineHeight: 22 },
  legalOrderedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  legalOrderedNumber: { color: '#299cf5', fontSize: 13.5, lineHeight: 22, fontWeight: '900' },
  legalLink: { color: '#299cf5', fontSize: 13, lineHeight: 20, fontWeight: '800' },
  legalFooter: { gap: 14, borderTopWidth: 1, borderTopColor: '#344149', paddingTop: 20 },
  categoryRail: { maxWidth: 860, width: '100%', alignSelf: 'center', marginTop: 16 }, categoryContent: { gap: 8, paddingRight: 10 },
  category: { minHeight: 42, justifyContent: 'center', borderWidth: 1, borderColor: '#46535c', borderRadius: 999, paddingHorizontal: 16, backgroundColor: '#141a1f' }, categoryActive: { borderColor: '#299cf5', backgroundColor: '#123b61' }, categoryLabel: { color: '#b7c2c8', fontSize: 12, fontWeight: '900' }, categoryLabelActive: { color: '#fff' },
  sections: { maxWidth: 860, width: '100%', alignSelf: 'center', gap: 10, marginTop: 16 },
  section: { overflow: 'hidden', borderWidth: 1, borderColor: '#344149', borderRadius: 16, backgroundColor: '#171d21' }, sectionLight: { borderColor: '#c4d0d6', backgroundColor: '#fff' },
  sectionHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 }, sectionHeaderCopy: { flex: 1, minWidth: 0 }, sectionCategory: { color: '#299cf5', fontSize: 9, fontWeight: '900', letterSpacing: 1.25 }, sectionTitle: { marginTop: 2, color: '#fff', fontSize: 18, lineHeight: 23, fontWeight: '900' }, sectionDetail: { marginTop: 4, color: '#acb8bf', fontSize: 12, lineHeight: 17 }, chevron: { color: '#fff', fontSize: 26, fontWeight: '400' },
  sectionBody: { gap: 10, borderTopWidth: 1, borderTopColor: '#334047', padding: 15, paddingTop: 12 }, paragraph: { color: '#b8c3ca', fontSize: 13.5, lineHeight: 20 }, bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, bulletCheck: { color: '#36cb86', fontSize: 15, fontWeight: '900' }, bulletText: { flex: 1, color: '#b8c3ca', fontSize: 13.5, lineHeight: 20 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 }, link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14 }, linkPrimary: { borderColor: '#299cf5', backgroundColor: '#168ced' }, linkLight: { borderColor: '#aabac2', backgroundColor: '#f5f8fa' }, linkDark: { borderColor: '#526068', backgroundColor: '#22292e' }, linkText: { color: '#fff', fontSize: 12, fontWeight: '900' }, linkTextPrimary: { color: '#fff' }, linkArrow: { color: '#fff', fontSize: 20 },
  footer: { maxWidth: 860, width: '100%', alignSelf: 'center', alignItems: 'center', gap: 9, marginTop: 22, borderTopWidth: 1, borderTopColor: '#27343b', paddingTop: 20 }, footerLight: { borderTopColor: '#c4d0d6' }, footerLogo: { width: 176, height: 76, resizeMode: 'contain' }, footerText: { maxWidth: 620, color: '#8f9ca3', fontSize: 10.5, lineHeight: 15, textAlign: 'center' }, footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }, footerLink: { color: '#299cf5', fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  faqHero: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 },
  faqHeroLight: { backgroundColor: 'transparent' },
  faqHeroIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#285d82', borderRadius: 18, backgroundColor: '#10263a' },
  faqHeroIconText: { color: '#299cf5', fontSize: 32, lineHeight: 36, fontWeight: '900' },
  faqTitle: { marginTop: 3, color: '#fff', fontSize: 25, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  faqIntro: { maxWidth: 520, marginTop: 6, color: '#b6c2ca', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  faqTools: { gap: 14, marginHorizontal: -10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2d3a42', paddingHorizontal: 12, paddingVertical: 16, backgroundColor: '#11171b' },
  faqToolsLight: { borderColor: '#c5d1d7', backgroundColor: '#f7fafb' },
  faqSearch: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#35464f', borderRadius: 15, paddingHorizontal: 14, backgroundColor: '#0d1719' },
  faqSearchLight: { borderColor: '#b7c6cd', backgroundColor: '#fff' },
  faqSearchIcon: { color: '#9ba9b0', fontSize: 23 },
  faqSearchInput: { minWidth: 0, flex: 1, height: 50, color: '#fff', fontSize: 14 },
  faqClear: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#ffffff10' },
  faqClearText: { color: '#fff', fontSize: 25, lineHeight: 28 },
  faqCategories: { gap: 10 },
  faqCategory: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#344149', borderRadius: 15, padding: 13, backgroundColor: '#1a2024' },
  faqCategoryLight: { borderColor: '#c4d0d6', backgroundColor: '#fff' },
  faqCategorySelected: { borderColor: '#299cf5', backgroundColor: '#123b61' },
  faqCategoryIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#18314b' },
  faqCategoryIconText: { color: '#299cf5', fontSize: 20, fontWeight: '900' },
  faqCategoryCopy: { minWidth: 0, flex: 1, gap: 3 },
  faqCategoryTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  faqCategoryDetail: { color: '#aab7be', fontSize: 10.5, lineHeight: 14 },
  faqCategoryCount: { minWidth: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#18314b' },
  faqCategoryCountText: { color: '#299cf5', fontSize: 11, fontWeight: '900' },
  faqCategoryArrow: { color: '#aab7be', fontSize: 22 },
  faqResults: { paddingHorizontal: 2, paddingTop: 20 },
  faqResultsHeader: { gap: 11, marginBottom: 14 },
  faqResultsCopy: { gap: 2 },
  faqResultsTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  faqResultsDetail: { color: '#9aa8af', fontSize: 11 },
  faqResultsActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  faqPill: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#40505a', borderRadius: 999, paddingHorizontal: 13, backgroundColor: '#161d21' },
  faqPillLight: { borderColor: '#b9c7cd', backgroundColor: '#fff' },
  faqPillText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  faqPillAccent: { color: '#299cf5', fontSize: 12, fontWeight: '900' },
  faqEmpty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#40505a', borderRadius: 18, padding: 24, backgroundColor: '#171d21' },
  faqEmptyIcon: { color: '#299cf5', fontSize: 28 },
  faqEmptyTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  faqEmptyText: { color: '#9aa8af', fontSize: 12, textAlign: 'center' },
  faqGuide: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 18, borderWidth: 1, borderColor: '#285d82', borderRadius: 17, padding: 13, backgroundColor: '#102334' },
  faqGuideLight: { backgroundColor: '#e9f4fd' },
  faqGuideIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#183c5c' },
  faqGuideIconText: { color: '#299cf5', fontSize: 22 },
  faqGuideCopy: { minWidth: 0, flex: 1 },
  faqGuideTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  faqGuideDetail: { marginTop: 3, color: '#aab7be', fontSize: 11, lineHeight: 15 },
  faqGuideButton: { width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#299cf5' },
  faqGuideButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  aboutBody: { maxWidth: 860, width: '100%', alignSelf: 'center', overflow: 'hidden', marginTop: 14, borderWidth: 1, borderColor: '#344149', borderRadius: 18, backgroundColor: '#11171b' },
  groupShellLight: { borderColor: '#c4d0d6', backgroundColor: '#fff' },
  aboutStory: { alignItems: 'center', gap: 18, borderBottomWidth: 1, borderBottomColor: '#344149', padding: 20, backgroundColor: '#171d21' },
  aboutStoryLogo: { width: '86%', height: 148, resizeMode: 'contain' },
  aboutStoryCopy: { width: '100%', gap: 7 },
  aboutHeading: { marginTop: 4, color: '#fff', fontSize: 21, lineHeight: 25, fontWeight: '900' },
  aboutGroup: { gap: 11, borderBottomWidth: 1, borderBottomColor: '#344149', padding: 17 },
  aboutCards: { gap: 10 },
  aboutCard: { gap: 7, borderWidth: 1, borderColor: '#344149', borderRadius: 16, padding: 14, backgroundColor: '#171d21' },
  aboutCardIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#153653' },
  aboutCardIconText: { color: '#299cf5', fontSize: 19, fontWeight: '900' },
  aboutCardTitle: { color: '#fff', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  aboutCardText: { flex: 1, color: '#aebac1', fontSize: 12, lineHeight: 18 },
  aboutLinks: { gap: 9 },
  aboutLink: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#344149', borderRadius: 15, padding: 12, backgroundColor: '#171d21' },
  aboutLinkIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#153653' },
  aboutLinkIconText: { color: '#299cf5', fontSize: 18, fontWeight: '900' },
  aboutLinkCopy: { minWidth: 0, flex: 1, gap: 3 },
  aboutLinkTitle: { color: '#fff', fontSize: 13, fontWeight: '900' },
  aboutLinkDetail: { color: '#aebac1', fontSize: 10.5, lineHeight: 15 },
  aboutLinkArrow: { color: '#aebac1', fontSize: 22 },
  aboutCallout: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, margin: 17, borderWidth: 1, borderColor: '#285d82', borderRadius: 17, padding: 14, backgroundColor: '#102334' },
  aboutCalloutLight: { backgroundColor: '#e8f4fd' },
  aboutCalloutIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#153653' },
  aboutCalloutIconText: { color: '#299cf5', fontSize: 19, fontWeight: '900' },
  aboutCalloutCopy: { minWidth: 0, flex: 1, gap: 5 },
  aboutCta: { gap: 14, borderTopWidth: 1, borderTopColor: '#344149', padding: 17, backgroundColor: '#151e26' },
  aboutCtaLight: { backgroundColor: '#edf6fc' },
  aboutCtaCopy: { gap: 5 },
  aboutCtaActions: { gap: 8 },
  aboutPrimaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#299cf5' },
  aboutPrimaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  aboutSecondaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4a5962', borderRadius: 12, backgroundColor: '#20282d' },
  aboutSecondaryButtonLight: { borderColor: '#b5c4cb', backgroundColor: '#fff' },
  aboutSecondaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  helpDirectory: { maxWidth: 860, width: '100%', alignSelf: 'center', gap: 18, marginTop: 16, borderWidth: 1, borderColor: '#344149', borderRadius: 18, padding: 13, backgroundColor: '#11171b' },
  helpGroup: { gap: 11, borderBottomWidth: 1, borderBottomColor: '#344149', paddingBottom: 18 },
  helpGroupHeader: { alignItems: 'center', gap: 4, paddingHorizontal: 5 },
  helpGroupTitle: { color: '#fff', fontSize: 18, lineHeight: 22, fontWeight: '900', textAlign: 'center' },
  helpGroupDetail: { color: '#aebac1', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  helpLinks: { gap: 9 },
  helpLink: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#344149', borderRadius: 15, padding: 12, backgroundColor: '#171d21' },
  helpLinkIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#153653' },
  helpLinkIconText: { color: '#299cf5', fontSize: 20, fontWeight: '900' },
  helpLinkCopy: { minWidth: 0, flex: 1, gap: 4 },
  helpLinkTitle: { color: '#fff', fontSize: 13, lineHeight: 17, fontWeight: '900' },
  helpLinkDetail: { color: '#aebac1', fontSize: 10.5, lineHeight: 15 },
  safetyBody: { maxWidth: 860, width: '100%', alignSelf: 'center', overflow: 'hidden', marginTop: 14, borderWidth: 1, borderColor: '#344149', borderRadius: 18, backgroundColor: '#11171b' },
  safetyImportant: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, margin: 17, borderWidth: 1, borderColor: '#7d6130', borderRadius: 17, padding: 14, backgroundColor: '#2a2112' },
  safetyImportantLight: { backgroundColor: '#fff7e4' },
  safetyImportantIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#49381a' },
  safetyImportantIconText: { color: '#f4bb55', fontSize: 19, fontWeight: '900' },
  safetyCards: { gap: 10 },
  safetyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderWidth: 1, borderColor: '#344149', borderRadius: 16, padding: 13, backgroundColor: '#171d21' },
  safetyCardCopy: { minWidth: 0, flex: 1, gap: 5 },
  safetyBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  safetyBulletMark: { color: '#299cf5', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  safetyBoundaries: { gap: 11, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#344149', padding: 17, backgroundColor: '#171d21' },
  safetyBoundariesLight: { backgroundColor: '#f7fafb' },
  safetyBoundaryCard: { gap: 7, borderWidth: 1, borderColor: '#344149', borderRadius: 16, padding: 14, backgroundColor: '#11171b' },
  textLight: { color: '#132229' }, mutedLight: { color: '#53666f' },
});
