import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Props of a standalone disclosure card. The application owns its content and
 * durable state; body-local state is discarded when the collapse exit completes.
 * Native div props pass through, except the rich title and structured content
 * replace native `title`, `children` and `dangerouslySetInnerHTML`.
 *
 * @example
 * ```tsx
 * <CollapsibleSection title="Details" defaultCollapsed>
 *   <p>Application-owned content</p>
 * </CollapsibleSection>
 * ```
 */
export type CollapsibleSectionProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'title' | 'children' | 'dangerouslySetInnerHTML'
> & {
  /** Meaningful, non-interactive content naming the disclosure, not a native tooltip. */
  title: ReactNode;
  /** Body content; unmounts after Fluent's collapse exit and mounts fresh on reopen. */
  children: ReactNode;
  /** Independently named header controls beside the disclosure; absent while collapsed. */
  actions?: ReactNode;
  /** Controlled collapsed value. When defined, overrides the uncontrolled initial value. */
  collapsed?: boolean;
  /** Initial uncontrolled value, false by default. Later changes do not reset local state. */
  defaultCollapsed?: boolean;
  /** Reports each requested user change once; mount and prop updates never notify. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Real heading level, independent of visual size; defaults to 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Fluent Accordion header size, not Card size; defaults to large. */
  size?: 'small' | 'medium' | 'large' | 'extra-large';
};
