const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email address.';
  if (!EMAIL.test(email.trim())) return "That doesn't look like an email address.";
  return undefined;
}

export function validateName(name: string): string | undefined {
  if (!name.trim()) return 'Enter your name.';
  return undefined;
}

/** Mirrors Django's default validators closely enough to catch problems before the round trip. */
export function validateNewPassword(password: string, context: { email?: string; name?: string } = {}): string | undefined {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (/^\d+$/.test(password)) return "Your password can't be only numbers.";
  const lower = password.toLowerCase();
  const personal = [context.email?.split('@')[0], ...(context.name?.split(/\s+/) ?? [])]
    .map((part) => part?.toLowerCase())
    .filter((part): part is string => !!part && part.length >= 3);
  if (personal.some((part) => lower.includes(part))) return 'Your password is too similar to your name or email.';
  if (COMMON_PASSWORDS.has(lower)) return 'That password is too common.';
  return undefined;
}

export type PasswordStrength = 0 | 1 | 2 | 3;

export function passwordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 0;
  let score = 0;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(3, Math.max(1, score)) as PasswordStrength;
}

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123', 'qwertyuiop',
  'iloveyou', 'sunshine', 'princess', 'football', 'baseball', 'welcome1', 'abc12345', 'letmein1',
  'trustno1', 'superman', 'passw0rd', 'starwars', 'whatever', 'dragon12', 'monkey12', 'master12',
]);
