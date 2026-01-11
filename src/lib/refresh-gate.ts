// note: might want to make this db-based later to not have it be in-memory

const lastRefreshMap = new Map<string, number>();
const inflightMap = new Map<string, Promise<any>>();

const COOLDOWN_SECONDS = 60 * 60; // 1 hour

export const checkCooldown = (userId: string): { allowed: boolean; retryAfterS: number } => {
  const now = Date.now();
  const last = lastRefreshMap.get(userId) ?? 0;
  const delta = now - last;

  if (last === 0 || delta >= COOLDOWN_SECONDS * 1000) {
    return { allowed: true, retryAfterS: 0 };
  }
  const retryAfterS = Math.ceil((COOLDOWN_SECONDS * 1000 - delta) / 1000);
  return { allowed: false, retryAfterS };
};

export const markRefreshed = (userId: string) => {
  lastRefreshMap.set(userId, Date.now());
};

export const runOncePerUser = async <T>(userId: string, task: () => Promise<T>): Promise<T> => {
  const existing = inflightMap.get(userId);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    try {
      return await task();
    } finally {
      inflightMap.delete(userId);
    }
  })();

  inflightMap.set(userId, p);

  return p;
};
