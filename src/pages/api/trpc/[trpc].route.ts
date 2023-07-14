import { createNextApiHandler } from '@trpc/server/adapters/next';
import createContext from '@server/createContext';
import router from '@server/router';

export default createNextApiHandler({
  router,
  createContext,
  batching: { enabled: true },
  onError: (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
  },
});
