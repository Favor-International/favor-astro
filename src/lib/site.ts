// Site-wide constants. Source of truth for nav, footer, tiers, pillars.

export const SITE = {
  url: 'https://favorintl.org',
  name: 'Favor International',
  // The org's stamped statement. Used as H1 on the homepage and as the footer
  // sign-off. Carole's prayer ("Lord, send me where others will not go") is a
  // personal calling, NOT the org's tagline, do not put it on the site as
  // such. If it appears anywhere, it's a quote attributed to Carole on the
  // founder/our-story page.
  tagline: 'Transformed Hearts, Transform Nations',
  // The verbatim mission statement from favorintl.org. Do not paraphrase.
  mission: 'Transforming nations with the power of the Gospel through prayer movements and indigenous missionary movements which are accelerating the fulfillment of the Great Commission to unreached people groups, and into every area of society from grassroots to governments.',
  // The verbatim vision statement.
  vision: 'Transformed Hearts, Transform Nations!',
  // Scripture used on the existing homepage.
  scripture: {
    text: 'We must work the works of Him Who sent Me and be busy with His business while it is daylight; night is coming on, when no man can work.',
    attribution: 'Jesus (John 9:4, AMPC)',
  },
  // Updated 2026-07-07 per Will: the office moved from Valrico (3433 Lithia
  // Pinecrest Rd #356) to Riverview. "Winthrop" spelling verified against the
  // real street (Winthrop Town Centre, OSM 27.8923,-82.3159).
  mailing: '11268 Winthrop Main Street #102, Riverview, FL 33578',
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
    youtube: 'https://youtube.com/@favorinternational',
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
  desc?: string;
  children?: { label: string; href: string }[];
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
      { label: 'Nations Prayer Guide', href: '/pray/30-day-guide/' },
      { label: 'Submit a Prayer Request', href: 'mailto:prayer@favorintl.org' },
    ],
    featured: {
      image: '/images/field-2026/prayer-7.webp',
      eyebrow: 'Pray with us',
      title: 'Nations Prayer Guide',
      body: 'One specific request per day across the nations Favor serves.',
      ctaLabel: 'Open the guide',
      ctaHref: '/pray/30-day-guide/',
    },
  },
  {
    label: 'Give',
    href: '/give/donate/',
    // Reorganized 2026-07-08 per Will/Danny: personal giving and
    // church/organization giving are two different categories, so the panel
    // now renders them as two labeled columns (children -> columns layout).
    items: [
      { label: 'Ways to Give', href: '/give/donate/', desc: 'Give securely, monthly or one-time', children: [
        { label: 'Give Online', href: '/give/donate/' },
        { label: 'Become a Favor Partner', href: '/give/donate/' },
        { label: 'Give a One-Time Gift', href: '/give/one-time/' },
        { label: 'Specific Project', href: '/give/specific-project/' },
        { label: 'International Giving', href: '/give/international/' },
        { label: 'Legacy Giving', href: '/give/legacy/' },
        { label: 'Stocks, Crypto, Non-Cash', href: '/give/non-cash/' },
      ] },
      { label: 'Churches & Organizations', href: '/give/church-partnership/', desc: 'Giving paths for churches and foundations', children: [
        { label: 'Church Partnership', href: '/go/church-partnerships/' },
        { label: 'Foundation Giving', href: '/give/foundation/' },
      ] },
    ],
    featured: {
      image: '/images/field-2026/baptism-4.webp',
      eyebrow: 'The lead path',
      title: 'Become a Favor Partner',
      body: 'Monthly partnership keeps indigenous missionaries serving in Uganda, South Sudan, and Chad.',
      ctaLabel: 'Give securely',
      ctaHref: '/give/donate/',
    },
  },
  {
    label: 'Go',
    href: '/go/',
    items: [
      { label: 'Vision Trips', href: '/go/vision-trips/', desc: 'Small-team mission trips to the field' },
      { label: 'Volunteer from Home', href: '/go/volunteer/', desc: 'Serve from anywhere in the US' },
      { label: 'Internships', href: '/go/internships/', desc: 'Months alongside the US team' },
      { label: 'Careers', href: '/go/careers/', desc: 'Full-time positions with Favor' },
      { label: 'Ambassadors', href: '/go/ambassadors/', desc: 'Represent Favor where you live' },
      { label: 'Church Partnerships', href: '/go/church-partnerships/', desc: 'Mobilize your church around a field team' },
    ],
    featured: {
      image: '/images/field-2026/street-outreach-7.webp',
      eyebrow: 'See it firsthand',
      title: 'See the field work up close',
      body: 'Small-team vision trips individually coordinated through Favor’s US team and local ministry contacts.',
      ctaLabel: 'Explore vision trips',
      ctaHref: '/go/vision-trips/',
    },
  },
  {
    label: 'Impact',
    href: '/impact/',
    items: [
      { label: 'Evangelism & Discipleship', href: '/impact/evangelism-discipleship/', desc: "Mobilization of Heaven's agenda", children: [
        { label: 'Portable Bible Schools', href: '/impact/evangelism-discipleship/portable-bible-schools/' },
        { label: 'GIFT', href: '/impact/evangelism-discipleship/gift-institute/' },
        { label: 'House of Prayer', href: '/pray/' },
        { label: 'Christian Radio', href: '/impact/evangelism-discipleship/radio/' },
      ] },
      { label: 'Education', href: '/impact/education/', desc: 'Next generation leadership', children: [
        { label: 'Village Learning Centers', href: '/impact/education/centers/' },
        { label: 'Favor Primary School', href: '/impact/education/primary/' },
        { label: 'Favor Secondary School', href: '/impact/education/secondary/' },
        { label: 'Leadership Training Institute', href: '/impact/education/leadership/' },
      ] },
      { label: 'Community Development', href: '/impact/community-development/', desc: 'Holistic transformation by the Word', children: [
        { label: 'Trauma Counseling', href: '/impact/community-development/counseling/' },
        { label: 'Medical', href: '/impact/community-development/medical/' },
        { label: 'Church Planting', href: '/impact/community-development/church-planting/' },
        { label: 'Church Construction', href: '/impact/community-development/construction/' },
      ] },
      { label: 'Economic Empowerment', href: '/impact/economic-empowerment/', desc: 'Independence built on freedom in Christ', children: [
        { label: 'Sustainability Projects', href: '/impact/economic-empowerment/sustainability/' },
        { label: 'Women Empowerment', href: '/impact/economic-empowerment/women/' },
        { label: 'Vocational Program', href: '/impact/economic-empowerment/vocation/' },
      ] },
      { label: 'Stories from the Field', href: '/stories/' },
      { label: 'Past Newsletters', href: '/newsletter/archive/' },
    ],
    featured: {
      image: '/images/field-2026/pbs-5.webp',
      eyebrow: 'From the field',
      title: 'Portable Bible Schools',
      body: 'Discipleship training Favor brings to rural villages, raising up disciples who raise up other disciples.',
      ctaLabel: 'See Evangelism & Discipleship',
      ctaHref: '/impact/evangelism-discipleship/',
    },
  },
  {
    label: 'About',
    href: '/about/',
    items: [
      { label: 'Mission & Vision', href: '/about/mission-vision/' },
      { label: 'Our Story', href: '/about/our-story/' },
      { label: 'Where We Work', href: '/about/where-we-work/' },
      { label: 'US Team & Field Leaders', href: '/about/team/' },
      { label: 'Board of Directors', href: '/about/board/' },
      { label: 'Statement of Faith', href: '/about/statement-of-faith/' },
      { label: 'Accountability & Financials', href: '/about/accountability/' },
      { label: 'Contact', href: '/about/contact/' },
    ],
    featured: {
      image: '/images/field-2026/villages-1.webp',
      eyebrow: 'Indigenous-led',
      title: 'Prayer-birthed. Indigenous-led.',
      body: 'A 20-year story across Uganda, South Sudan, and Chad, told by the leaders living it.',
      ctaLabel: 'Read our story',
      ctaHref: '/about/our-story/',
    },
  },
];

// Legacy flat nav for SiteHeader fallback / footer / SEO
export const PRIMARY_NAV = MEGA_NAV.map((m) => ({ label: m.label, href: m.href }));

// Pillar names matched verbatim to favorintl.org (use "&" not "+").
// Confirmed by v2.1 doc diagram (Q4 RESOLVED 2026-05-19).
export const PILLARS = [
  {
    slug: 'evangelism-discipleship',
    label: 'Evangelism & Discipleship',
    blurb: 'Indigenous pastors and teachers reaching villages and tribes others cannot. Portable Bible Schools, GIFT, House of Prayer, and Favor FM.',
    color: 'green',
    programs: ['Portable Bible Schools (PBS)', 'God’s Institute for Transformation (GIFT)', 'House of Prayer', 'Favor FM (Christian Radio)'],
  },
  {
    slug: 'education',
    label: 'Education',
    blurb: 'Village Learning Centers, Favor Primary School, Favor Secondary School, and the Leadership Training Institute.',
    color: 'terracotta',
    programs: ['Village Learning Centers', 'Favor Primary School', 'Favor Secondary School', 'Leadership Training Institute'],
  },
  {
    slug: 'community-development',
    label: 'Community Development',
    blurb: 'Trauma counseling, medical care, church planting, and church construction in places no other ministry will go.',
    color: 'sage',
    programs: ['Trauma Counseling', 'Medical', 'Church Planting', 'Church Construction'],
  },
  {
    slug: 'economic-empowerment',
    label: 'Economic Empowerment',
    blurb: 'Sustainability projects, women’s empowerment cohorts, and vocational training that move a whole village off relief.',
    color: 'gold',
    programs: ['Sustainability Projects', 'Women’s Empowerment', 'Vocational Program'],
  },
] as const;

// Locked by v2.1 doc diagram. Per-tier impact taglines are intentionally
// modest. Carole has not signed off on the dollar-to-outcome mappings yet, so
// we don't claim "$50 sends a pastor", that would be a made-up number.
export const PARTNER_TIERS = [
  { amount: 25, label: 'Equip' },
  { amount: 50, label: 'Send' },
  { amount: 100, label: 'Educate' },
  { amount: 200, label: 'Heal' },
  { amount: 500, label: 'Transform' },
  { amount: 1200, label: 'Founders’ Circle', featured: true },
] as const;

// Published flipbooks, hosted on Heyzine behind branded favorintl.org
// subdomains. Supplied by Will 2026-08-03. Stephanie (comment 41) asked for the
// stewardship booklet to be clickable from the accountability section; the two
// vision documents came with it. They open in a new tab because they leave the
// site. If a subdomain is ever repointed, change it here only.
export const FLIPBOOKS = {
  stewardship: {
    url: 'https://stewardship.favorintl.org/',
    title: 'Stewardship Statement',
    desc: 'How we handle what you give, and what we hold ourselves to.',
  },
  vision2026: {
    url: 'https://26vision.favorintl.org/',
    title: '2026 Vision for Support',
    desc: 'Where the work is going this year and what it will take to get there.',
  },
  fiveYear: {
    url: 'https://5year.favorintl.org/',
    title: 'Five-Year Plan',
    desc: 'The long view for the movement across the nations we serve.',
  },
};

// FIELD STATS: the ministry numbers that render on the homepage proof band and
// on the Africa map. They were hand-edited in two separate component files
// until Stephanie asked (2026-07-31) who owns them and which period they
// cover. They now live here so an update is one edit in one file.
//
// OWNER: unassigned. Name a person before launch.
// PERIOD: `annual` figures are full-year 2025. `toDate` figures are
// cumulative since the ministry began. Update `asOf` whenever you change a
// number, so the site never implies these are live.
// NOTE: a real-time "salvation clock" would need a field data feed that does
// not exist yet. Keep these as reported totals.
export const FIELD_STATS = {
  asOf: '2025 year-end',
  annual: {
    salvations: '195,773',
    discipled: '119,182',
  },
  toDate: {
    salvations: '524,673',
    pbsLocations: '3,635',
  },
  nationsServed: '14+',
};

// Only verified, audit-grade figures. Source: ECFA member profile (FY2024) and
// the publicly filed Form 990. Do not add unverified counts here without a
// sourced citation. The brand book is explicit: no made-up numbers.
export const IMPACT_STATS = [
  { value: '$8.36M', label: 'FY2024 total revenue', source: 'ECFA member profile (audited).', icon: 'money' },
  { value: '89%', label: 'Program-to-overhead ratio', source: 'FY2024 audited financials.', icon: 'pie' },
  { value: '2019', label: 'ECFA-accredited since', source: 'Accredited September 30, 2019.', icon: 'shield' },
  // Four literal stars, not "4★": Stephanie's note (2026-07-31): "4" next to
  // one star reads as a one-star rating at a glance.
  { value: '★★★★', label: 'Charity Navigator rating', source: 'Highest rating tier.', icon: 'star' },
];
