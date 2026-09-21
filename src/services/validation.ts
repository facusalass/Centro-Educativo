const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneCharactersRegex = /^[0-9+()\s-]+$/;

export function isValidEmail(value: string) {
  return emailRegex.test(value.trim());
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  const digitCount = trimmed.replace(/\D/g, '').length;
  return phoneCharactersRegex.test(trimmed) && digitCount >= 7 && digitCount <= 15;
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
