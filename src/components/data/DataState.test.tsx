import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../i18n';
import { DataState } from './DataState';

describe('DataState', () => {
  it('shows a busy skeleton while loading', () => {
    render(
      <DataState state={{ status: 'loading' }}>
        <p>rows</p>
      </DataState>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('rows')).toBeNull();
  });

  it('shows the error with a retry that calls back', async () => {
    const onRetry = vi.fn();
    render(
      <DataState state={{ status: 'error', error: 'Server error.', onRetry }}>
        <p>rows</p>
      </DataState>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Server error.');
    screen.getByRole('button', { name: 'Retry' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty copy, and the content when ready or fetching', () => {
    const { rerender } = render(
      <DataState state={{ status: 'empty' }} empty={{ title: 'No alerts' }}>
        <p>rows</p>
      </DataState>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No alerts');
    rerender(
      <DataState state={{ status: 'fetching' }}>
        <p>rows</p>
      </DataState>,
    );
    expect(screen.getByText('rows').parentElement).toHaveAttribute('aria-busy', 'true');
    rerender(
      <DataState state={{ status: 'ready' }}>
        <p>rows</p>
      </DataState>,
    );
    expect(screen.getByText('rows')).toBeInTheDocument();
  });
});
