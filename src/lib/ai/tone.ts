/**
 * Small local models sometimes ignore the prompt and open with a pet name
 * ("Oh, sweetheart, …", "My dear, …"). This removes such an opener so the
 * reply starts naturally. Only the very start of the reply is touched.
 */
const PET_NAME =
  '(?:my\\s+)?(?:dear(?:est)?(?:\\s+(?:one|friend|heart|child|soul))?|sweet(?:heart|ie|\\s+one|\\s+soul)|honey|darling|love|beloved|precious(?:\\s+one)?|child|little\\s+one)';

const OPENER_RE = new RegExp(
  // optional "Oh"/"Ah", then the pet name used as a form of address, i.e.
  // followed by punctuation ("Love is patient" is not touched)
  `^\\s*(?:(?:oh|ah|aw|aww)[,!.…]*\\s+)?${PET_NAME}\\s*[,!.…—–-]+\\s*`,
  'i',
);

/** Removes a pet-name opener; "Oh, I hear you" and other openings are left alone. */
export function stripPetNameOpener(text: string): string {
  const match = OPENER_RE.exec(text);
  if (!match) return text;
  const rest = text.slice(match[0].length);
  // While streaming, don't strip until we know the pet name is complete.
  if (!rest) return text;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}
