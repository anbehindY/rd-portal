import sanitizeHtml from 'sanitize-html';

const PLAIN_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

export function sanitizePlainText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, PLAIN_TEXT_OPTIONS).trim();
}
