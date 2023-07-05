/* eslint-disable no-console */
/* eslint-disable import/export */
import React, { type PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import type { NextRouter } from 'next/router';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import type { Session } from 'next-auth';
import { rest } from 'msw';
import type { TRPCError } from '@trpc/server';
import client from './api';

const customRender = (
  ui: React.ReactElement,
  providerData: ProviderData = {}
) => render(ui, { wrapper: createProviders(providerData) });

type ProviderData = {
  session?: Session;
  router?: Partial<NextRouter>;
};

const createProviders = ({ session, router }: ProviderData) => {
  const Providers = ({ children }: PropsWithChildren) => (
    <RouterContext.Provider value={{ ...mockRouter, ...(router || {}) }}>
      <SessionProvider
        session={session}
        basePath="http://localhost:3000/api/auth"
      >
        {children}
      </SessionProvider>
    </RouterContext.Provider>
  );

  return client.withTRPC(Providers);
};

export const mockRouter: NextRouter = {
  basePath: '',
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
  back: jest.fn(),
  beforePopState: jest.fn(),
  prefetch: () => Promise.resolve(),
  push: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  forward: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false,
};

export const mockTrpcQuery = (name: string, result: object) =>
  rest.get(`http://localhost:3000/api/trpc/${name}`, (_req, res, ctx) =>
    res(ctx.json([{ result: { data: result } }]))
  );

export const mockTrpcMutation = (name: string, result: object) =>
  rest.post(`http://localhost:3000/api/trpc/${name}`, (_req, res, ctx) =>
    res(ctx.json([{ result: { data: result } }]))
  );

export const mockTrpcMutationError = (name: string, error: TRPCError) =>
  rest.post(`http://localhost:3000/api/trpc/${name}`, (_req, res, ctx) =>
    res(
      ctx.status(500),
      ctx.json([{ error: { code: error.code, message: error.message } }])
    )
  );

export const mockSession = (session: Session | undefined | null) =>
  rest.get('http://localhost:3000/api/auth/session', (_req, res, ctx) =>
    session ? res(ctx.json(session)) : res(ctx.json({}))
  );

export * from '@testing-library/react';

export { customRender as render };
