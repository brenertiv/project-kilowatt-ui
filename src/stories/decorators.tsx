import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import type { Decorator } from '@storybook/react-vite';
import { mockControls, resetMockControls, setMockFailure } from '../api/mock';
import { TruncatedText } from '../components/TruncatedText';

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

/**
 * Shows a chart story the way charts ship: in an outlined `Card`, under a `CardHeader` with the title
 * and subheader from the story's `parameters.card`. Set it as `decorators` in a chart story file.
 */
export const inCard: Decorator = (Story, { parameters }) => {
  const { title, subheader } = (parameters.card ?? {}) as { title?: string; subheader?: string };
  return (
    <Card variant="outlined" sx={{ maxWidth: 720 }}>
      <CardHeader
        title={title && <TruncatedText>{title}</TruncatedText>}
        subheader={subheader && <TruncatedText>{subheader}</TruncatedText>}
      />
      <Story />
    </Card>
  );
};
