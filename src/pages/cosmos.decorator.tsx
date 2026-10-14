import { useEffect, type ReactNode } from 'react';
import Container from '@mui/material/Container';
import { useFixtureInput } from 'react-cosmos/client';
import { useQueryClient } from '@tanstack/react-query';
import { mockControls, setMockFailure } from '../api/mock';

/**
 * Page fixtures run real queries against the mock adapter. This decorator
 * adds the switches a page needs: fail every request, and slow them down.
 */
export default function PagesDecorator({ children }: { children: ReactNode }) {
  const [fail] = useFixtureInput('fail requests', false);
  const [latency] = useFixtureInput('latency ms', 350);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMockFailure('*', fail);
    mockControls.latencyMs = latency;
    // The page's queries start before this parent effect runs. Resetting them
    // (rather than clearing the cache) cancels those requests and refetches the
    // active ones through the same query objects, so the page's observers stay
    // attached and the new switches apply from the first load.
    void queryClient.resetQueries();
    return () => {
      setMockFailure('*', false);
      mockControls.latencyMs = 350;
    };
  }, [fail, latency, queryClient]);

  return (
    <Container maxWidth="lg" disableGutters>
      {children}
    </Container>
  );
}
