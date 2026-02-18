/**
 * PIN Brute-Force Protection
 * Tracks failed login attempts per user and enforces a temporary lockout.
 * Uses in-memory storage (resets on page refresh) — sufficient for a kiosk-style app.
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000; // 30 seconds

interface AttemptRecord {
  count: number;
  lockedUntil: number | null; // timestamp in ms, or null if not locked
}

const attempts = new Map<string, AttemptRecord>();

/**
 * Returns the current attempt record for a user, or a fresh one.
 */
const getRecord = (userId: string): AttemptRecord => {
  return attempts.get(userId) ?? { count: 0, lockedUntil: null };
};

/**
 * Returns true if the user is currently locked out.
 */
export const isLockedOut = (userId: string): boolean => {
  const record = getRecord(userId);
  if (record.lockedUntil === null) return false;
  if (Date.now() < record.lockedUntil) return true;
  // Lockout expired — reset
  attempts.delete(userId);
  return false;
};

/**
 * Returns the remaining lockout time in seconds (0 if not locked).
 */
export const getLockoutSecondsRemaining = (userId: string): number => {
  const record = getRecord(userId);
  if (record.lockedUntil === null) return 0;
  const remaining = record.lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

/**
 * Records a failed PIN attempt. Locks the user out after MAX_ATTEMPTS.
 */
export const recordFailedAttempt = (userId: string): void => {
  const record = getRecord(userId);
  const newCount = record.count + 1;

  if (newCount >= MAX_ATTEMPTS) {
    attempts.set(userId, {
      count: newCount,
      lockedUntil: Date.now() + LOCKOUT_DURATION_MS,
    });
  } else {
    attempts.set(userId, { count: newCount, lockedUntil: null });
  }
};

/**
 * Returns the number of remaining attempts before lockout.
 */
export const getRemainingAttempts = (userId: string): number => {
  const record = getRecord(userId);
  return Math.max(0, MAX_ATTEMPTS - record.count);
};

/**
 * Clears the attempt record for a user (call on successful login).
 */
export const clearAttempts = (userId: string): void => {
  attempts.delete(userId);
};
