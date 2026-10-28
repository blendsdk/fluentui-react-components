import { Button } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { ConfirmProvider } from '../ConfirmProvider';
import { useConfirm } from '../useConfirm';

const meta: Meta<typeof ConfirmProvider> = {
  id: 'components-confirmprovider',
  title: 'Dialogs/ConfirmProvider',
  component: ConfirmProvider,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ConfirmProvider>;

/**
 * Demo subtree: buttons that ask for decisions the way application code does
 * from anywhere inside the provider, showing the settled outcome.
 */
function DecisionButtons(): ReactElement {
  const confirm = useConfirm();
  const [outcome, setOutcome] = useState('none');

  return (
    <>
      <Button
        appearance="primary"
        onClick={() => {
          void confirm({ title: 'Delete this record?' }).then(confirmed => {
            setOutcome(String(confirmed));
          });
        }}
      >
        Ask the default pair
      </Button>{' '}
      <Button
        onClick={() => {
          void confirm({
            title: 'Delete this record?',
            message: 'This cannot be undone.',
            intent: 'danger',
          }).then(confirmed => {
            setOutcome(String(confirmed));
          });
        }}
      >
        Ask with danger emphasis
      </Button>{' '}
      <span>Last outcome: {outcome}</span>
    </>
  );
}

/**
 * Demo subtree for the custom action set: the awaited outcome is the chosen
 * value, typed as its literal union.
 */
function CustomActionsButtons(): ReactElement {
  const confirm = useConfirm();
  const [outcome, setOutcome] = useState('none');

  return (
    <>
      <Button
        appearance="primary"
        onClick={() => {
          void confirm({
            title: 'Save your changes?',
            actions: [
              { value: 'cancel', label: 'Cancel' },
              { value: 'discard', label: 'Discard', intent: 'danger' },
              { value: 'save', label: 'Save', appearance: 'primary' },
            ],
          }).then(value => {
            setOutcome(value);
          });
        }}
      >
        Close the editor
      </Button>{' '}
      <span>Last outcome: {outcome}</span>
    </>
  );
}

/**
 * Demo subtree for replacement: the second request supersedes the open one —
 * the first promise resolves `false` without user interaction and only the
 * newer dialog stays visible.
 */
function ReplacementButtons(): ReactElement {
  const confirm = useConfirm();
  const [log, setLog] = useState('(none)');

  const ask = (title: string): void => {
    void confirm({ title }).then(confirmed => {
      setLog(`${title} → ${String(confirmed)}`);
    });
  };

  return (
    <>
      <Button appearance="primary" onClick={() => ask('First decision?')}>
        Ask the first
      </Button>{' '}
      <Button
        onClick={() => {
          ask('Second decision?');
        }}
      >
        Supersede with the second
      </Button>{' '}
      <span>Last settlement: {log}</span>
    </>
  );
}

/**
 * The pair flow: application code awaits `confirm({ … })` and gets a boolean
 * for the default pair. Use it as the starting point for wiring the provider.
 */
export const PairMode: Story = {
  render: () => (
    <ConfirmProvider>
      <DecisionButtons />
    </ConfirmProvider>
  ),
};

/**
 * The custom action set: `actions` replaces the pair and the awaited outcome
 * is the chosen value; the first action is the safe one and receives initial
 * focus.
 */
export const CustomActions: Story = {
  render: () => (
    <ConfirmProvider>
      <CustomActionsButtons />
    </ConfirmProvider>
  ),
};

/**
 * Replacement: requests are one-at-a-time — asking again while a dialog is
 * open resolves the previous promise `false` and shows the new dialog.
 */
export const Replacement: Story = {
  render: () => (
    <ConfirmProvider>
      <ReplacementButtons />
    </ConfirmProvider>
  ),
};

/**
 * Provider-level label defaults: every dialog this provider shows uses the
 * overridden labels unless a request overrides a key itself.
 */
export const ProviderStrings: Story = {
  render: () => (
    <ConfirmProvider strings={{ confirm: 'Yes', decline: 'No' }}>
      <DecisionButtons />
    </ConfirmProvider>
  ),
};
