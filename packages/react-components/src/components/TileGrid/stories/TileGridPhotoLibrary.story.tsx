import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Option,
  SearchBox,
  Tag,
  TagGroup,
  Text,
  Toolbar,
  ToolbarGroup,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  DismissRegular,
  EyeRegular,
  StarFilled,
  StarRegular,
  ZoomInRegular,
  ZoomOutRegular,
} from '@fluentui/react-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createTileGridFixture } from '../../../../test/fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../../../../test/fixtures/tileGridFixture';
import { TileGrid } from '../TileGrid';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridLayout,
  TileGridReorderArgs,
  TileGridStrings,
} from '../TileGrid.types';
import { TileGridItem } from '../../TileGridItem';

/**
 * The shared 20K photo fixture.
 *
 * The recipe owns filtering, ordering, selection, favorites, and the preview;
 * the grid owns geometry, virtualization, focus, selection gestures, and the
 * arranging layer.
 */
const PHOTO_ITEMS = createTileGridFixture(20_000);

/** Selected IDs seeded into the controlled recipe. */
const SEEDED_SELECTION = ['tile-0', 'tile-1'] as const;

const MIN_TILE_SIZE = 120;
const MAX_TILE_SIZE = 320;
const TILE_SIZE_STEP = 20;
const DEFAULT_TILE_SIZE = 160;

/** Stable partial strings keep memoized cells from invalidating on every recipe render. */
const RECIPE_STRINGS: Partial<TileGridStrings> = { emptyMessage: 'No photos' };

/** Application-owned orientation filter values. */
type OrientationFilter = 'all' | 'portrait' | 'square' | 'landscape';

/** Orientation choices shown by the toolbar dropdown. */
const ORIENTATION_OPTIONS: readonly { value: OrientationFilter; label: string }[] = [
  { value: 'all', label: 'All orientations' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'square', label: 'Square' },
  { value: 'landscape', label: 'Landscape' },
];

/** Props for the photo-library recipe. */
export interface PhotoLibraryRecipeProps {
  /**
   * Grid layout used by the composition.
   *
   * The default fixed layout is the story readers see. The measurement test
   * mounts the same composition in every layout to exercise the recipe at
   * scale without duplicating the toolbar and tile content.
   */
  layout?: TileGridLayout;
}

/** Reads the stable fixture identity. */
function getPhotoId(item: TileGridFixtureItem): string {
  return item.id;
}

/** Reads the accessible tile label. */
function getPhotoLabel(item: TileGridFixtureItem): string {
  return item.label;
}

/** Reads the intrinsic ratio used by masonry and justified layouts. */
function getPhotoAspectRatio(item: TileGridFixtureItem): number {
  return item.aspectRatio;
}

/** Classifies one fixture item into the toolbar's orientation vocabulary. */
function orientationOf(item: TileGridFixtureItem): Exclude<OrientationFilter, 'all'> {
  if (item.aspectRatio < 1) return 'portrait';
  if (item.aspectRatio > 1) return 'landscape';
  return 'square';
}

/** Returns the visible label for an orientation value. */
function orientationLabel(orientation: Exclude<OrientationFilter, 'all'>): string {
  return orientation === 'portrait'
    ? 'Portrait'
    : orientation === 'landscape'
      ? 'Landscape'
      : 'Square';
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
    width: '100%',
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  tags: {
    minHeight: tokens.spacingVerticalL,
  },
  frame: {
    boxSizing: 'border-box',
    width: '100%',
    height: '760px',
    overflow: 'hidden',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  previewSurface: {
    maxWidth: '760px',
    width: 'calc(100vw - 48px)',
  },
  previewContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
  },
  previewImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
  },
});

/**
 * The 20K photo-library recipe.
 *
 * It keeps the item order as application state, applies `orderedIds` from the
 * grid without mutating the grid's items, disables arranging while a filter is
 * active, and closes the app-owned preview when its item leaves the filtered
 * set. The package itself owns none of that domain behavior.
 */
export function PhotoLibraryRecipe({ layout = 'fixed' }: PhotoLibraryRecipeProps): ReactElement {
  const classes = useStyles();
  const gridRef = useRef<TileGridHandle>(null);
  const [order, setOrder] = useState<readonly TileGridFixtureItem[]>(PHOTO_ITEMS);
  const [query, setQuery] = useState('');
  const [orientation, setOrientation] = useState<OrientationFilter>('all');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(SEEDED_SELECTION)
  );
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(() => new Set());
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      order.filter(item => {
        const matchesQuery =
          normalizedQuery.length === 0 || item.label.toLowerCase().includes(normalizedQuery);
        const matchesOrientation = orientation === 'all' || orientationOf(item) === orientation;
        return matchesQuery && matchesOrientation;
      }),
    [normalizedQuery, order, orientation]
  );
  const arrangingEnabled = normalizedQuery.length === 0 && orientation === 'all';
  const filterKey = `${normalizedQuery}|${orientation}`;
  const previewItem = previewId ? (order.find(item => item.id === previewId) ?? null) : null;

  useEffect(() => {
    if (previewId && !filteredItems.some(item => item.id === previewId)) {
      setPreviewId(null);
    }
  }, [filteredItems, previewId]);

  const handleReorder = useCallback(({ orderedIds }: TileGridReorderArgs) => {
    setOrder(current => {
      const byId = new Map(current.map(item => [item.id, item]));
      return orderedIds.flatMap(id => {
        const item = byId.get(id);
        return item ? [item] : [];
      });
    });
  }, []);

  const openPreview = useCallback((item: TileGridFixtureItem) => {
    setPreviewId(item.id);
  }, []);

  const toggleFavorite = useCallback((item: TileGridFixtureItem) => {
    setFavoriteIds(current => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }, []);

  const renderPhotoTile = useCallback(
    ({
      item,
      selected,
      selectable,
      disabled,
      isDragging,
      isOverlay,
      dragHandleProps,
      reorderActions,
      strings,
    }: TileGridItemRenderArgs<TileGridFixtureItem>) => (
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
        description={`${item.width} × ${item.height}`}
        badges={
          <Badge appearance="tint">
            {favoriteIds.has(item.id) ? 'Favorite' : orientationLabel(orientationOf(item))}
          </Badge>
        }
        actions={[
          {
            id: 'preview',
            label: 'Preview',
            icon: <EyeRegular />,
            onSelect: openPreview,
          },
        ]}
        overflowActions={[
          {
            id: 'favorite',
            label: favoriteIds.has(item.id) ? 'Remove favorite' : 'Favorite',
            icon: favoriteIds.has(item.id) ? <StarFilled /> : <StarRegular />,
            onSelect: toggleFavorite,
          },
        ]}
      />
    ),
    [favoriteIds, openPreview, toggleFavorite]
  );

  const changeOrientation = useCallback((value: string | undefined) => {
    const next = ORIENTATION_OPTIONS.find(option => option.value === value);
    if (next) setOrientation(next.value);
  }, []);

  const dismissFilter = useCallback((_event: unknown, data: { value: string }) => {
    if (data.value === 'query') setQuery('');
    if (data.value === 'orientation') setOrientation('all');
  }, []);

  return (
    <div className={classes.root}>
      <Toolbar aria-label="Photo library controls" className={classes.toolbar}>
        <ToolbarGroup className={classes.toolbarGroup}>
          <SearchBox
            aria-label="Filter photos"
            placeholder="Search photos"
            value={query}
            onChange={(_, data) => setQuery(data.value)}
          />
          <Dropdown
            aria-label="Orientation"
            value={
              ORIENTATION_OPTIONS.find(option => option.value === orientation)?.label ??
              'All orientations'
            }
            selectedOptions={[orientation]}
            onOptionSelect={(_, data) => changeOrientation(data.optionValue)}
          >
            {ORIENTATION_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Dropdown>
        </ToolbarGroup>

        <ToolbarGroup className={classes.toolbarGroup}>
          <Button
            appearance="subtle"
            icon={<ZoomOutRegular />}
            aria-label="Zoom out"
            disabled={tileSize <= MIN_TILE_SIZE}
            onClick={() => setTileSize(size => Math.max(MIN_TILE_SIZE, size - TILE_SIZE_STEP))}
          />
          <Button
            appearance="subtle"
            icon={<ZoomInRegular />}
            aria-label="Zoom in"
            disabled={tileSize >= MAX_TILE_SIZE}
            onClick={() => setTileSize(size => Math.min(MAX_TILE_SIZE, size + TILE_SIZE_STEP))}
          />
          <Text>{tileSize}px</Text>
        </ToolbarGroup>

        <ToolbarGroup className={classes.toolbarGroup}>
          <Text weight="semibold">{selectedIds.size} selected</Text>
          <Button appearance="secondary" onClick={() => gridRef.current?.clearSelection()}>
            Clear selection
          </Button>
        </ToolbarGroup>
      </Toolbar>

      {query.trim().length > 0 || orientation !== 'all' ? (
        <TagGroup aria-label="Active filters" className={classes.tags} onDismiss={dismissFilter}>
          {query.trim().length > 0 ? (
            <Tag value="query" dismissible dismissIcon={<DismissRegular />}>
              Search: {query}
            </Tag>
          ) : null}
          {orientation !== 'all' ? (
            <Tag value="orientation" dismissible dismissIcon={<DismissRegular />}>
              {ORIENTATION_OPTIONS.find(option => option.value === orientation)?.label}
            </Tag>
          ) : null}
        </TagGroup>
      ) : null}

      <div className={classes.frame}>
        <TileGrid
          ref={gridRef}
          items={filteredItems}
          getItemId={getPhotoId}
          getItemLabel={getPhotoLabel}
          getItemAspectRatio={getPhotoAspectRatio}
          renderItem={renderPhotoTile}
          layout={layout}
          tileSize={tileSize}
          gap={8}
          ariaLabel="Photo library"
          selectionMode="multiselect"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          enableMarquee
          reorderable
          reorderDisabled={!arrangingEnabled}
          onReorder={handleReorder}
          onItemActivate={openPreview}
          scrollResetKey={filterKey}
          zoomable
          onTileSizeChange={setTileSize}
          strings={RECIPE_STRINGS}
        />
      </div>

      <Dialog
        open={previewItem !== null}
        modalType="non-modal"
        onOpenChange={(_, data) => {
          if (!data.open) setPreviewId(null);
        }}
      >
        <DialogSurface className={classes.previewSurface}>
          <DialogBody>
            <DialogTitle>{previewItem?.label ?? 'Photo preview'}</DialogTitle>
            <DialogContent>
              <div className={classes.previewContent}>
                {previewItem ? (
                  <img
                    className={classes.previewImage}
                    src={previewItem.thumbnailUrl}
                    alt=""
                    width={previewItem.width}
                    height={previewItem.height}
                  />
                ) : null}
                {previewItem ? (
                  <Text>
                    {previewItem.width} × {previewItem.height}
                  </Text>
                ) : null}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPreviewId(null)}>
                Close preview
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
