import { Button } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { ErrorDialog } from '../ErrorDialog';
import type { ErrorDialogProps } from '../ErrorDialog.types';

const meta: Meta<typeof ErrorDialog> = {
  title: 'Components/ErrorDialog',
  component: ErrorDialog,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ErrorDialog>;

/**
 * Builds the sample error the standard stories show: a realistic failure with
 * a custom code and request id, so the details area demonstrates the
 * serialized shape an application sends to support.
 */
function createSampleError(): Error {
  return Object.assign(new Error('The order export failed: the upstream service returned 503'), {
    code: 'UPSTREAM_UNAVAILABLE',
    requestId: 'req_8421',
  });
}

/**
 * Renders a trigger button and the story's dialog.
 *
 * The dialog starts closed: pressing the trigger opens it, so the story
 * mirrors how an application raises the dialog from an action — and the
 * keyboard pass can watch focus move into the dialog the moment it opens.
 * Dismissing or picking the offered recovery action closes it again, and the
 * trigger brings it back.
 */
function InteractiveDialog(args: Partial<ErrorDialogProps>): ReactElement {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { kind, ...rest } = args;

  return (
    <>
      <Button appearance="primary" onClick={() => setOpen(true)}>
        Trigger error dialog
      </Button>
      {kind === 'unauthorized' ? (
        <ErrorDialog {...rest} kind="unauthorized" open={open} onSignOut={close} />
      ) : (
        <ErrorDialog {...rest} open={open} onDismiss={close} onReload={close} />
      )}
    </>
  );
}

/**
 * The standard error variant: a blocking dialog with the serialized details
 * and both recovery actions. Use it for application errors where retrying
 * through a reload is a reasonable choice.
 */
export const Standard: Story = {
  args: { error: createSampleError() },
  render: args => <InteractiveDialog {...args} />,
};

/**
 * The session-expired variant: its only recovery action signs the user out,
 * with no way to dismiss it — the legacy escape hatch that left users in a
 * dead session is gone by design. Use it when the session has expired.
 */
export const Unauthorized: Story = {
  args: { kind: 'unauthorized', error: new Error('The session expired while loading the report') },
  render: args => <InteractiveDialog {...args} />,
};

/**
 * A localized dialog: only some keys are overridden and every unset key keeps
 * its English default, so an application can translate incrementally.
 */
export const DutchStrings: Story = {
  args: {
    error: createSampleError(),
    strings: {
      title: 'Applicatiefout',
      close: 'Sluiten',
      detailsLabel: 'Foutdetails',
    },
  },
  render: args => <InteractiveDialog {...args} />,
};

/**
 * A long error payload — the details area shows a long stack line that
 * scrolls inside the read-only control instead of widening the dialog. Use it
 * to check the fixed surface width with realistic support data.
 */
export const LongDetails: Story = {
  args: {
    error: Object.assign(new Error('The settlement batch was rolled back before its commit'), {
      stack:
        'Error: The settlement batch was rolled back before its commit at SettlementWorker.processBatch (/srv/apps/settlement/src/workers/settlement-worker.ts:213:19) at async handleQueueMessage (/srv/apps/settlement/src/workers/queue.ts:88:5) at async MessageLoop.run (/srv/apps/runtime/src/loops/message-loop.ts:142:9) at async runWithTimeout (/srv/apps/runtime/src/loops/timeouts.ts:56:7)',
      batchId: 'btc_2026_10_16_004',
    }),
  },
  render: args => <InteractiveDialog {...args} />,
};

/**
 * No error payload at all: the details area shows the no-details text. Use it
 * for failures the host cannot attach a value to, such as a session that
 * expired without an upstream response.
 */
export const MissingDetails: Story = {
  render: args => <InteractiveDialog {...args} />,
};
