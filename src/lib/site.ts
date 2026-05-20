// Site-wide constants. Source of truth for nav, footer, tiers, pillars.

export const SITE = {
  url: 'https://favorintl.org',
  name: 'Favor International',
  tagline: 'Transformed Hearts Transform Nations.',
  signature: 'Where others will not go.',
  mailing: '3433 Lithia Pinecrest Rd #356, Valrico, FL 33596',
  phone: '941-444-9940',
  phoneTel: '+19414449940',
  emailGeneral: 'info@favorintl.org',
  emailPrayer: 'prayer@favorintl.org',
  hours: '9am-5pm EST, Monday-Friday',
  ein: '47-5225697',
  social: {
    facebook: 'https://facebook.com/FavorIntlOrg/',
    twitter: 'https://twitter.com/favorintlorg',
    instagram: 'https://instagram.com/favorintlorg/',
    youtube: 'https://youtube.com/channel/UCIv8yRH1mO5s_JLzqG5O6Ug',
    linkedin: 'https://linkedin.com/company/favorintl/',
  },
  trust: {
    ecfa: 'https://www.ecfa.org/MemberProfile.aspx?ID=50004',
    candid: 'https://app.candid.org/profile/9511233',
    charityNavigator: 'https://www.charitynavigator.org/ein/475225697',
  },
};

// MEGA-MENU configuration
// Each top-level nav item gets a full-width dropdown panel with sub-routes,
// a featured action, and a feature image.
export type MegaItem = {
  label: string;
  href: string;
  badge?: 'featured' | null;
};
export type MegaMenu = {
  label: string;
  href: string;
  items: MegaItem[];
  featured: {
    image: string;
    eyebrow: string;
    title: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
};

export const MEGA_NAV: MegaMenu[] = [
  {
    label: 'Pray',
    href: '/pray/',
    items: [
      { label: 'Why Pray with Favor', href: '/pray/' },
      { label: '30-Day Prayer Guide', href: '/pray/30-day-guide/' },
      { label: 'Submit a Prayer Request', href: 'mailto:prayer@favorintl.org' },
    ],
    featured: {
      image: '/images/pbs-karamoja.jpg',
      eyebrow: 'Free download',
      title: '30-Day Prayer Guide',
      body: 'One specific request per day across the nations Favor serves.',
      ctaLabel: 'Download the guide',
      ctaHref: '/pray/30-day-guide/',
    },
  },
  {
    label: 'Give',
    href: '/give/',
    items: [
      { label: 'Become a Favor Partner', href: '/give/partner-monthly/', badge: 'featured' },
      { label: 'Give Once', href: '/give/one-time/' },
      { label: 'Specific Project', href: '/give/specific-project/' },
      { label: 'Church Partnership', href: '/give/church-partnership/' },
      { label: 'Foundation Giving', href: '/give/foundation/' },
      { label: 'International Giving', href: '/give/international/' },
      { label: 'Legacy Giving', href: '/give/legacy/' },
      { label: 'Stocks, Crypto, Non-Cash', href: '/give/non-cash/' },
    ],
    featured: {
      image: '/images/hero-pbs-graduation.jpg',
      eyebrow: 'The lead path',
      title: 'Become a Favor Partner',
      body: 'Monthly partnership keeps indigenous missionaries on the trail across East Africa.',
      ctaLabel: 'Start your partnership',
      ctaHref: '/give/partner-monthly/',
    },
  },
  {
    label: 'Go',
    href: '/go/',
    items: [
      { label: 'Vision Trips', href: '/go/vision-trips/' },
      { label: 'Volunteer from Home', href: '/go/volunteer/' },
      { label: 'Internships', href: '/go/' },
      { label: 'Careers', href: '/go/' },
      { label: 'Church Partnerships', href: '/give/church-partnership/' },
    ],
    featured: {
      image: '/images/evangelism-discipleship.jpg',
      eyebrow: 'Spring + Fall 2026',
      title: 'Walk a village with a Favor field leader',
      body: 'Small-team vision trips to Uganda, South Sudan, and Ethiopia.',
      ctaLabel: 'See open trips',
      ctaHref: '/go/vision-trips/',
    },
  },
  {
    label: 'Impact',
    href: '/impact/',
    items: [
      { label: 'Evangelism + Discipleship', href: '/impact/evangelism-discipleship/' },
      { label: 'Education', href: '/impact/education/' },
      { label: 'Community Development', href: '/impact/community-development/' },
      { label: 'Economic Empowerment', href: '/impact/economic-empowerment/' },
      { label: 'Stories from the Field', href: '/stories/' },
      { label: 'Field Updates', href: '/impact/' },
      { label: 'Impact Reports + 990s', href: '/about/accountability/' },
    ],
    featured: {
      image: '/images/gift-bishoftu-tot.jpg',
      eyebrow: 'The flagship program',
      title: 'GIFT Leadership Institute',
      body: 'A two-year residential training program for the next generation of indigenous African pastors. Bishoftu, Ethiopia.',
      ctaLabel: 'Read about GIFT',
      ctaHref: '/impact/evangelism-discipleship/',
    },
  },
  {
    label: 'About',
    href: '/about/',
    items: [
      { label: 'Mission and Vision', href: '/about/mission-vision/' },
      { label: 'Our Story', href: '/about/our-story/' },
      { label: 'Where We Work', href: '/about/where-we-work/' },
      { label: 'Team', href: '/about/team/' },
      { label: 'Board of Directors', href: '/about/board/' },
      { label: 'Statement of Faith', href: '/about/statement-of-faith/' },
      { label: 'Accountability + Financials', href: '/about/accountability/' },
      { label: 'Contact', href: '/about/contact/' },
    ],
    featured: {
      image: '/images/pillar-community.jpg',
      eyebrow: 'Indigenous-led',
      title: 'Prayer-birthed. Indigenous-led.',
      body: 'A 20-year story across East Africa, told by the pastors and field leaders who are living it.',
      ctaLabel: 'Read our story',
      ctaHref: '/about/our-story/',
    },
  },
];

// Legacy flat nav for SiteHeader fallback / footer / SEO
export const PRIMARY_NAV = MEGA_NAV.map((m) => ({ label: m.label, href: m.href }));

// Confirmed by v2.1 doc diagram (Q4 RESOLVED 2026-05-19)
export const PILLARS = [
  {
    slug: 'evangelism-discipleship',
    label: 'Evangelism + Discipleship',
    blurb: 'Indigenous pastors and teachers walking into villages no one else will reach.',
    color: 'green',
    programs: ['Portable Bible Schools (PBS)', 'GIFT Leadership Institute', 'House of Prayer', 'Favor FM (Christian Radio)'],
  },
  {
    slug: 'education',
    label: 'Education',
    blurb: 'Village learning centers and schools that pull children out of poverty and into the Kingdom.',
    color: 'terracotta',
    programs: ['Village Learning Centers', 'Primary + Secondary Schools', 'Leadership Training'],
  },
  {
    slug: 'community-development',
    label: 'Community Development',
    blurb: 'Trauma counseling, medical clinics, and indigenous church planting across conflict-affected regions.',
    color: 'sage',
    programs: ['Trauma Counseling', 'Medical Services', 'Church Planting + Construction'],
  },
  {
    slug: 'economic-empowerment',
    label: 'Economic Empowerment',
    blurb: 'Sustainability projects, vocational training, and women’s programs that move a village off relief.',
    color: 'gold',
    programs: ['Sustainability Projects', 'Women’s Empowerment', 'Vocational Programs'],
  },
] as const;

// Locked by v2.1 doc diagram. Per-tier impact taglines are intentionally
// modest. Carole has not signed off on the dollar-to-outcome mappings yet, so
// we don't claim "$50 sends a pastor" — that would be a made-up number.
export const PARTNER_TIERS = [
  { amount: 25, label: 'Equip' },
  { amount: 50, label: 'Send' },
  { amount: 100, label: 'Educate' },
  { amount: 200, label: 'Heal' },
  { amount: 500, label: 'Transform' },
  { amount: 1200, label: 'Founders’ Circle', featured: true },
] as const;

// Only verified, audit-grade figures. Source: ECFA member profile (FY2024) and
// the publicly filed Form 990. Do not add unverified counts here without a
// sourced citation — the brand book is explicit: no made-up numbers.
export const IMPACT_STATS = [
  { value: '$8.36M', label: 'FY2024 total revenue', source: 'ECFA member profile (audited).' },
  { value: '89%', label: 'Program expense ratio', source: 'FY2024 audited financials.' },
  { value: '2019', label: 'ECFA-accredited since', source: 'Accredited September 30, 2019.' },
  { value: '4★', label: 'Charity Navigator rating', source: 'Highest rating tier.' },
];
