import { Button } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useLoading } from '../../Loading';
import { SystemErrorProvider, useSystemError } from '../../SystemErrorProvider';
import { LoadingOverlay } from '../LoadingOverlay';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'Components/LoadingOverlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A region-scoped blocking layer that keeps its children mounted and makes them inert while loading.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Inert blur — focus a control inside the content, then start loading: focus lands on the named overlay root and is not lost.',
          '2. Restore — end loading: focus returns to where it was before the overlay appeared.',
          '3. Pointer blocking — click or tap the covered content while visible: nothing activates.',
          '4. Idle state — with `loading={false}` there is no scrim, no status text and the content is interactive.',
          '5. Announcement — reveal the overlay: the label is announced once; the root name does not double-announce.',
          '6. Focus ring — focus the overlay root: no visible ring, as designed.',
          '7. Busy semantics — inspect the content wrapper while loading: `aria-busy` is exposed on the `display: contents` wrapper; if a browser drops it, record the normal-wrapper fallback.',
          '8. Portaled and fixed content — open a Fluent `Menu` in the content: record whether the popover escapes the scrim (known region-scoped limitation).',
          '9. Light and dark theme, forced colors and reduced motion — the scrim and label stay legible; no extra motion beyond Fluent’s spinner.',
          '10. Region scope — in the Fixed size region story, only the 200×200 box is covered and the rest of the page stays interactive.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LoadingOverlay>;

/** Resolves after the given delay, standing in for an application call. */
function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, milliseconds);
  });
}

/** The card the overlay covers in every story. */
function ActorCard(props: { onSave: () => void; disabled?: boolean }): ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: 24,
        width: 360,
        border: '1px solid #d1d1d1',
        borderRadius: 8,
      }}
    >
      <strong>Actor record</strong>
      <span>Name: Ada Lovelace</span>
      <span>Status: active</span>
      <Button appearance="primary" onClick={props.onSave} disabled={props.disabled}>
        Save
      </Button>
    </div>
  );
}

/**
 * The application owns the boolean. Saving lasts 1.2 seconds, so the overlay
 * appears after its 300 ms delay and disappears when the save settles.
 */
function AppOwnedDemo(): ReactElement {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('No save yet.');

  const save = async (): Promise<void> => {
    setLoading(true);
    await wait(1200);
    setLoading(false);
    setMessage('Saved after 1.2 seconds.');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <LoadingOverlay loading={loading} label="Saving the actor…">
        <ActorCard onSave={() => void save()} disabled={loading} />
      </LoadingOverlay>
      <span>{message}</span>
    </div>
  );
}

/**
 * A 150 ms operation settles before the default 300 ms delay, so the overlay
 * never flashes even though the content was briefly busy.
 */
function FastOperationDemo(): ReactElement {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('No save yet.');

  const save = async (): Promise<void> => {
    setLoading(true);
    await wait(150);
    setLoading(false);
    setMessage('The 150 ms save finished before the delay; no overlay appeared.');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <LoadingOverlay loading={loading} label="Saving the actor…">
        <ActorCard onSave={() => void save()} disabled={loading} />
      </LoadingOverlay>
      <span>{message}</span>
    </div>
  );
}

/**
 * An application-owned boolean, driven by the Save button. The trigger is
 * disabled while the operation is pending, so a second click cannot start a
 * second save during the delay window.
 */
export const AppOwnedBoolean: Story = {
  render: () => <AppOwnedDemo />,
};

/**
 * A fast operation that settles before the delay and therefore never shows
 * the overlay.
 */
export const FastOperation: Story = {
  render: () => <FastOperationDemo />,
};

/**
 * A fixed-size region: the scrim stops at the 200 × 200 box.
 */
export const FixedSizeRegion: Story = {
  render: () => <FixedSizeRegionDemo />,
};

/**
 * The canonical integration: `useLoading` supplies the boolean and the label,
 * the overlay renders them, and the returned promise is caught through the
 * application's error handler. The failing case reports through the same
 * `SystemErrorProvider` the application uses.
 */
function AsyncControllerDemo(): ReactElement {
  const { isLoading, label, run } = useLoading({ label: 'Please wait…' });
  const { catchError } = useSystemError();
  const [message, setMessage] = useState('No save yet.');

  const save = (): void => {
    run(() => wait(1200), { label: 'Saving the actor…' })
      .then(() => setMessage('Saved after 1.2 seconds.'))
      .catch(catchError);
  };

  const fail = (): void => {
    run(
      () =>
        wait(800).then(() => {
          throw new Error('The actor could not be saved.');
        }),
      { label: 'Failing the save…' }
    ).catch(catchError);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <LoadingOverlay loading={isLoading} label={label}>
        <ActorCard onSave={save} disabled={isLoading} />
      </LoadingOverlay>
      <span>{message}</span>
      <Button onClick={fail} disabled={isLoading}>
        Save and fail
      </Button>
    </div>
  );
}

/**
 * The overlay is region-scoped: only this 200 × 200 box is covered. The root
 * receives the box height so the scrim covers the whole box even though the
 * content is shorter; the rest of the page stays interactive.
 */
function FixedSizeRegionDemo(): ReactElement {
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ width: 200, height: 200, border: '1px solid #d1d1d1', borderRadius: 8 }}>
        <LoadingOverlay loading={loading} style={{ height: '100%' }} label="Loading the region…">
          <div style={{ padding: 16 }}>A 200 × 200 region. Only this box is covered.</div>
        </LoadingOverlay>
      </div>
      <Button onClick={() => setLoading(value => !value)}>
        {loading ? 'Stop loading' : 'Start loading'}
      </Button>
    </div>
  );
}

/**
 * A translated label, shown immediately with `delay={0}`. The overlay starts
 * visible, so the covered content is inert and its demo action is disabled.
 */
export const CustomLabel: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <LoadingOverlay loading delay={0} label="Publishing the dataset…">
        <ActorCard onSave={() => {}} disabled />
      </LoadingOverlay>
      <span>The content is inert while the overlay is visible; the action is disabled.</span>
    </div>
  ),
};

/**
 * The async controller and the overlay together, including the
 * promise-and-error-handler pattern the README recommends.
 */
export const AsyncController: Story = {
  render: () => (
    <SystemErrorProvider>
      <AsyncControllerDemo />
    </SystemErrorProvider>
  ),
};
