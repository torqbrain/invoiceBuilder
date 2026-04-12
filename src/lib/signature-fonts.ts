export const SIGNATURE_FONTS = [
  { value: "caveat", label: "Caveat", family: '"Caveat", cursive' },
  { value: "kalam", label: "Kalam", family: '"Kalam", cursive' },
  { value: "satisfy", label: "Satisfy", cursive: true, family: '"Satisfy", cursive' },
  { value: "marck-script", label: "Marck Script", family: '"Marck Script", cursive' },
  { value: "cedarville-cursive", label: "Cedarville Cursive", family: '"Cedarville Cursive", cursive' },
] as const;

export type SignatureFont = (typeof SIGNATURE_FONTS)[number]["value"];

export function getSignatureFontFamily(font?: string | null) {
  return SIGNATURE_FONTS.find((entry) => entry.value === font)?.family || '"Caveat", cursive';
}
