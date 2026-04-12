const FALLBACK_PATTERN = "INV-0001";

function getPatternParts(pattern: string) {
  const trimmedPattern = pattern.trim() || FALLBACK_PATTERN;
  const match = trimmedPattern.match(/^(.*?)(\d+)([^\d]*)$/);

  if (!match) {
    return {
      prefix: `${trimmedPattern}-`,
      suffix: "",
      width: 4,
      initialNumber: 1,
      rawPattern: trimmedPattern,
    };
  }

  return {
    prefix: match[1],
    suffix: match[3],
    width: match[2].length,
    initialNumber: Number.parseInt(match[2], 10) || 1,
    rawPattern: trimmedPattern,
  };
}

export function normalizeInvoicePattern(pattern?: string | null) {
  return pattern?.trim() || FALLBACK_PATTERN;
}

export function formatInvoiceNumber(pattern?: string | null, sequenceNumber?: number) {
  const normalizedPattern = normalizeInvoicePattern(pattern);
  const { prefix, suffix, width, initialNumber } = getPatternParts(normalizedPattern);
  const currentNumber = sequenceNumber ?? initialNumber;

  return `${prefix}${String(currentNumber).padStart(width, "0")}${suffix}`;
}

export function getNextInvoiceNumber(options: {
  pattern?: string | null;
  lastInvoiceNumber?: string | null;
}) {
  const normalizedPattern = normalizeInvoicePattern(options.pattern);

  if (!options.lastInvoiceNumber) {
    return formatInvoiceNumber(normalizedPattern);
  }

  const lastNumberMatch = options.lastInvoiceNumber.match(/(\d+)(?!.*\d)/);
  if (!lastNumberMatch) {
    return formatInvoiceNumber(normalizedPattern);
  }

  const nextSequence = Number.parseInt(lastNumberMatch[1], 10) + 1;
  return formatInvoiceNumber(normalizedPattern, nextSequence);
}
