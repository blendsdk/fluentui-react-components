import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Card,
  mergeClasses,
} from '@fluentui/react-components';
import type { ReactElement } from 'react';
import type { CollapsibleSectionState } from './useCollapsibleSection';

/**
 * Composes the fixed Card surface with one independently controlled Accordion item.
 * The generic host keeps aria-controls connected after Fluent unmounts the named
 * panel. Actions are siblings of the heading, never nested interactive content.
 *
 * @param state - fully resolved content, callbacks, IDs, refs and classes
 * @returns the disclosure card, leaving panel motion and native activation to Fluent
 */
export function renderCollapsibleSection(state: CollapsibleSectionState): ReactElement {
  return (
    <Card
      {...state.rootProps}
      appearance="filled"
      size="small"
      focusMode="off"
      ref={state.rootRef}
      className={mergeClasses(state.classes.root, state.rootProps.className)}
    >
      <Accordion collapsible openItems={state.openItems} onToggle={state.onToggle}>
        <AccordionItem value={state.itemValue}>
          <div className={state.classes.headerRow}>
            <AccordionHeader
              as={state.headingTag}
              size={state.size}
              className={state.classes.heading}
              button={{
                id: state.buttonId,
                'aria-controls': state.contentId,
                ref: state.buttonRef,
                className: state.classes.button,
              }}
              expandIcon={{ className: state.classes.expandIcon }}
            >
              <span className={state.classes.title}>{state.title}</span>
            </AccordionHeader>
            {state.showActions && (
              <div ref={state.actionsRef} className={state.classes.actions}>
                {state.actions}
              </div>
            )}
          </div>
          <div id={state.contentId}>
            <AccordionPanel
              role="group"
              aria-labelledby={state.buttonId}
              className={state.classes.panel}
            >
              <div ref={state.bodyRef} className={state.classes.body}>
                {state.children}
              </div>
            </AccordionPanel>
          </div>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
