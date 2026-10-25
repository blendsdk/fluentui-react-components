import { Badge, Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  DeleteRegular,
  EyeRegular,
  ReorderRegular,
  ShareRegular,
  StarRegular,
} from '@fluentui/react-icons';
import type { Meta } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import type { ReactElement } from 'react';
import { createTileGridFixture } from '../../../../test/fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../../../../test/fixtures/tileGridFixture';
import { TileGridItem } from '..';
import type { TileGridDragHandleProps } from '../../TileGrid';

const PHOTOS = createTileGridFixture(4);

/** Returns a required sample photo. */
function photoAt(index: number): TileGridFixtureItem {
  const item = PHOTOS[index];
  if (!item) throw new Error('The sample photo fixture is empty');
  return item;
}

const PHOTO = photoAt(0);
const SECOND_PHOTO = photoAt(1);

/** Visual-only handle wiring for the shell documentation. */
const HANDLE_PROPS: TileGridDragHandleProps = {
  setNodeRef: () => {},
  attributes: {},
  listeners: {},
  isDragging: false,
  disabled: false,
  label: `Reorder ${PHOTO.label}`,
};

const useStyles = makeStyles({
  gallery: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalL,
    alignItems: 'flex-start',
  },
  case: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  frame: {
    boxSizing: 'border-box',
    width: '240px',
    height: '240px',
    overflow: 'hidden',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  caption: {
    color: tokens.colorNeutralForeground2,
  },
  note: {
    color: tokens.colorNeutralForeground2,
  },
});

/** One fixed-size shell frame with a caption. */
function ShellCase({
  label,
  width = 240,
  height = 240,
  children,
}: {
  label: string;
  width?: number;
  height?: number;
  children: ReactNode;
}): ReactElement {
  const classes = useStyles();

  return (
    <div className={classes.case}>
      <div className={classes.frame} style={{ width, height }}>
        {children}
      </div>
      <Text size={200} className={classes.caption}>
        {label}
      </Text>
    </div>
  );
}

/** Returns the shell media node for one sample photo. */
function mediaFor(item: TileGridFixtureItem): ReactElement {
  return (
    <img
      src={item.thumbnailUrl}
      alt=""
      loading="lazy"
      decoding="async"
      width={item.width}
      height={item.height}
    />
  );
}

const meta: Meta<typeof TileGridItem> = {
  title: 'Components/TileGridItem',
  component: TileGridItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The optional Fluent tile shell for `TileGrid.renderItem`. It owns media, title,',
          'description, badges, action presentation and the default drag handle; the grid',
          'owns selection, activation and arranging. Applications supply the item, media,',
          'actions and the preview boundary.',
          '',
          'Inline actions appear on hover or focus-within and are always duplicated in the',
          'overflow menu. The default drag handle is pointer-only; keyboard arranging lives',
          'in the menu as Move up and Move down.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

/** Shows every content slot and both action layers. */
export const AllSlots = (): ReactElement => (
  <ShellCase label="Media, title, description, badges, status and selection">
    <TileGridItem
      item={PHOTO}
      selected
      selectable
      media={mediaFor(PHOTO)}
      title={PHOTO.label}
      description={`${PHOTO.width} × ${PHOTO.height}`}
      badges={<Badge appearance="tint">RAW</Badge>}
      statusOverlay={
        <Badge appearance="filled" color="brand">
          Featured
        </Badge>
      }
      actions={[
        { id: 'preview', label: 'Preview', icon: <EyeRegular />, onSelect: () => {} },
        { id: 'favorite', label: 'Favorite', icon: <StarRegular />, onSelect: () => {} },
      ]}
      overflowActions={[
        { id: 'share', label: 'Share', icon: <ShareRegular />, onSelect: () => {} },
      ]}
    />
  </ShellCase>
);

/** Compares the shell's visual states side by side. */
export const States = (): ReactElement => {
  const classes = useStyles();
  return (
    <div className={classes.gallery}>
      <ShellCase label="Default">
        <TileGridItem
          item={SECOND_PHOTO}
          media={mediaFor(SECOND_PHOTO)}
          title={SECOND_PHOTO.label}
        />
      </ShellCase>
      <ShellCase label="Selected">
        <TileGridItem
          item={SECOND_PHOTO}
          selected
          selectable
          media={mediaFor(SECOND_PHOTO)}
          title={SECOND_PHOTO.label}
        />
      </ShellCase>
      <ShellCase label="Non-selectable">
        <TileGridItem
          item={SECOND_PHOTO}
          selected
          selectable={false}
          media={mediaFor(SECOND_PHOTO)}
          title={SECOND_PHOTO.label}
        />
      </ShellCase>
      <ShellCase label="Disabled">
        <TileGridItem
          item={SECOND_PHOTO}
          disabled
          media={mediaFor(SECOND_PHOTO)}
          title={SECOND_PHOTO.label}
          actions={[{ id: 'preview', label: 'Preview', icon: <EyeRegular />, onSelect: () => {} }]}
        />
      </ShellCase>
      <ShellCase label="Dragging source">
        <TileGridItem
          item={SECOND_PHOTO}
          isDragging
          media={mediaFor(SECOND_PHOTO)}
          title={SECOND_PHOTO.label}
        />
      </ShellCase>
      <ShellCase label="Portal overlay">
        <TileGridItem
          item={SECOND_PHOTO}
          isOverlay
          media={mediaFor(SECOND_PHOTO)}
          title={SECOND_PHOTO.label}
        />
      </ShellCase>
    </div>
  );
};

/** Shows icon-only inline actions, overflow actions and danger intent. */
export const Actions = (): ReactElement => {
  const classes = useStyles();
  return (
    <div className={classes.gallery}>
      <ShellCase label="Hover or focus the tile to reveal inline actions" width={280}>
        <TileGridItem
          item={PHOTO}
          media={mediaFor(PHOTO)}
          title={PHOTO.label}
          description="Inline actions are icon-only when an icon exists"
          actions={[
            { id: 'preview', label: 'Preview', icon: <EyeRegular />, onSelect: () => {} },
            { id: 'favorite', label: 'Favorite', icon: <StarRegular />, onSelect: () => {} },
            {
              id: 'delete',
              label: 'Delete',
              icon: <DeleteRegular />,
              intent: 'danger',
              onSelect: () => {},
            },
          ]}
          overflowActions={[
            { id: 'share', label: 'Share', icon: <ShareRegular />, onSelect: () => {} },
          ]}
        />
      </ShellCase>
      <ShellCase label="Text-only action when no icon is supplied" width={280}>
        <TileGridItem
          item={PHOTO}
          media={mediaFor(PHOTO)}
          title={PHOTO.label}
          actions={[{ id: 'open', label: 'Open details', onSelect: () => {} }]}
        />
      </ShellCase>
    </div>
  );
};

/** Compares the default handle, a custom handle and an absent handle. */
export const DragHandle = (): ReactElement => {
  const classes = useStyles();
  return (
    <div className={classes.gallery}>
      <ShellCase label="Default pointer-only handle">
        <TileGridItem
          item={PHOTO}
          media={mediaFor(PHOTO)}
          title={PHOTO.label}
          dragHandleProps={HANDLE_PROPS}
        />
      </ShellCase>
      <ShellCase label="Custom handle render prop">
        <TileGridItem
          item={PHOTO}
          media={mediaFor(PHOTO)}
          title={PHOTO.label}
          dragHandleProps={HANDLE_PROPS}
          dragHandle={props => (
            <Button
              ref={props.setNodeRef}
              {...props.attributes}
              {...props.listeners}
              type="button"
              appearance="secondary"
              size="small"
              icon={<ReorderRegular />}
              aria-label={props.label}
            >
              Custom
            </Button>
          )}
        />
      </ShellCase>
      <ShellCase label="No handle wiring">
        <TileGridItem item={PHOTO} media={mediaFor(PHOTO)} title={PHOTO.label} />
      </ShellCase>
    </div>
  );
};
