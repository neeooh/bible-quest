/**
 * Detects messages that suggest someone may be in crisis, so the app can show
 * a fixed (not AI-generated) notice with emergency and crisis-line contacts.
 * Deliberately broad: a false positive only shows a caring notice.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid/i,
  /\bkill(ing)?\s+my\s*self\b/i,
  /\bend(ing)?\s+(it\s+all|my\s+life|things)\b/i,
  /\btake\s+my\s+(own\s+)?life\b/i,
  /\b(want|wanted|wish)\s+(to\s+)?(be\s+)?dead\b/i,
  /\b(want|wanted|wish)\s+to\s+die\b/i,
  /\bwish\s+i\s+(was|were)\s+(dead|never\s+born)\b/i,
  /\brather\s+be\s+dead\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|go\s+on)\b/i,
  /\b(don['’]?t|do\s+not)\s+want\s+to\s+(live|be\s+alive|wake\s+up)\b/i,
  /\bself[-\s]?harm/i,
  /\b(hurt|hurting|cut|cutting|harm|harming)\s+my\s*self\b/i,
  /\boverdose\b/i,
  /\b(abus(e|ed|es|ing|ive))\b/i,
  /\b(rape|raped|molest)/i,
  /\b(hits|beats|hurts)\s+me\b/i,
  /\b(i['’]?m|i\s+am|feel)\s+(not\s+safe|unsafe|in\s+danger)\b/i,
];

export function suggestsCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}
