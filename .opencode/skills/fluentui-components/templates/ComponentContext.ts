// Template: src/components/<Name>/<Name>Context.ts
// Only for container/child pairs: the container provides, the child consumes.
// The file lives next to the CHILD that consumes it; the container imports it
// from there. The fallback is the child's standalone behavior.
import { createContext } from 'react';

/**
 * What the surrounding container asks its children to render with.
 */
export type <Name>Variant = 'default' | 'compact';

/**
 * <Variant> the children render with.
 *
 * The container provides the value it was given, so the innermost container
 * wins for the children it wraps. Children rendered outside any container fall
 * back to `'default'`, the variant of the first container.
 */
export const <Name>VariantContext = createContext<<Name>Variant>('default');
