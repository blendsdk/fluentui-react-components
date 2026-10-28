import * as React from 'react';
import type { CollapsibleSectionProps } from './CollapsibleSection.types';
import { renderCollapsibleSection } from './renderCollapsibleSection';
import { useCollapsibleSection } from './useCollapsibleSection';

/**
 * A presentation-only disclosure card with a real heading and independent header
 * actions. The application owns data and persistence; collapsed body state resets
 * after Fluent's exit completes. Its ref points to the Card's div.
 *
 * @example
 * ```tsx
 * <CollapsibleSection title="Personal details" headingLevel={2}>
 *   <p>Application-owned content</p>
 * </CollapsibleSection>
 * ```
 */
export const CollapsibleSection = React.forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  (props, ref) => {
    const state = useCollapsibleSection(props, ref);
    return renderCollapsibleSection(state);
  }
);

CollapsibleSection.displayName = 'CollapsibleSection';
