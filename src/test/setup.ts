import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library only cleans up on its own when vitest globals are on.
afterEach(cleanup);
