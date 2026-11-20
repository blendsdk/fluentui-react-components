import { describe, expect, it } from 'vitest';
import type { AppBarTitleProps } from '../src/index';

describe('AppBarTitle type contract', () => {
  it('should reject a heading-and-link combination', () => {
    // @ts-expect-error headingLevel and href are mutually exclusive
    const headingLink: AppBarTitleProps = {
      children: 'Contoso',
      headingLevel: 1,
      href: '/home',
    };

    expect(headingLink).toBeDefined();
  });

  it('should reject a heading level outside 1-6', () => {
    const invalidLevel: AppBarTitleProps = {
      children: 'Contoso',
      // @ts-expect-error only heading levels 1-6 are valid
      headingLevel: 7,
    };

    expect(invalidLevel).toBeDefined();
  });
});
