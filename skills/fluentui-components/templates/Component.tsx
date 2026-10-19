// Template: src/components/<Name>/<Name>.tsx
// Replace <Name> with the PascalCase component name and <element> with the
// element the root of the component renders (div, ul, dl, button, ...).
import * as React from 'react';
import type { <Name>Props } from './<Name>.types';
import { render<Name> } from './render<Name>';
import { use<Name> } from './use<Name>';

/**
 * One or two sentences: what this component renders and who decides its
 * content. Add a caveat sentence when there is a real one (when not to use
 * it, what it deliberately does not own).
 *
 * @example
 * ```tsx
 * <<Name> label="Example" />
 * ```
 */
export const <Name> = React.forwardRef<<element>, <Name>Props>((props, ref) => {
  const state = use<Name>(props, ref);

  return render<Name>(state);
});

<Name>.displayName = '<Name>';
