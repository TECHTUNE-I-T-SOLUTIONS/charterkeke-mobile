// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Nigerian format)
export const isValidPhone = (phone: string): boolean => {
  return normalizeNigerianPhone(phone) !== null;
};

// Normalize Nigerian phone number to +234XXXXXXXXXX
export const normalizeNigerianPhone = (phone: string): string | null => {
  if (!phone) return null;

  const compact = phone.replace(/[\s()-]/g, '');
  let digits = compact.replace(/\D/g, '');

  if (compact.startsWith('+')) {
    if (!compact.startsWith('+234')) return null;
    digits = compact.slice(1).replace(/\D/g, '');
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = `234${digits.slice(1)}`;
  }

  if (digits.length === 13 && digits.startsWith('2340')) {
    digits = `234${digits.slice(4)}`;
  }

  if (digits.length !== 13 || !digits.startsWith('234')) {
    return null;
  }

  const local = digits.slice(3);
  if (local.length !== 10) return null;
  if (!/^[789]\d{9}$/.test(local)) return null;

  return `+${digits}`;
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Get password strength
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;

  if (strength <= 2) return 'weak';
  if (strength <= 3) return 'medium';
  return 'strong';
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
};

// Validate name
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

// Validate Nigerian license number
export const isValidLicenseNumber = (license: string): boolean => {
  return license.trim().length >= 5;
};

// Validate account number
export const isValidAccountNumber = (account: string): boolean => {
  return account.trim().length === 10 && /^\d+$/.test(account);
};

// Validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
