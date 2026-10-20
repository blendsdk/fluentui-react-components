import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { installJsdomStubs, resetJsdomStubs } from './jsdomStubs';

installJsdomStubs();

/**
 * Unmounts every rendered component after each test.
 *
 * React Testing Library performs this automatically only when the test
 * functions are globals. The repository imports them from `vitest` instead,
 * so without the explicit call Fluent UI's focus observers stay attached to
 * a document that Vitest has already torn down and throw afterwards.
 *
 * Importing `@testing-library/jest-dom/vitest` registers the DOM matchers
 * (`toBeInTheDocument`, `toHaveAttribute`, ...) on Vitest's `expect`, so
 * tests can assert on the DOM the way React Testing Library documents it.
 */
afterEach(() => {
  cleanup();
  resetJsdomStubs();
});
