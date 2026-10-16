import { Button } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { SystemErrorProvider } from './SystemErrorProvider';
import type { SystemErrorProviderProps } from './SystemErrorProvider.types';
import { useSystemError } from './useSystemError';

const meta: Meta<typeof SystemErrorProvider> = {
  title: 'Components/SystemErrorProvider',
  component: SystemErrorProvider,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SystemErrorProvider>;

/** The host callbacks the stories wire; the workbench performs no real navigation. */
const noop = (): void => {};

/**
 * Builds the sample error the stories report: a realistic failure with a
 * custom code and request id, so the dialog shows the serialized shape an
 * application sends to support.
 */
function createSampleError(): Error {
  return Object.assign(new Error('The order export failed: the upstream service returned 503'), {
    code: 'UPSTREAM_UNAVAILABLE',
    requestId: 'req_8421',
  });
}

/**
 * Demo subtree: buttons that report errors the way application code reports
 * failures from anywhere inside the provider.
 */
function ReportButtons(): ReactElement {
  const { catchError, clearError } = useSystemError();

  return (
    <>
      <Button appearance="primary" onClick={() => catchError(createSampleError())}>
        Report an error
      </Button>{' '}
      <Button onClick={() => clearError()}>Clear the error</Button>
    </>
  );
}

/**
 * Demo subtree for the session-expired flow: the unauthorized variant is an
 * explicit call-site decision, never inferred from the error value.
 */
function ExpiredSessionButtons(): ReactElement {
  const { catchError, clearError } = useSystemError();

  return (
    <>
      <Button
        appearance="primary"
        onClick={() =>
          catchError(new Error('The session expired while loading the report'), {
            kind: 'unauthorized',
          })
        }
      >
        Report a session expiry
      </Button>{' '}
      <Button onClick={() => clearError()}>Clear the error</Button>
    </>
  );
}

/**
 * Demo subtree for the details override: one report carries verbatim support
 * text, the next plain report shows the serialized error again.
 */
function OverrideButtons(): ReactElement {
  const { catchError } = useSystemError();

  return (
    <>
      <Button
        appearance="primary"
        onClick={() =>
          catchError(createSampleError(), { detailsText: 'Support case 4711 — attach the trace' })
        }
      >
        Report with a support reference
      </Button>{' '}
      <Button onClick={() => catchError(createSampleError())}>Report the raw error</Button>
    </>
  );
}

/**
 * Demo subtree for the opt-in global capture: one button produces a genuine
 * uncaught error, one rejects a promise. Both reach the provider while the
 * browser console keeps showing them — capture never suppresses events.
 */
function CaptureButtons(): ReactElement {
  const { clearError } = useSystemError();

  return (
    <>
      <Button
        appearance="primary"
        onClick={() => {
          setTimeout(() => {
            throw new Error('Uncaught failure demo');
          }, 0);
        }}
      >
        Throw an uncaught error
      </Button>{' '}
      <Button
        onClick={() => {
          void Promise.reject(new Error('Unhandled rejection demo'));
        }}
      >
        Reject a promise
      </Button>{' '}
      <Button onClick={() => clearError()}>Clear the error</Button>
    </>
  );
}

/**
 * Wraps a demo subtree in the provider with the story's props.
 */
function renderProviderDemo(
  demo: ReactElement,
  props: Omit<SystemErrorProviderProps, 'children'> = {}
): ReactElement {
  return <SystemErrorProvider {...props}>{demo}</SystemErrorProvider>;
}

/**
 * The standard flow: application code reports an error and the provider shows
 * the dialog with the details and both recovery actions. Use it as the
 * starting point for wiring an application.
 */
export const StandardError: Story = {
  render: () => renderProviderDemo(<ReportButtons />, { onReload: noop }),
};

/**
 * The session-expired flow: reporting with `kind: 'unauthorized'` shows the
 * sign-out-only dialog. Signing out closes the dialog first and then runs the
 * host callback, so the user can never be stuck inside it.
 */
export const Unauthorized: Story = {
  render: () => renderProviderDemo(<ExpiredSessionButtons />, { onSignOut: noop }),
};

/**
 * The details override: a report can replace the serialized details with
 * verbatim support text; the next plain report shows the serialized error
 * again, without any stale override.
 */
export const DetailsOverride: Story = {
  render: () => renderProviderDemo(<OverrideButtons />),
};

/**
 * Opt-in global capture: uncaught window errors and unhandled promise
 * rejections are reported through the dialog while the console continues to
 * show them. One capture-enabled provider per application is the supported
 * setup.
 */
export const CaptureDemo: Story = {
  render: () => renderProviderDemo(<CaptureButtons />, { captureGlobalErrors: true }),
};
