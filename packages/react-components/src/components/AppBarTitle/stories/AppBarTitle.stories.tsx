import { makeStyles, tokens } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar } from '../../AppBar';
import { AppBarTitle } from '../AppBarTitle';

/** Story-only layout; the shared decorator supplies `FluentProvider`. */
const useStyles = makeStyles({
  frame: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  caption: {
    color: tokens.colorNeutralForeground2,
    maxWidth: '640px',
    margin: 0,
  },
  narrow: {
    width: '12rem',
    maxWidth: '100%',
  },
});

/** Workbench metadata and the title's visual checklist. */
const meta: Meta<typeof AppBarTitle> = {
  id: 'components-appbartitle',
  title: 'Layout/AppBarTitle',
  component: AppBarTitle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The product or application name in the bar. The default is a non-heading span;',
          '`headingLevel` renders h1–h6, and `href` renders an anchor. The forms are mutually',
          'exclusive.',
          '',
          '**Manual review checklist:**',
          '',
          '1. Plain — 14px semibold white text with the 8px inline inset.',
          '2. Heading — the visible size stays 14px; the semantic level is the requested h1–h6.',
          '3. Link — no underline at rest, underline on hover, white focus ring on keyboard focus.',
          '4. Long — the narrow bar ellipsizes; the full text remains in the DOM.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppBarTitle>;

/** The default non-heading span. */
export const Plain: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <AppBar aria-label="Plain title">
          <AppBarTitle>Contoso</AppBarTitle>
        </AppBar>
        <p className={styles.caption}>The default title is a span, so the page owns its h1.</p>
      </div>
    );
  },
};

/** A real document heading, independent of the visual size. */
export const Heading: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <AppBar aria-label="Heading title">
          <AppBarTitle headingLevel={1}>Contoso</AppBarTitle>
        </AppBar>
        <p className={styles.caption}>
          The title is an h1 with the same 14px semibold visual ramp.
        </p>
      </div>
    );
  },
};

/** A home link with the link-specific hover and focus treatment. */
export const Link: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <AppBar aria-label="Linked title">
          <AppBarTitle href="/">Contoso</AppBarTitle>
        </AppBar>
        <p className={styles.caption}>
          Hover to see the underline; Tab to the link to see the white focus ring.
        </p>
      </div>
    );
  },
};

/** A deliberately long title in a narrow bar. */
export const Long: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <div className={styles.narrow}>
          <AppBar aria-label="Long title">
            <AppBarTitle>Contoso Resource Planning and Operations</AppBarTitle>
          </AppBar>
        </div>
        <p className={styles.caption}>
          The title ellipsizes in the narrow bar; the full text stays in the DOM.
        </p>
      </div>
    );
  },
};
