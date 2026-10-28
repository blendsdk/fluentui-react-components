import { Button } from '@fluentui/react-components';
import { DeleteRegular, SaveRegular } from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  id: 'components-confirmdialog',
  title: 'Dialogs/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A controlled confirmation prompt: a strict alert dialog that reports the chosen',
          'outcome through `onResolve` and never dismisses itself.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Initial focus — open any story: the first rendered action (the safe one) holds focus.',
          '2. Trap cycle — Tab repeatedly: focus cycles inside the dialog and never reaches the page.',
          '3. Close-time restore — activate an action: focus returns to the button that opened the story dialog.',
          '4. Esc and backdrop — press Escape and click outside: the dialog stays open and nothing reports.',
          '5. Busy focus — in the Busy story, focus the confirm action and switch busy on: focus lands on the dialog surface, not the page.',
          '6. Forced colors — with a forced-colors mode active, the danger action stays usable and readable (the override keeps the high-contrast treatment).',
          '7. Accessibility addon — the a11y panel reports no violations for every story.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

/**
 * Demo host for the pair variants: an invoker button owns the `open` state,
 * and the latest outcome is shown as feedback after the dialog closes.
 */
function PairDemo(props: { intent?: 'confirmation' | 'danger'; message?: string }): ReactElement {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('none');

  return (
    <>
      <Button appearance="primary" onClick={() => setOpen(true)}>
        Delete this record
      </Button>{' '}
      <span>Last outcome: {outcome}</span>
      <ConfirmDialog
        open={open}
        title="Delete this record?"
        message={props.message}
        intent={props.intent}
        onResolve={confirmed => {
          setOutcome(String(confirmed));
          setOpen(false);
        }}
      />
    </>
  );
}

/**
 * The default flow: the localized confirm/decline pair resolving a boolean.
 * Use it as the starting point for a host that owns visibility.
 */
export const DefaultPair: Story = {
  render: () => <PairDemo />,
};

/**
 * The danger intent: the affirmative action carries the danger token recipe
 * on a neutral surface. Check the forced-colors item of the manual checklist
 * with this story.
 */
export const DangerPair: Story = {
  render: () => <PairDemo intent="danger" message="This cannot be undone." />,
};

/**
 * The line-break contract: a plain-string message preserves `\n` as visible
 * line breaks through the `pre-line` styling.
 */
export const MultiLineMessage: Story = {
  render: () => (
    <PairDemo message={'This cannot be undone.\nThe record is removed for everyone.'} />
  ),
};

/**
 * Localization: the partial `strings` override replaces only the keys it
 * provides; the remaining label keeps its English default.
 */
export const StringOverrides: Story = {
  render: () => {
    return <StringOverridesDemo />;
  },
};

/** Demo subtree of {@link StringOverrides} with the Dutch-style overrides. */
function StringOverridesDemo(): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button appearance="primary" onClick={() => setOpen(true)}>
        Verwijderen
      </Button>
      <ConfirmDialog
        open={open}
        title="Dit record verwijderen?"
        message="Deze actie kan niet ongedaan worden gemaakt."
        strings={{ confirm: 'Verwijderen' }}
        onResolve={() => setOpen(false)}
      />
    </>
  );
}

/**
 * A custom action set: three actions with per-action emphasis (danger on
 * discard, primary on save) and decorative icons; the outcome is the chosen
 * value. The first action is the safe one — the ordering rule puts it first.
 */
export const CustomActions: Story = {
  render: () => {
    return <CustomActionsDemo />;
  },
};

/** Demo subtree of {@link CustomActions} that reports the chosen value. */
function CustomActionsDemo(): ReactElement {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('none');

  return (
    <>
      <Button appearance="primary" onClick={() => setOpen(true)}>
        Close the editor
      </Button>{' '}
      <span>Last outcome: {outcome}</span>
      <ConfirmDialog
        open={open}
        title="Save your changes?"
        actions={[
          { value: 'cancel', label: 'Cancel' },
          { value: 'discard', label: 'Discard', intent: 'danger', icon: <DeleteRegular /> },
          { value: 'save', label: 'Save', appearance: 'primary', icon: <SaveRegular /> },
        ]}
        onResolve={value => {
          setOutcome(value);
          setOpen(false);
        }}
      />
    </>
  );
}

/**
 * The busy state: while the host's follow-up runs, every action is disabled
 * and focus moves to the dialog surface — never to the page body. Use the
 * busy-focus and forced-colors items of the manual checklist with this story.
 */
export const Busy: Story = {
  render: () => {
    return <BusyDemo />;
  },
};

/** Demo subtree of {@link Busy}: activation switches the dialog to busy. */
function BusyDemo(): ReactElement {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button appearance="primary" onClick={() => setOpen(true)}>
        Start a slow confirmation
      </Button>{' '}
      <Button
        onClick={() => {
          setBusy(false);
          setOpen(false);
        }}
      >
        Reset
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this record?"
        message="The dialog stays busy while the host finishes its work."
        busy={busy}
        onResolve={() => {
          setBusy(true);
        }}
      />
    </>
  );
}
