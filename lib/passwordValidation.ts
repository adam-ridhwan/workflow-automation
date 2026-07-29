export const PASSWORD_REQUIREMENTS =
  'Password must be at least 8 characters and include a letter and a number.';

export function validatePassword(password: string): boolean {
  return (
    password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password)
  );
}
