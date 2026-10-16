import { describe, expect, it } from 'vitest';
import * as api from '../src/index';
import type { ErrorDialogKind, ErrorDialogProps, ErrorDialogStrings } from '../src/index';

describe('package export surface', () => {
  it('exposes exactly the documented component exports', () => {
    // Consumers import from the package root, so the runtime surface is part
    // of the contract: every documented component is reachable and no
    // internal module leaks out.
    expect(Object.keys(api).sort()).toEqual([
      'DescriptionList',
      'DescriptionListItem',
      'ErrorDialog',
    ]);
  });

  it('exports the public ErrorDialog types', () => {
    // The type imports above only compile when the package root exports them;
    // the values below keep the file local-usage clean under noUnusedLocals.
    const kind = 'error' satisfies ErrorDialogKind;
    const partialStrings: Pick<ErrorDialogStrings, 'title'> = { title: 'Application error' };
    const dialogProps: ErrorDialogProps = { open: true, onDismiss: () => {} };

    expect(kind).toBe('error');
    expect(partialStrings.title).toBe('Application error');
    expect(dialogProps.open).toBe(true);
  });
});
