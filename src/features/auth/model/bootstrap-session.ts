import type { User } from '@/shared/types/auth';

interface BootstrapSessionDependencies {
  getAccessToken: () => Promise<string | null>;
  getUser: () => Promise<User | null>;
  saveUser: (user: User) => Promise<void>;
  fetchCurrentUser: () => Promise<User>;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Session bootstrap timeout'));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function bootstrapSession({
  getAccessToken,
  getUser,
  saveUser,
  fetchCurrentUser,
}: BootstrapSessionDependencies): Promise<User | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const cachedUser = await getUser();

  // If user profile is already cached locally, return immediately for instant app startup.
  // Refresh current user in background without blocking screen render.
  if (cachedUser) {
    fetchCurrentUser()
      .then(async (freshUser) => {
        await saveUser(freshUser);
      })
      .catch(() => {
        // Background refresh failed (offline or slow network) -> maintain cached user
      });
    return cachedUser;
  }

  // If no cached user exists, attempt to fetch profile with a 4s timeout so app never hangs
  try {
    const freshUser = await withTimeout(fetchCurrentUser(), 4000);
    await saveUser(freshUser);
    return freshUser;
  } catch {
    return null;
  }
}
