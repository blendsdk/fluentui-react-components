import { Badge, Button, Input, makeStyles, tokens } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { DescriptionList, DescriptionListItem } from '../../../index';
import { CollapsibleSection } from '../CollapsibleSection';

/** Story-only layout uses tokens; the shared decorator supplies FluentProvider. */
const useStyles = makeStyles({
  stack: { display: 'grid', gap: tokens.spacingVerticalM, minWidth: 0 },
  commands: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalS },
  // A deliberately narrow workbench width exercises wrapping, not a component sizing contract.
  narrow: { width: '18rem', maxWidth: '100%' },
});

/** Workbench metadata and the manual acceptance checklist for native browser behavior. */
const meta: Meta<typeof CollapsibleSection> = {
  title: 'Components/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Manual checks: Tab/Shift+Tab follows header → actions → body; Enter/Space toggles. ' +
          'In Controlled, retain body/action focus and collapse externally, then repeat with outside focus. ' +
          'Compare ordinary and reduced motion: inspect the default chevron SVG transition and final rotation, ' +
          'Fluent panel motion, and unaffected caller SVGs. Check narrow width and 200% zoom, all sizes/headings, ' +
          'light/dark themes, RTL, forced colors, heading navigation and the a11y panel. ' +
          'Nested toggles stay independent; edited body state resets after collapse exit. ' +
          'A build or jsdom test is not evidence these browser checks ran.',
      },
    },
  },
};

export default meta;

/** Story variants share the public component contract. */
type Story = StoryObj<typeof CollapsibleSection>;

/** Default disclosure for application-owned detail data. */
export const Default: Story = {
  args: { title: 'Personal details', children: 'Application-owned content' },
};

/** Start closed when the content is secondary; no child mounts until expansion. */
export const InitiallyCollapsed: Story = {
  args: {
    title: 'Additional details',
    defaultCollapsed: true,
    children: 'Content mounts on expansion',
  },
};

/** Demonstrates independent commands alongside a composed, application-owned detail list. */
export const WithActions: Story = {
  args: { title: 'Personal details' },
  render: args => (
    <CollapsibleSection
      {...args}
      actions={<Button aria-label="Edit personal details">Edit</Button>}
    >
      <DescriptionList layout="columns">
        <DescriptionListItem label="Name">Alex Morgan</DescriptionListItem>
        <DescriptionListItem label="Plan">Pro</DescriptionListItem>
      </DescriptionList>
    </CollapsibleSection>
  ),
};

/** An application accepts requests and can also collapse while body/action focus stays put. */
function ControlledExample(): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const styles = useStyles();
  return (
    <div className={styles.stack}>
      <div className={styles.commands}>
        <Button onClick={() => setCollapsed(false)}>Expand externally</Button>
        <Button onMouseDown={event => event.preventDefault()} onClick={() => setCollapsed(true)}>
          Collapse externally (keep pointer focus)
        </Button>
        <Input aria-label="Outside focus target" placeholder="Outside the section" />
      </div>
      <CollapsibleSection
        title="Controlled details"
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        actions={<Button aria-label="Edit controlled details">Edit</Button>}
      >
        <Input aria-label="Body note" defaultValue="Initial value" />
      </CollapsibleSection>
      <p>
        Edit the note, collapse, wait for exit and reopen: the note resets. Pointer activation of
        the external collapse button preserves the prior focus, so local recovery can be inspected.
        Keyboard activation leaves focus outside and must not steal it.
      </p>
    </div>
  );
}

/** Use controlled state when an application owns expansion or needs external commands. */
export const Controlled: Story = { render: () => <ControlledExample /> };

/** All visual header sizes retain the same filled small Card and level-two heading. */
export const HeaderSizes: Story = {
  render: () => {
    const styles = useStyles();
    return (
      <div className={styles.stack}>
        {(['small', 'medium', 'large', 'extra-large'] as const).map(size => (
          <CollapsibleSection key={size} title={`${size} header`} size={size}>
            The Card surface and padding stay small.
          </CollapsibleSection>
        ))}
      </div>
    );
  },
};

/** Choose semantic levels to match the page outline; nesting does not infer a level. */
export const HeadingLevelsAndNesting: Story = {
  render: () => (
    <CollapsibleSection title="Level two" headingLevel={2}>
      <CollapsibleSection title="Level three" headingLevel={3}>
        <CollapsibleSection title="Level four" headingLevel={4}>
          <CollapsibleSection title="Level five" headingLevel={5}>
            <CollapsibleSection title="Level six" headingLevel={6}>
              Each disclosure toggles independently. Closing a parent discards child state.
            </CollapsibleSection>
          </CollapsibleSection>
        </CollapsibleSection>
      </CollapsibleSection>
    </CollapsibleSection>
  ),
};

/** Rich non-interactive labels and long unbroken text wrap without clipping sibling controls. */
export const RichAndLongContent: Story = {
  render: () => {
    const styles = useStyles();
    return (
      <div className={styles.narrow}>
        <CollapsibleSection
          title={
            <>
              Personal details <Badge>Pro</Badge> {'AReallyLongUnbrokenLabelForWrapping'.repeat(3)}
            </>
          }
          actions={<Button aria-label="Edit long details">Edit details</Button>}
        >
          <p>Resize the container and zoom to inspect title, actions and focus outlines.</p>
          <Input aria-label="Disposable note" defaultValue="This resets after exit" />
        </CollapsibleSection>
      </div>
    );
  },
};
