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

// Primary navigation per approved-sitemap-v2.1
export const PRIMARY_NAV = [
  { label: 'Pray', href: '/pray/' },
  { label: 'Give', href: '/give/' },
  { label: 'Go', href: '/go/' },
  { label: 'Impact', href: '/impact/' },
  { label: 'About', href: '/about/' },
];

// Confirmed by v2.1 doc diagram (Q4 RESOLVED 2026-05-19)
export const PILLARS = [
  {
    slug: 'evangelism-discipleship',
    label: 'Evangelism + Discipleship',
    blurb: 'Indigenous pastors and teachers reaching villages and tribes others will not.',
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
    blurb: 'Trauma counseling, medical services, and church planting in places no other ministry will go.',
    color: 'sage',
    programs: ['Trauma Counseling', 'Medical Services', 'Church Planting + Construction'],
  },
  {
    slug: 'economic-empowerment',
    label: 'Economic Empowerment',
    blurb: 'Sustainability projects, vocational programs, and women’s empowerment that change a whole village.',
    color: 'gold',
    programs: ['Sustainability Projects', 'Women’s Empowerment', 'Vocational Programs'],
  },
] as const;

// Locked by v2.1 doc diagram (decision-log 2026-05-19)
export const PARTNER_TIERS = [
  { amount: 25, label: 'Equip', tagline: 'Bibles and study tools for one trainee.' },
  { amount: 50, label: 'Send', tagline: 'Supports a field worker for the month.' },
  { amount: 100, label: 'Educate', tagline: 'Sponsors a child in a Village Learning Center.' },
  { amount: 200, label: 'Heal', tagline: 'Trauma counseling and medical care for a family.' },
  { amount: 500, label: 'Transform', tagline: 'Funds a pastor-training cohort.' },
  { amount: 1200, label: 'Founders’ Circle', tagline: 'Full village impact. Lead tier.', featured: true },
] as const;

// FY2025 numbers sourced from existing-site-scrape home page until verified
// via the Impact Reports CSV. Update from the FY2025 annual report when
// finalized.
export const IMPACT_STATS = [
  { value: '195,773', label: 'Came to Christ in FY2025', source: 'FY2025 field reports' },
  { value: '119,182', label: 'Discipled', source: 'FY2025 field reports' },
  { value: '14', label: 'Nations served', source: 'as of 2026' },
  { value: '1,200+', label: 'Pastors trained', source: 'cumulative through FY2025' },
];
