import { makeStyles, tokens } from '@fluentui/react-components';
import {
  CalendarLtr20Regular,
  GridDots20Regular,
  Mail20Regular,
  Settings20Regular,
} from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBarButton } from '../AppBarButton';

/** Story-only brand surface; the shared decorator supplies `FluentProvider`. */
const useStyles = makeStyles({
  frame: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorBrandBackground,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  caption: {
    maxWidth: '720px',
    margin: 0,
    color: tokens.colorNeutralForegroundOnBrand,
  },
});

/** Workbench metadata and the M365 state checklist. */
const meta: Meta<typeof AppBarButton> = {
  id: 'components-appbarbutton',
  title: 'Layout/AppBarButton',
  component: AppBarButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The on-brand command button for the 48px application bar. It forces Fluent’s',
          'transparent, square, medium treatment and supplies the Microsoft 365 interaction',
          'states.',
          '',
          '**Manual review checklist:**',
          '',
          '1. Resting — transparent background, white icon and label, 48px target.',
          '2. Hover — 12% white overlay; the icon and label stay white.',
          '3. Pointer press — 22% white overlay.',
          '4. Keyboard press — focus the command and press Space/Enter: 22% white overlay.',
          '5. Open launcher — leave the pointer over the trigger: the 22% overlay stays while `aria-expanded="true"`.',
          '6. Focus — white 2px inset ring, no dark Fluent border.',
          '7. Disabled — muted foreground, no hover; `disabledFocusable` stays focusable with the focus ring.',
          '8. Contrast — icon-only commands meet 3:1 in every state; white 14px text on the overlays is 4.29:1 on hover and 3.58:1 on pressed/open, the documented M365 text-command exception.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppBarButton>;

/** The full state gallery on the brand surface. */
export const Gallery: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <div className={styles.row}>
          <AppBarButton aria-label="App launcher" icon={<GridDots20Regular />} />
          <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
          <AppBarButton aria-label="Mail" icon={<Mail20Regular />} />
          <AppBarButton>Settings</AppBarButton>
          <AppBarButton icon={<CalendarLtr20Regular />}>Calendar</AppBarButton>
          <AppBarButton aria-label="Disabled settings" icon={<Settings20Regular />} disabled />
          <AppBarButton
            aria-label="Focusable disabled settings"
            icon={<Settings20Regular />}
            disabledFocusable
          />
          <AppBarButton
            aria-label="Open launcher"
            icon={<GridDots20Regular />}
            aria-expanded="true"
          />
        </div>
        <p className={styles.caption}>
          Icon-only, text and icon-plus-text commands, disabled and disabledFocusable variants, and
          the forced open state. Hover, press and focus each command to inspect the M365 states.
        </p>
      </div>
    );
  },
};

/** One icon-only command. */
export const IconOnly: Story = {
  render: () => {
    const styles = useStyles();
    return (
      <div className={styles.frame}>
        <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
      </div>
    );
  },
};

/** One labelled command. */
export const Text: Story = {
  render: () => {
    const styles = useStyles();
    return (
      <div className={styles.frame}>
        <AppBarButton>Settings</AppBarButton>
      </div>
    );
  },
};

/** One icon-plus-text command. */
export const IconAndText: Story = {
  render: () => {
    const styles = useStyles();
    return (
      <div className={styles.frame}>
        <AppBarButton icon={<CalendarLtr20Regular />}>Calendar</AppBarButton>
      </div>
    );
  },
};

/** The disabled and disabledFocusable pair. */
export const Disabled: Story = {
  render: () => {
    const styles = useStyles();
    return (
      <div className={styles.frame}>
        <div className={styles.row}>
          <AppBarButton aria-label="Disabled settings" icon={<Settings20Regular />} disabled />
          <AppBarButton
            aria-label="Focusable disabled settings"
            icon={<Settings20Regular />}
            disabledFocusable
          />
        </div>
      </div>
    );
  },
};

/** The forced open state used by the launcher trigger. */
export const OpenState: Story = {
  render: () => {
    const styles = useStyles();
    return (
      <div className={styles.frame}>
        <AppBarButton
          aria-label="Open launcher"
          icon={<GridDots20Regular />}
          aria-expanded="true"
        />
      </div>
    );
  },
};
