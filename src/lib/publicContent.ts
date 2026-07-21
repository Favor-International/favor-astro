const restrictedLocationPattern = /\b(?:ethiopia|kenya|burundi|rwanda|democratic republic of (?:the )?congo|republic of congo|dr\.?\s*congo|drc|central african republic|car|somaliland|egypt|darfur|nuba mountains)\b/i;

export function isPublicFieldStory(story: { title?: string; paragraphs?: string[]; tags?: string[] }) {
  const content = [story.title, ...(story.paragraphs || []), ...(story.tags || [])]
    .filter(Boolean)
    .join(' ')
    .replace(/South Sudan/gi, '');

  return !restrictedLocationPattern.test(content) && !/\bSudan\b/i.test(content);
}

export const PUBLIC_FIELD_LABEL = 'Uganda · South Sudan · Chad';
