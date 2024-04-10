/* eslint-disable no-console */
/* eslint-disable import/export */
import React, { type PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import type { NextRouter } from 'next/router';
import type { Session } from 'next-auth';
import { http, HttpResponse } from 'msw';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import type { TRPCError } from '@trpc/server';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import client from './api';

const customRender = (
  ui: React.ReactElement,
  providerData: ProviderData = {},
) => render(ui, { wrapper: createProviders(providerData) });

type ProviderData = {
  session?: Session;
  router?: Partial<NextRouter>;
};

const createProviders = ({ session, router }: ProviderData) => {
  const Providers = ({ children }: PropsWithChildren) => (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <RouterContext.Provider value={{ ...mockRouter, ...(router || {}) }}>
        <SessionProvider
          session={session}
          basePath="http://localhost:3000/api/auth"
        >
          {children}
        </SessionProvider>
      </RouterContext.Provider>
    </LocalizationProvider>
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
  http.get(
    `http://localhost:3000/api/trpc/${name}`,
    () =>
      new Response(JSON.stringify([{ result: { data: result } }]), {
        status: 200,
      }),
  );

export const mockTrpcMutation = (name: string, result: object) =>
  http.post(
    `http://localhost:3000/api/trpc/${name}`,
    () =>
      new Response(JSON.stringify([{ result: { data: result } }]), {
        status: 200,
      }),
  );

export const mockTrpcMutationError = (name: string, error: TRPCError) =>
  http.post(
    `http://localhost:3000/api/trpc/${name}`,
    () =>
      new HttpResponse(null, {
        status: 500,
        statusText: error.message,
      }),
  );

export const mockSession = (session: Session | undefined | null) =>
  http.get('http://localhost:3000/api/auth/session', () =>
    session
      ? new Response(JSON.stringify(session), {
          status: 200,
        })
      : new Response(JSON.stringify({}), {
          status: 200,
        }),
  );

export * from '@testing-library/react';

export { customRender as render };
