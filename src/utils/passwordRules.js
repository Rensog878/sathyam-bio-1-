// Password rules shown to people while they type. The server enforces the same
// rules in server/security.js (passwordRules) - keep the two in step.

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'passw0rd', 'admin123', 'admin1234', 'welcome1',
  'welcome123', 'qwerty123', 'qwertyuiop', 'asdfghjkl', 'iloveyou', 'abc12345', 'abcd1234', 'india123',
  'farmer123', 'sathyabio', 'sathya123', '12345678', '123456789', '1234567890', '11111111', '00000000',
  '87654321', 'test1234', 'letmein1',
])

const isStaff = role => (role || 'farmer') !== 'farmer'

export function passwordChecks(password = '', { role = 'farmer', phone = '' } = {}) {
  const minLength = isStaff(role) ? 10 : 8
  return [
    { label: `At least ${minLength} characters`, ok: password.length >= minLength },
    { label: 'At least one letter (a-z)', ok: /[A-Za-z]/.test(password) },
    { label: 'At least one number (0-9)', ok: /\d/.test(password) },
    ...(isStaff(role) ? [{ label: 'At least one symbol, like @ # $ !', ok: /[^A-Za-z0-9\s]/.test(password) }] : []),
    {
      label: 'Not a common password or your mobile number',
      ok: password.length > 0 && !COMMON_PASSWORDS.has(password.toLowerCase()) && !(phone && password.includes(phone)),
    },
  ]
}

export const isPasswordValid = (password, options) => passwordChecks(password, options).every(check => check.ok)

export const passwordPlaceholder = role => (isStaff(role) ? '10+ characters: letters, numbers & a symbol' : '8+ characters: letters & numbers')

// A random 12-character password that satisfies even the staff rules.
export function generateStrongPassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '@#$%&*!?']
  const all = sets.join('')
  const pick = chars => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length]
  const chars = [...sets.map(pick), ...Array.from({ length: 8 }, () => pick(all))]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
