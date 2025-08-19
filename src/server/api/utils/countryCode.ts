const countryCodeRegex = /^[A-Z]{2}$/;

export default function isValidCountryCode(code: string): boolean {
  return countryCodeRegex.test(code);
}
