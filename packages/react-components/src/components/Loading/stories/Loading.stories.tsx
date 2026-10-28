import type { SpinnerProps } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { Loading } from '../Loading';

const meta: Meta<typeof Loading> = {
  id: 'components-loading',
  title: 'Feedback/Loading',
  component: Loading,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A transparent, centered filler for a region that has no content to cover.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Announcement — reload a story: the label is announced once; the spinner is silent.',
          '2. Delay — in the Delayed reveal story, the status text and spinner appear together after the delay.',
          '3. Empty parent — the fixture shows the loader centered in the full parent height.',
          '4. Light and dark theme, forced colors — the spinner and label stay legible.',
          '5. Reduced motion — the Fluent spinner is the only motion; no extra animation is added.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Loading>;

/** A fixed box, so the full-size filler has a parent to fill. */
function Frame(props: { width?: number; height?: number; children: ReactElement }): ReactElement {
  return (
    <div style={{ width: props.width ?? 220, height: props.height ?? 160 }}>{props.children}</div>
  );
}

/**
 * The default: large spinner, primary appearance, the label below the ring,
 * and the English fallback when no label is supplied.
 */
export const Default: Story = {
  render: () => (
    <Frame>
      <Loading />
    </Frame>
  ),
};

/**
 * Every Fluent spinner size. The filler itself adds no size rules, so the
 * ring and its label keep Fluent's proportions.
 */
export const Sizes: Story = {
  render: () => {
    const sizes: Array<NonNullable<SpinnerProps['size']>> = [
      'extra-tiny',
      'tiny',
      'extra-small',
      'small',
      'medium',
      'large',
      'extra-large',
      'huge',
    ];

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {sizes.map(size => (
          <Frame key={size} width={150} height={140}>
            <Loading size={size} label={size} />
          </Frame>
        ))}
      </div>
    );
  },
};

/**
 * The four label placements. `before` and `after` put the label beside the
 * ring; `above` and `below` stack it.
 */
export const LabelPositions: Story = {
  render: () => {
    const positions: Array<NonNullable<SpinnerProps['labelPosition']>> = [
      'above',
      'below',
      'before',
      'after',
    ];

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {positions.map(labelPosition => (
          <Frame key={labelPosition} width={180} height={140}>
            <Loading label={labelPosition} labelPosition={labelPosition} />
          </Frame>
        ))}
      </div>
    );
  },
};

/**
 * An empty parent sized by the caller: `minHeight` gives the filler a block
 * size of its own, and the spinner centers inside it.
 */
export const FixedHeightParent: Story = {
  render: () => (
    <div style={{ border: '1px dashed currentColor', width: 320 }}>
      <Loading label="Loading the record…" minHeight={240} />
    </div>
  ),
};

/**
 * A delayed loader: both the status text and the spinner stay hidden until
 * the delay elapses, so a fast response never flashes a loader.
 */
export const DelayedReveal: Story = {
  render: () => (
    <Frame width={280} height={200}>
      <Loading label="Loading the report…" delay={1200} />
    </Frame>
  ),
};
