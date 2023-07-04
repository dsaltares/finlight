import { getAccounts } from '@server/account/getAccounts';

describe('getAccounts', () => {
  it('returns empty array when the user has no accounts', async () => {
    const accounts = await getAccounts({
      ctx: { session: null },
      input: undefined,
    });
    expect(accounts).toEqual([]);
  });
});
