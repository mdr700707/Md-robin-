import { PasswordItem, VaultAuditStats } from '../types';

export function calculatePasswordStrength(pass: string): 'weak' | 'medium' | 'strong' {
  if (!pass || pass.length < 8) return 'weak';

  let score = 0;
  if (pass.length >= 12) score += 2;
  else if (pass.length >= 8) score += 1;

  if (/[A-Z]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 2;

  if (score >= 5) return 'strong';
  if (score >= 3) return 'medium';
  return 'weak';
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export function generateSecurePassword(options: PasswordGeneratorOptions): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~|}{[]:;?><,.-=';

  let charPool = '';
  if (options.includeUppercase) charPool += upper;
  if (options.includeLowercase) charPool += lower;
  if (options.includeNumbers) charPool += numbers;
  if (options.includeSymbols) charPool += symbols;

  if (!charPool) {
    charPool = lower + numbers; // fallback
  }

  let result = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint32Array(options.length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < options.length; i++) {
      result += charPool[values[i] % charPool.length];
    }
  } else {
    for (let i = 0; i < options.length; i++) {
      result += charPool[Math.floor(Math.random() * charPool.length)];
    }
  }

  return result;
}

export function calculateVaultAudit(items: PasswordItem[]): VaultAuditStats {
  const total = items.length;
  if (total === 0) {
    return {
      total: 0,
      withSecondary: 0,
      strong: 0,
      medium: 0,
      weak: 0,
      reused: 0,
      overallScore: 100,
    };
  }

  let strong = 0;
  let medium = 0;
  let weak = 0;
  let withSecondary = 0;
  const passMap = new Map<string, number>();

  items.forEach((item) => {
    const strength = calculatePasswordStrength(item.primaryPassword);
    if (strength === 'strong') strong++;
    else if (strength === 'medium') medium++;
    else weak++;

    if (item.secondaryPassword && item.secondaryPassword.trim().length > 0) {
      withSecondary++;
    }

    if (item.primaryPassword) {
      passMap.set(item.primaryPassword, (passMap.get(item.primaryPassword) || 0) + 1);
    }
  });

  let reused = 0;
  passMap.forEach((count) => {
    if (count > 1) reused += count;
  });

  // Calculate overall score (0 to 100)
  const strengthScore = (strong * 100 + medium * 50) / total;
  const secondaryBonus = (withSecondary / total) * 20;
  const reusePenalty = (reused / total) * 30;

  const rawScore = Math.round(strengthScore * 0.8 + secondaryBonus - reusePenalty);
  const overallScore = Math.max(10, Math.min(100, rawScore));

  return {
    total,
    withSecondary,
    strong,
    medium,
    weak,
    reused,
    overallScore,
  };
}
