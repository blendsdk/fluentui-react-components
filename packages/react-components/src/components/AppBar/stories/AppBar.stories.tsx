import { makeStyles, tokens } from '@fluentui/react-components';
import { GridDots20Regular, Settings20Regular } from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar } from '../AppBar';
import { AppBarButton } from '../../AppBarButton';
import { AppBarSpacer } from '../../AppBarSpacer';
import { AppBarTitle } from '../../AppBarTitle';

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
  ruler: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2,
  },
  rulerLine: {
    width: '1px',
    height: '48px',
    backgroundColor: tokens.colorNeutralForeground2,
  },
  placeholder: {
    width: '48px',
    height: '48px',
    boxSizing: 'border-box',
    border: `1px dashed ${tokens.colorNeutralForegroundOnBrand}`,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
  },
});

/** Workbench metadata and the manual acceptance checklist for the bar. */
const meta: Meta<typeof AppBar> = {
  id: 'components-appbar',
  title: 'Layout/AppBar',
  component: AppBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The brand application bar: a semantic header that hosts the launcher, the product name',
          'and global commands. The `Geometry` story uses dashed placeholder slots for the',
          'measurements; `States` and `WithLauncher` compose the real `AppBarButton`.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Geometry — the bar is exactly 48px at normal text; zero bar padding; the 48×48 leading slot is flush; the title starts 8px after it; the trailing slot is flush; the dashed outlines and ruler confirm the measurements.',
          '2. States — hover a command: 12% white; pointer press: 22%; keyboard press: 22%; focus: white 2px inset ring with no dark Fluent border; disabled: muted and no hover; `disabledFocusable`: muted, focusable, focus ring visible.',
          '3. WithLauncher — open the launcher and leave the pointer over the waffle: the 22% open highlight stays; the panel docks below the bar; Escape and outside click close it.',
          '4. Title variants — the title is 14px semibold; the link underlines on hover and shows a white focus ring; a long title ellipsizes in the narrow bar.',
          '5. Text zoom — at 200% text-only zoom the title and command text do not clip vertically; the bar grows if the content exceeds 48px.',
          '6. RTL — set dir="rtl" on a wrapper: the launcher is flush on the right, the title inset mirrors, and the spacer pushes the trailing command left.',
          '7. Forced colors — emulate forced-colors: the bar and title are readable, hover/pressed/open use the system Highlight pair, and the focus ring remains visible.',
          '8. Accessibility addon — the a11y panel reports no violations for every AppBar story.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** Story variants share the public component contract. */
type Story = StoryObj<typeof AppBar>;

/** The canonical bar: title, spacer and a trailing command. */
export const Default: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <AppBar aria-label="Application">
          <AppBarTitle>Contoso</AppBarTitle>
          <AppBarSpacer />
          <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
        </AppBar>
        <p className={styles.caption}>
          The title starts at the leading edge; the spacer pushes the settings command to the
          trailing edge. The launcher composition is in `WithLauncher`.
        </p>
      </div>
    );
  },
};

/** The measurement story used by the visual gate. */
export const Geometry: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <div className={styles.ruler}>
          <div className={styles.rulerLine} />
          <span>48px bar; 48×48 command slots; 8px title inset</span>
        </div>
        <AppBar aria-label="Geometry">
          <div className={styles.placeholder}>48</div>
          <AppBarTitle>Contoso</AppBarTitle>
          <AppBarSpacer />
          <div className={styles.placeholder}>48</div>
        </AppBar>
        <p className={styles.caption}>
          Bar: 48px minimum height, zero padding. Leading slot: 48×48 and flush. Title: 14px
          semibold with 8px inline margins. Trailing slot: flush. The dashed outlines show the
          boxes; the vertical line is the 48px ruler.
        </p>
        <div className={styles.narrow}>
          <AppBar aria-label="Narrow geometry">
            <div className={styles.placeholder}>48</div>
            <AppBarTitle>Contoso Resource Planning and Operations</AppBarTitle>
            <AppBarSpacer />
            <div className={styles.placeholder}>48</div>
          </AppBar>
        </div>
        <p className={styles.caption}>
          A narrow bar keeps the leading and trailing slots and ellipsizes the title; the full title
          remains in the DOM.
        </p>
      </div>
    );
  },
};

/** The M365 command states in the bar. */
export const States: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <AppBar aria-label="Command states">
          <AppBarButton aria-label="Home" icon={<GridDots20Regular />} />
          <AppBarButton>Settings</AppBarButton>
          <AppBarSpacer />
          <AppBarButton aria-label="Disabled settings" icon={<Settings20Regular />} disabled />
          <AppBarButton
            aria-label="Focusable disabled settings"
            icon={<Settings20Regular />}
            disabledFocusable
          />
        </AppBar>
        <p className={styles.caption}>
          Hover, press, focus and disable each command. The disabled and disabledFocusable commands
          stay muted; the focusable one keeps the focus ring. Text commands carry the documented
          M365 contrast exception: white 14px text measures 4.29:1 on hover and 3.58:1 on
          pressed/open; icon-only commands meet 3:1.
        </p>
      </div>
    );
  },
};

/** The real launcher docked to the bar, open on load. */
export { WithLauncher } from './AppBarWithLauncher.story';

/** The title modes in the bar, including the narrow truncation case. */
export const TitleVariants: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <AppBar aria-label="Plain title">
          <AppBarTitle>Contoso</AppBarTitle>
        </AppBar>
        <AppBar aria-label="Heading title">
          <AppBarTitle headingLevel={1}>Contoso</AppBarTitle>
        </AppBar>
        <AppBar aria-label="Linked title">
          <AppBarTitle href="/">Contoso</AppBarTitle>
        </AppBar>
        <div className={styles.narrow}>
          <AppBar aria-label="Long title">
            <AppBarTitle>Contoso Resource Planning and Operations</AppBarTitle>
          </AppBar>
        </div>
        <p className={styles.caption}>
          Plain, heading and link titles in the bar. The narrow bar ellipsizes the long title; the
          full text remains in the DOM. Tab to the link to see the white focus ring.
        </p>
      </div>
    );
  },
};
