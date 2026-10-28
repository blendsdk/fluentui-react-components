import type { AccordionHeaderProps, AccordionToggleEventHandler } from '@fluentui/react-components';
import type { ComponentPropsWithoutRef, FocusEventHandler, Ref, RefObject } from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CollapsibleSectionProps } from './CollapsibleSection.types';
import type { CollapsibleSectionClasses } from './useCollapsibleSectionStyles.styles';
import { useCollapsibleSectionStyles } from './useCollapsibleSectionStyles.styles';

/** Each instance has its own Accordion, so the single item needs no global identity. */
const ITEM_VALUE = 'section';

/** Semantic heading selection is independent from Fluent's visual header size. */
const headingTags: Record<
  NonNullable<CollapsibleSectionProps['headingLevel']>,
  NonNullable<AccordionHeaderProps['as']>
> = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' };

/** Resolved disclosure state consumed by the pure renderer. */
export type CollapsibleSectionState = {
  /** Caller-owned non-interactive disclosure label. */
  title: CollapsibleSectionProps['title'];
  /** Caller body; Fluent owns its mount and exit lifecycle. */
  children: CollapsibleSectionProps['children'];
  /** Sibling actions, resolved to absent when collapsed or not supplied. */
  actions: CollapsibleSectionProps['actions'];
  /** Whether an action wrapper is needed; opaque caller trees are not inspected. */
  showActions: boolean;
  /** Resolved native heading tag. */
  headingTag: NonNullable<AccordionHeaderProps['as']>;
  /** Resolved visual header size. */
  size: NonNullable<CollapsibleSectionProps['size']>;
  /** One private value shared by the item and its controlled open-items mapping. */
  itemValue: string;
  /** Controlled Accordion membership derived from the effective collapsed value. */
  openItems: string[];
  /** Converts Fluent's requested membership into one collapsed notification. */
  onToggle: AccordionToggleEventHandler<string>;
  /** Stable private disclosure ID used to name the mounted panel. */
  buttonId: string;
  /** Stable private host ID targeted even after the panel unmounts. */
  contentId: string;
  /** Local focus target for a collapse that removes focused descendants. */
  buttonRef: RefObject<HTMLButtonElement | null>;
  /** Tracks the independently removed action area. */
  actionsRef: RefObject<HTMLDivElement | null>;
  /** Tracks body descendants while Fluent makes them inert or removes them. */
  bodyRef: RefObject<HTMLDivElement | null>;
  /** Native div props, including composed focus handlers and caller classes/style. */
  rootProps: Omit<
    ComponentPropsWithoutRef<'div'>,
    'title' | 'children' | 'dangerouslySetInnerHTML'
  >;
  /** Application ref forwarded to the Card's div. */
  rootRef: Ref<HTMLDivElement>;
  /** Local layout and public-slot style classes. */
  classes: CollapsibleSectionClasses;
};

/**
 * Adapts one boolean to Fluent's item membership and repairs only locally lost focus.
 * Controlled values remain authoritative; notifications express requests, never prop changes.
 *
 * @param props - caller content, state and native div props
 * @param ref - application ref to the Card root
 * @returns the complete render state, with all defaults resolved
 */
export function useCollapsibleSection(
  props: CollapsibleSectionProps,
  ref: Ref<HTMLDivElement>
): CollapsibleSectionState {
  const {
    title,
    children,
    actions,
    collapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    headingLevel = 2,
    size = 'large',
    ...rootProps
  } = props;
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const effectiveCollapsed = collapsed ?? internalCollapsed;
  const buttonId = useId();
  const contentId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const previousCollapsed = useRef(effectiveCollapsed);
  const ownedFocus = useRef<Element | null>(null);
  const classes = useCollapsibleSectionStyles();

  /** Membership comes from Fluent, avoiding a toggle based on stale captured state. */
  const onToggle: AccordionToggleEventHandler<string> = (_event, data) => {
    const nextCollapsed = !data.openItems.includes(ITEM_VALUE);
    setInternalCollapsed(nextCollapsed);
    onCollapsedChange?.(nextCollapsed);
  };

  /** Remember descendants before actions can disappear in the same collapse commit. */
  const onFocusCapture: FocusEventHandler<HTMLDivElement> = event => {
    const target = event.target;
    ownedFocus.current =
      actionsRef.current?.contains(target) || bodyRef.current?.contains(target) ? target : null;
    rootProps.onFocusCapture?.(event);
  };

  /** Ordinary focus departure revokes ownership; collapse-induced loss may need repair. */
  const onBlurCapture: FocusEventHandler<HTMLDivElement> = event => {
    if (!effectiveCollapsed || event.relatedTarget !== null) {
      ownedFocus.current = null;
    }
    rootProps.onBlurCapture?.(event);
  };

  // Synchronize after DOM removal/inert updates, but before paint. Mount, expansion and
  // unrelated renders do not qualify, and a connected outside control always keeps focus.
  useLayoutEffect(() => {
    const wasCollapsed = previousCollapsed.current;
    previousCollapsed.current = effectiveCollapsed;
    if (wasCollapsed || !effectiveCollapsed) return;

    const button = buttonRef.current;
    if (!button?.isConnected) return;
    const document = button.ownerDocument;
    const active = document.activeElement;
    const remembered = ownedFocus.current;
    const activeOwned = actionsRef.current?.contains(active) || bodyRef.current?.contains(active);
    // Removed actions no longer have a ref. A browser may also drop inert body focus
    // to document.body before this effect; retained ownership covers that narrow gap.
    const lostOwned =
      active === document.body &&
      remembered !== null &&
      (!remembered.isConnected || bodyRef.current?.contains(remembered));
    if (active !== button && (activeOwned || lostOwned)) button.focus();
    ownedFocus.current = null;
  }, [effectiveCollapsed]);

  return {
    title,
    children,
    actions: effectiveCollapsed ? undefined : actions,
    showActions: !effectiveCollapsed && actions !== null && actions !== undefined,
    headingTag: headingTags[headingLevel],
    size,
    itemValue: ITEM_VALUE,
    openItems: effectiveCollapsed ? [] : [ITEM_VALUE],
    onToggle,
    buttonId,
    contentId,
    buttonRef,
    actionsRef,
    bodyRef,
    rootProps: { ...rootProps, onFocusCapture, onBlurCapture },
    rootRef: ref,
    classes,
  };
}
