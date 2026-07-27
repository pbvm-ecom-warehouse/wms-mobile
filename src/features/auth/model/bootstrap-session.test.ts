import { WmsRole, type User } from '@/shared/types/auth';
import { bootstrapSession } from './bootstrap-session';

const cachedUser: User = {
  id: 'user-1',
  username: 'receiver',
  email: 'receiver@example.com',
  name: 'Nhân viên nhận hàng',
  role: WmsRole.RECEIVER,
};

describe('bootstrapSession', () => {
  it('returns null when no access token is stored', async () => {
    const result = await bootstrapSession({
      getAccessToken: async () => null,
      getUser: async () => cachedUser,
      saveUser: async () => undefined,
      fetchCurrentUser: async () => cachedUser,
    });

    expect(result).toBeNull();
  });

  it('returns and caches the fresh profile when the session is valid', async () => {
    const freshUser = { ...cachedUser, name: 'Tên mới' };
    let savedUser: User | null = null;

    const result = await bootstrapSession({
      getAccessToken: async () => 'token',
      getUser: async () => cachedUser,
      saveUser: async (user) => {
        savedUser = user;
      },
      fetchCurrentUser: async () => freshUser,
    });

    expect(result).toEqual(freshUser);
    expect(savedUser).toEqual(freshUser);
  });

  it('uses the cached profile when refreshing the profile fails', async () => {
    const result = await bootstrapSession({
      getAccessToken: async () => 'token',
      getUser: async () => cachedUser,
      saveUser: async () => undefined,
      fetchCurrentUser: async () => {
        throw new Error('offline');
      },
    });

    expect(result).toEqual(cachedUser);
  });
});
