export type NativeInformationLink = {
  label: string;
  path: string;
  primary?: boolean;
};

export type NativeInformationSection = {
  bullets?: string[];
  category?: string;
  detail?: string;
  id: string;
  links?: NativeInformationLink[];
  paragraphs?: string[];
  title: string;
};

export type NativeInformationPage = {
  eyebrow: string;
  intro: string;
  sections: NativeInformationSection[];
  slug: NativeInformationSlug;
  title: string;
  updated?: string;
};

export type NativeInformationSlug =
  | 'about'
  | 'data-deletion'
  | 'faq'
  | 'getting-started'
  | 'help'
  | 'privacy'
  | 'safety'
  | 'terms';

const GETTING_STARTED: NativeInformationPage = {
  slug: 'getting-started',
  eyebrow: 'POKÉMON GO NEXUS GUIDE',
  title: 'Your first useful trade, step by step.',
  intro: 'Follow the same order you will use in the app, from one exact collection entry to a coordinated trade.',
  sections: [
    {
      id: 'collection', category: 'STEP 01', title: 'Start your collection',
      detail: 'Add a Pokémon you own before worrying about the rest of the system.',
      bullets: ['Search for the species and exact variant.', 'Save it as Caught and add only details that matter.', 'Use Favorites or custom tags to organize larger collections.'],
      links: [{ label: 'Open Pokémon', path: '/pokemon', primary: true }],
    },
    {
      id: 'wanted', category: 'STEP 02', title: 'Create a Wanted entry',
      detail: 'Wanted Pokémon are wishlist records, not missing caught instances.',
      bullets: ['Choose Wanted when adding the Pokémon.', 'Mark it Most Wanted when it deserves extra priority.', 'Add friendship, lucky, size, gender, or move conditions only when required.'],
      links: [{ label: 'Build your wishlist', path: '/pokemon?filter=wanted' }],
    },
    {
      id: 'for-trade', category: 'STEP 03', title: 'List something For Trade',
      detail: 'A For Trade listing remains part of your caught collection until a trade completes.',
      bullets: ['Choose a caught Pokémon that is eligible to trade.', 'Favorites and Lucky Pokémon remain protected from being listed.', 'Set the Pokémon you would accept in Trade Preferences.'],
      links: [{ label: 'Open trade preferences', path: '/trades?section=preferences' }],
    },
    {
      id: 'discovery', category: 'STEP 04', title: 'Find a trainer or listing',
      detail: 'Search can be broad or exact; add only filters that improve the result.',
      bullets: ['Search by ownership, variant, location, and trade details.', 'Search trainers by Nexus username or Pokémon GO name.', 'Open a listing to review its actual public catalog context.'],
      links: [{ label: 'Explore search', path: '/search' }],
    },
    {
      id: 'proposal', category: 'STEP 05', title: 'Propose and coordinate',
      detail: 'Review the exact exchange, then coordinate an accepted trade outside the app.',
      bullets: ['Your Pokémon appears on the left and theirs on the right.', 'Review friendship, remote, Lucky, special-trade, and Stardust conditions.', 'After acceptance, coordinate through Campfire, Discord, or another agreed service.'],
      links: [{ label: 'View trade activity', path: '/trades?section=activity' }],
    },
    {
      id: 'sharing', category: 'STEP 06', title: 'Share beyond Pokémon Go Nexus',
      detail: 'Meet trainers where they already are without rebuilding a trade list by hand.',
      bullets: ['Generate a polished image containing your offers and wishlist.', 'Publish a live Trade Board connected to your listings.', 'Keep private collection and profile details out of the public board.'],
      links: [{ label: 'Create a Trade Board', path: '/trade-board' }],
    },
  ],
};

const FAQ: NativeInformationPage = {
  slug: 'faq',
  eyebrow: 'HELP CENTER',
  title: 'Frequently asked questions',
  intro: 'Clear answers about accounts, collections, discovery, privacy, and trading.',
  sections: [
    { id: 'same-email', category: 'ACCOUNT', title: 'Do login methods with the same email use one account?', paragraphs: ['Yes. A verified Google, Discord, or Facebook identity with the same normalized email resolves to the same Pokémon Go Nexus account. Registration is rejected when that email already exists, while login links the verified provider identity.'] },
    { id: 'password', category: 'ACCOUNT', title: 'How does password reset work?', paragraphs: ['Request a reset using your username or email. The response does not disclose whether the account exists. The emailed link is single-use, expires after 30 minutes, and changing the password revokes other sessions.'] },
    { id: 'statuses', category: 'COLLECTION', title: 'How do Caught, For Trade, Wanted, and Most Wanted differ?', paragraphs: ['Caught records represent Pokémon you own. For Trade is a trade-eligible caught record. Wanted is a separate wishlist record, while Most Wanted adds priority without changing the record into a caught Pokémon. Favorites cannot be listed For Trade, and Lucky Pokémon cannot be traded.'] },
    { id: 'tags', category: 'COLLECTION', title: 'What are custom tags?', paragraphs: ['Custom tags organize either caught inventory or wanted entries without replacing the required ownership states. You can apply tags while creating or editing entries, reorder tag buckets, and keep that order with your account.'] },
    { id: 'proposal', category: 'TRADING', title: 'How do I propose a trade?', paragraphs: ['Open another trainer’s For Trade or Wanted listing, choose the compatible Pokémon from your collection, set the friendship conditions, and review the exact exchange. The server revalidates both Pokémon and both accounts before accepting the proposal.'] },
    { id: 'communication', category: 'TRADING', title: 'How do trainers communicate and complete an accepted trade?', paragraphs: ['Pokémon Go Nexus does not include chat. Accepted partners may share only the details they opted into, then coordinate through Campfire, Discord, or another agreed service. External communication and the final in-game exchange remain each trainer’s responsibility.'], links: [{ label: 'Read trade safety guidance', path: '/safety' }] },
    { id: 'matchmaker', category: 'DISCOVERY', title: 'What does Matchmaker change in Pokémon Search?', paragraphs: ['Normal Search finds listings that satisfy your filters. Matchmaker prioritizes reciprocal results where that trainer wants something compatible from your collection. A match is a discovery hint; proposal creation is validated again.'] },
    { id: 'privacy', category: 'DISCOVERY', title: 'How do privacy, friends, and blocks affect discovery?', paragraphs: ['Visibility settings determine what others may see. Friends can unlock additional visibility where allowed. Blocking removes the relationship from social and trade discovery, with server-side checks enforcing the boundary.'] },
    { id: 'board', category: 'DISCOVERY', title: 'What is a Trade Board?', paragraphs: ['A Trade Board turns selected For Trade and Wanted Pokémon into a polished image and shareable live page for Discord, chats, and social groups. Review the board before publishing it outside the app.'], links: [{ label: 'Open Trade Board', path: '/trade-board' }] },
  ],
};

export const NATIVE_INFORMATION_PAGES: Record<NativeInformationSlug, NativeInformationPage> = {
  'getting-started': GETTING_STARTED,
  faq: FAQ,
  help: {
    slug: 'help', eyebrow: 'HELP & INFORMATION', title: 'Find the right answer',
    intro: 'Choose a guide, review account help, or understand the boundaries around trading and privacy.',
    sections: [
      { id: 'start', category: 'START HERE', title: 'Getting Started', detail: 'Follow the complete collection-to-trade workflow.', links: [{ label: 'Open guide', path: '/getting-started', primary: true }] },
      { id: 'questions', category: 'COMMON QUESTIONS', title: 'Frequently asked questions', detail: 'Accounts, tags, discovery, trade proposals, and sharing.', links: [{ label: 'Browse FAQ', path: '/faq' }] },
      { id: 'safety', category: 'TRUST', title: 'Trade safety', detail: 'Protect your account and coordinate responsibly.', links: [{ label: 'Review safety guidance', path: '/safety' }] },
      { id: 'account', category: 'ACCOUNT', title: 'Account Security', detail: 'Manage providers, password, sessions, email, and deletion.', links: [{ label: 'Open Account Security', path: '/settings/account' }] },
      { id: 'legal', category: 'LEGAL', title: 'Privacy and terms', detail: 'Understand what is stored and the rules for using the service.', links: [{ label: 'Privacy Policy', path: '/privacy' }, { label: 'Terms of Service', path: '/terms' }, { label: 'Data deletion', path: '/data-deletion' }] },
    ],
  },
  about: {
    slug: 'about', eyebrow: 'INDEPENDENT COMMUNITY PROJECT', title: 'About Pokémon Go Nexus',
    intro: 'A trainer-focused collection, discovery, and trade-planning hub built around the details that make each Pokémon distinct.',
    sections: [
      { id: 'purpose', category: 'WHY IT EXISTS', title: 'Trading starts with understanding what everyone actually has.', paragraphs: ['A Pokémon name alone rarely describes a useful trade. Pokémon Go Nexus connects exact collection records, personal Wanted and For Trade preferences, trainer discovery, and an explicit proposal workflow.', 'The goal is not to replace Pokémon GO. It is to make the planning around collecting, finding, and trading far more organized.'] },
      { id: 'principles', category: 'PRODUCT PRINCIPLES', title: 'One connected model, not unrelated tools.', bullets: ['Exact forms, costumes, backgrounds, moves, sizes, tags, and ownership states.', 'Reciprocal discovery that considers what both trainers can offer.', 'Server-authoritative trade workflows instead of optimistic local state.'] },
      { id: 'independent', category: 'INDEPENDENT BY DESIGN', title: 'A community project', paragraphs: ['Pokémon Go Nexus is not affiliated with or endorsed by Niantic, The Pokémon Company, Nintendo, or other rights holders. Pokémon, Pokémon GO, related names, images, and trademarks belong to their respective owners.'], links: [{ label: 'Getting Started', path: '/getting-started' }, { label: 'Read the FAQ', path: '/faq' }] },
    ],
  },
  safety: {
    slug: 'safety', eyebrow: 'TRAINER TRUST', title: 'Trade Safety & Community Guidelines',
    intro: 'Protect your account, personal information, and comfort while coordinating trades with other trainers.',
    sections: [
      { id: 'boundary', category: 'IMPORTANT', title: 'Pokémon Go Nexus plans the exchange; Pokémon GO performs it.', paragraphs: ['A listing, match, proposal, friendship setting, or cost estimate is planning information. Always verify the final Pokémon, eligibility, cost, and outcome in Pokémon GO.'] },
      { id: 'exact', title: 'Confirm the exact exchange', bullets: ['Review both Pokémon and meaningful variant details.', 'Confirm Stardust and special-trade conditions again in Pokémon GO.'] },
      { id: 'account', title: 'Protect every account', bullets: ['Never share a password, provider login, verification code, recovery link, or device access.', 'Pokémon Go Nexus never needs your Pokémon GO credentials.'] },
      { id: 'meet', title: 'Meet with care', bullets: ['Use a familiar public place and disclose no more location detail than necessary.', 'Tell someone where you are going and leave if anything feels wrong.'] },
      { id: 'coordinate', title: 'Coordinate outside the app carefully', bullets: ['Pokémon Go Nexus has no chat. Use Campfire, Discord, or another agreed service.', 'External messages are not moderated here; use those services’ privacy, reporting, and blocking tools.'] },
      { id: 'block', title: 'Use privacy and blocking controls', bullets: ['Limit profile, collection, Trainer Code, and location visibility.', 'Cancel and block when continued contact is unwanted or unsafe.'] },
    ],
  },
  privacy: {
    slug: 'privacy', eyebrow: 'LEGAL', title: 'Privacy Policy', updated: 'July 28, 2026',
    intro: 'How Pokémon Go Nexus collects, uses, and protects application data.',
    sections: [
      { id: 'collect', title: 'What Pokémon Go Nexus collects', paragraphs: ['We collect account information you provide, including email, username, optional Pokémon GO trainer details, optional location, and the collection, friendship, search, and trade information you choose to store or share.', 'When Google, Discord, or Facebook authenticates you, we receive a provider identifier and email address—not your provider password.'] },
      { id: 'use', title: 'How information is used', paragraphs: ['Information authenticates your account, provides collection and trade features, applies your visibility choices, protects the service, diagnoses errors, and improves Pokémon Go Nexus.'] },
      { id: 'sharing', title: 'Sharing and service providers', paragraphs: ['We do not sell personal information. Data is shared only as needed to operate the service, comply with law, prevent abuse, or provide features you request. Authentication providers apply their own privacy policies.'] },
      { id: 'retention', title: 'Retention, security, and your choices', paragraphs: ['Account information remains while your account is active and only as long afterward as reasonably required for security, backups, or legal obligations. You can edit optional settings or delete your account and application data from Account Security.'] },
    ],
  },
  terms: {
    slug: 'terms', eyebrow: 'LEGAL', title: 'Terms of Service', updated: 'July 28, 2026',
    intro: 'The rules and service boundaries that apply when using Pokémon Go Nexus.',
    sections: [
      { id: 'use', title: 'Using Pokémon Go Nexus', paragraphs: ['Use Pokémon Go Nexus for lawful personal and community purposes. You are responsible for information you submit and for protecting access to your account.'] },
      { id: 'conduct', title: 'Community conduct', paragraphs: ['Do not misuse the service, impersonate others, harass users, attempt unauthorized access, disrupt operation, automate abusive traffic, or facilitate unlawful activity.'] },
      { id: 'availability', title: 'Availability and changes', paragraphs: ['The service is provided as available. Features may change, be interrupted, or be discontinued. Accounts threatening users, data, or service integrity may be restricted.'] },
      { id: 'third-party', title: 'Third-party services', paragraphs: ['Pokémon GO, Pokémon, Google, Discord, Facebook, and related marks belong to their owners. Pokémon Go Nexus is independent and is not endorsed by Niantic, The Pokémon Company, Nintendo, or login providers.'] },
    ],
  },
  'data-deletion': {
    slug: 'data-deletion', eyebrow: 'ACCOUNT HELP', title: 'User Data Deletion', updated: 'July 28, 2026',
    intro: 'Delete your Pokémon Go Nexus account and associated application data.',
    sections: [
      { id: 'delete', title: 'Delete your account in Pokémon Go Nexus', bullets: ['Sign in to the account you want to delete.', 'Open Settings → Account Security.', 'Select Delete account and confirm with the required proof.'], paragraphs: ['Deletion removes the sign-in account and initiates deletion of associated application data. Limited records may remain temporarily in encrypted backups or where required for security or law.'], links: [{ label: 'Open Account Security', path: '/settings/account', primary: true }] },
      { id: 'signin', title: 'If you cannot sign in', paragraphs: ['Password-based accounts can use password reset. For Google, Discord, or Facebook, sign in with the same provider and email originally connected to the account, then use Account Security.'] },
      { id: 'facebook', title: 'Remove Facebook access', paragraphs: ['Removing Pokémon Go Nexus from Facebook Apps and Websites stops future Facebook access. To delete information already stored here, also complete the account-deletion steps.'] },
    ],
  },
};

export const isNativeInformationSlug = (value: string): value is NativeInformationSlug => (
  Object.prototype.hasOwnProperty.call(NATIVE_INFORMATION_PAGES, value)
);
