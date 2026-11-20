import { makeStyles, tokens } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar } from '../../AppBar';
import { AppBarSpacer } from '../AppBarSpacer';
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
  trailing: {
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap',
  },
});

/** Workbench metadata and the spacer's visual checklist. */
const meta: Meta<typeof AppBarSpacer> = {
  id: 'components-appbarspacer',
  title: 'Layout/AppBarSpacer',
  component: AppBarSpacer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The empty flex element that pushes trailing commands to the end of the bar. It has',
          'no children, no accessible content and no tab stop.',
          '',
          '**Manual review checklist:** the trailing marker sits at the far edge; the spacer is',
          'invisible; the bar keeps its 48px minimum height.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppBarSpacer>;

/** The title on the leading edge, the spacer, and a trailing marker. */
export const Alignment: Story = {
  render: () => {
    const styles = useStyles();

    return (
      <div className={styles.frame}>
        <AppBar aria-label="Spacer alignment">
          <AppBarTitle>Contoso</AppBarTitle>
          <AppBarSpacer />
          <span className={styles.trailing}>Trailing</span>
        </AppBar>
        <p className={styles.caption}>
          The spacer grows between the title and the trailing marker; it renders no visible box.
        </p>
      </div>
    );
  },
};
