import { describe, expect, it } from 'vitest';
import type { AppBarButtonProps } from '../src/index';

describe('AppBarButton type contract', () => {
  it('should accept text and named icon-only commands', () => {
    const text: AppBarButtonProps = { children: 'Settings' };
    const iconOnly: AppBarButtonProps = { 'aria-label': 'Settings', icon: null };

    expect(text).toBeDefined();
    expect(iconOnly).toBeDefined();
  });

  it('should reject an unnamed command', () => {
    // @ts-expect-error a command needs visible text or an aria-label
    const unnamed: AppBarButtonProps = {};

    expect(unnamed).toBeDefined();
  });

  it('should reject the forced appearance, shape and size props', () => {
    const props: AppBarButtonProps = {
      children: 'Settings',
      // @ts-expect-error appearance is fixed
      appearance: 'primary',
      // @ts-expect-error shape is fixed
      shape: 'circular',
      // @ts-expect-error size is fixed
      size: 'large',
    };

    expect(props).toBeDefined();
  });

  it('should reject link commands and null children', () => {
    const linkProps: AppBarButtonProps = {
      children: 'Settings',
      // @ts-expect-error link commands are not part of the API
      href: '/',
      // @ts-expect-error the anchor root is not part of the API
      as: 'a',
    };
    // @ts-expect-error the children branch requires non-null content
    const nullChildren: AppBarButtonProps = {
      children: null,
    };

    expect(linkProps).toBeDefined();
    expect(nullChildren).toBeDefined();
  });
});
