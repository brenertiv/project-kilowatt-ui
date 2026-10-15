import Container from '@mui/material/Container';
import type { Decorator } from '@storybook/react-vite';
import { mockControls, resetMockControls, setMockFailure } from '../api/mock';

/** Per-story switches for the in-process mock API. Set them with `parameters.mockApi`. */
export type MockApiParameters = {
  /** Reject every request with a 500, to show a page's error states. */
  fail?: boolean;
  /** Simulated round trip in ms. Defaults to 350; 0 renders loaded data on the first frame. */
  latencyMs?: number;
};

/**
 * Applies `parameters.mockApi` before the story renders, so its first queries
 * already see the switches. Every story starts from the defaults, so a failing
 * story never leaks into the next. Global: registered in `.storybook/preview.tsx`.
 */
export const withMockApi: Decorator = (Story, { parameters }) => {
  const { fail = false, latencyMs } = (parameters.mockApi ?? {}) as MockApiParameters;
  resetMockControls();
  setMockFailure('*', fail);
  if (latencyMs !== undefined) mockControls.latencyMs = latencyMs;
  return <Story />;
};

/** Page stories: full-bleed canvas with the page column the app shell gives a route. */
export const withPageFrame: Decorator = (Story) => (
  <Container maxWidth="lg" sx={{ py: 5 }}>
    <Story />
  </Container>
);
