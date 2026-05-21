// Single source of truth for CTA copy across the site.
// Import these instead of hardcoding button labels in components.

export const CTA = {
  partnerMonthly: 'Become a Favor Partner',
  giveOnce: 'Give Once',
  giveProject: 'Fund This Project',
  giveNow: 'Give Now',
  pray: 'Pray With Us',
  prayerGuide: 'Get the 30-Day Guide',
  visionTrip: 'Travel With Favor',
  volunteer: 'Serve From Home',
  contact: 'Contact Us',
  newsletter: 'Send Me the Field Report',
  shop: 'See the Shop',
  seeField: 'See the Field',
  readStory: 'Read the Story',
  learnMore: 'Learn More',  // discouraged but available for tertiary use
  partnerLogin: 'Partner Login',
} as const;

// The org's stamped statement. Used as H1 on the homepage and as the
// footer sign-off across the site.
export const TAGLINE = 'Transformed Hearts Transform Nations';
