import { Dropdown, Option, Text, makeStyles, tokens } from '@fluentui/react-components';
import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { createTileGridFixture } from '../../../../test/fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../../../../test/fixtures/tileGridFixture';
import { TileGrid } from '../TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridLayout,
  TileGridReorderArgs,
} from '../TileGrid.types';
import { TileGridItem } from '../../TileGridItem';

/** The drag story's bounded collection; enough tiles to scroll. */
const DRAG_ITEMS = createTileGridFixture(120);

/** Layout choices shown by the drag story toolbar. */
const LAYOUT_OPTIONS: readonly { value: TileGridLayout; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'justified', label: 'Justified' },
  { value: 'mosaic', label: 'Mosaic' },
];

/** Reads the stable fixture identity. */
function getDragItemId(item: TileGridFixtureItem): string {
  return item.id;
}

/** Reads the accessible tile label. */
function getDragItemLabel(item: TileGridFixtureItem): string {
  return item.label;
}

/** Reads the intrinsic ratio used by masonry and justified layouts. */
function getDragItemAspectRatio(item: TileGridFixtureItem): number {
  return item.aspectRatio;
}

/** Renders the shell inside the drag story. */
function renderDragItem({
  item,
  selected,
  selectable,
  disabled,
  isDragging,
  isOverlay,
  dragHandleProps,
  reorderActions,
  strings,
}: TileGridItemRenderArgs<TileGridFixtureItem>): ReactElement {
  return (
    <TileGridItem
      item={item}
      selected={selected}
      selectable={selectable}
      disabled={disabled}
      isDragging={isDragging}
      isOverlay={isOverlay}
      dragHandleProps={dragHandleProps}
      reorderActions={reorderActions}
      strings={strings}
      media={
        <img
          src={item.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          width={item.width}
          height={item.height}
        />
      }
      title={item.label}
    />
  );
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
    boxSizing: 'border-box',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  frame: {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '960px',
    height: '440px',
    overflow: 'hidden',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  note: {
    color: tokens.colorNeutralForeground2,
  },
});

/**
 * Shows pointer arranging across all four layouts.
 *
 * Drag a tile handle: the source keeps its place with reduced opacity, the
 * overlay follows the pointer, the accent line marks the insertion boundary,
 * and holding near the top or bottom edge auto-scrolls. Escape cancels.
 */
export function Drag(): ReactElement {
  const classes = useStyles();
  const [layout, setLayout] = useState<TileGridLayout>('fixed');
  const [order, setOrder] = useState<readonly TileGridFixtureItem[]>(DRAG_ITEMS);

  const handleReorder = useCallback(({ orderedIds }: TileGridReorderArgs) => {
    setOrder(current => {
      const byId = new Map(current.map(item => [item.id, item]));
      return orderedIds.flatMap(id => {
        const item = byId.get(id);
        return item ? [item] : [];
      });
    });
  }, []);

  const currentLayout = LAYOUT_OPTIONS.find(option => option.value === layout) ?? LAYOUT_OPTIONS[0];

  return (
    <div className={classes.root}>
      <div className={classes.toolbar}>
        <Text weight="semibold">Grid layout</Text>
        <Dropdown
          aria-label="Grid layout"
          value={currentLayout?.label ?? 'Fixed'}
          selectedOptions={[layout]}
          onOptionSelect={(_, data) => {
            const next = LAYOUT_OPTIONS.find(option => option.value === data.optionValue);
            if (next) setLayout(next.value);
          }}
        >
          {LAYOUT_OPTIONS.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Dropdown>
        <Text className={classes.note}>Drag a handle; Escape cancels; edges auto-scroll.</Text>
      </div>

      <div className={classes.frame}>
        <TileGrid
          items={order}
          getItemId={getDragItemId}
          getItemLabel={getDragItemLabel}
          getItemAspectRatio={getDragItemAspectRatio}
          renderItem={renderDragItem}
          layout={layout}
          tileSize={140}
          gap={8}
          ariaLabel="Drag gallery"
          selectionMode="multiselect"
          defaultSelectedIds={['tile-1', 'tile-2']}
          enableMarquee
          reorderable
          onReorder={handleReorder}
          scrollResetKey={layout}
        />
      </div>
    </div>
  );
}
