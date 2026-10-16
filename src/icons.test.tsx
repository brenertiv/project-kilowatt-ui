import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MuiProvider } from './mui/MuiProvider';
import { Icon, iconNames } from './icons';

describe('Icon', () => {
  it('renders the ligature through MUI Icon with the Material Symbols font class', () => {
    const { container } = render(
      <MuiProvider>
        <Icon name="check" />
      </MuiProvider>,
    );
    const icon = container.querySelector('.MuiIcon-root')!;
    expect(icon.textContent).toBe('check');
    expect(icon.classList.contains('material-symbols-outlined')).toBe(true);
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('lists each name once', () => {
    expect(new Set(iconNames).size).toBe(iconNames.length);
  });
});
