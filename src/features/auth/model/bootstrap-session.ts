import type { User } from '@/shared/types/auth';

interface BootstrapSessionDependencies {
  getAccessToken: () => Promise<string | null>;
  getUser: () => Promise<User | null>;
  saveUser: (user: User) => Promise<void>;
  fetchCurrentUser: () => Promise<User>;
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
  try {
    const freshUser = await fetchCurrentUser();
    await saveUser(freshUser);
    return freshUser;
  } catch {
    return cachedUser;
  }
}
