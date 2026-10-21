import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { ReactElement, ReactNode } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridItemRenderArgs, TileGridLayout, TileGridStrings } from '../TileGrid.types';

/** One sample tile used by the TileGrid stories. */
export interface StoryItem {
  /** Stable story identifier. */
  id: string;
  /** Visible and accessible tile label. */
  label: string;
  /** Intrinsic width divided by height. */
  aspectRatio: number;
  /** Optional dense-grid span used by the mosaic demo. */
  span?: { columns?: 1 | 2; rows?: 1 | 2 };
  /** Generated data-URL artwork. */
  image: string;
  /** Artwork base color. */
  tone: string;
}

const artworkWidth = 400;
// Demo artwork colors: generated SVG content is not component styling.
const palette = ['#0f6cbd', '#2b7a78', '#8764b8', '#c0564f', '#5c6b2f', '#8a5a2b'];
const proportions = [1, 1.5, 0.75, 1.25, 0.8, 1.6];
const names = [
  'Alpine lake',
  'City lights',
  'Desert road',
  'Forest trail',
  'Harbor morning',
  'Studio light',
  'Coastline',
  'Night market',
  'Meadow',
  'Bridge',
  'Rooftop',
  'Snowfield',
];

/**
 * Builds a small abstract SVG and returns it as a data URL.
 *
 * The stories use generated artwork so they never reach the network and stay
 * deterministic in screenshots and accessibility checks.
 */
function createArtwork(index: number, tone: string, aspectRatio: number): string {
  const height = Math.round(artworkWidth / aspectRatio);
  const circleX = 80 + (index % 5) * 60;
  const circleY = 70 + (index % 3) * 50;
  const circleRadius = 42 + (index % 4) * 16;
  const pathY = Math.round(height * 0.62);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${artworkWidth}" height="${height}" viewBox="0 0 ${artworkWidth} ${height}">`,
    `<rect width="${artworkWidth}" height="${height}" fill="${tone}"/>`,
    `<circle cx="${circleX}" cy="${circleY}" r="${circleRadius}" fill="rgba(255,255,255,0.22)"/>`,
    `<path d="M0 ${pathY} L110 ${pathY - 70} L210 ${pathY - 20} L310 ${pathY - 95} L400 ${pathY - 30} L400 ${height} L0 ${height} Z" fill="rgba(255,255,255,0.14)"/>`,
    '</svg>',
  ].join('');

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The shared sample set: varied aspect ratios, a 2x2 span every seventh tile. */
export const storyItems: readonly StoryItem[] = Array.from({ length: 24 }, (_, index) => {
  const tone = palette[index % palette.length];
  const aspectRatio = proportions[index % proportions.length];

  return {
    id: `story-${index + 1}`,
    label: `Photo ${index + 1} — ${names[index % names.length]}`,
    aspectRatio,
    span: index % 7 === 0 ? { columns: 2, rows: 2 } : undefined,
    image: createArtwork(index, tone, aspectRatio),
    tone,
  };
});

/** Reads the stable story item ID. */
export function getStoryItemId(item: StoryItem): string {
  return item.id;
}

/** Reads the visible and accessible story item label. */
export function getStoryItemLabel(item: StoryItem): string {
  return item.label;
}

/** Reads the intrinsic aspect ratio used by masonry and justified layouts. */
export function getStoryItemAspectRatio(item: StoryItem): number {
  return item.aspectRatio;
}

/** Reads the optional mosaic span. */
export function getStoryItemSpan(item: StoryItem): { columns?: 1 | 2; rows?: 1 | 2 } | undefined {
  return item.span;
}

const useStoryTileStyles = makeStyles({
  tile: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    outline: '2px solid transparent',
    outlineOffset: '-2px',
  },
  selected: {
    outlineColor: tokens.colorBrandStroke1,
  },
  image: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  label: {
    position: 'absolute',
    insetInlineStart: tokens.spacingHorizontalS,
    insetBlockEnd: tokens.spacingVerticalS,
    maxWidth: `calc(100% - (${tokens.spacingHorizontalS} * 2))`,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    overflow: 'hidden',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

/** The visual content of one tile; the grid wrapper owns position and label. */
function StoryTile({
  item,
  selected = false,
}: {
  item: StoryItem;
  selected?: boolean;
}): ReactElement {
  const classes = useStoryTileStyles();

  return (
    <div className={mergeClasses(classes.tile, selected && classes.selected)}>
      <img className={classes.image} src={item.image} alt="" />
      <span className={classes.label}>{item.label}</span>
    </div>
  );
}

/** Stable tile renderer shared by every story. */
export function renderStoryTile({
  item,
  selected,
}: TileGridItemRenderArgs<StoryItem>): ReactElement {
  return <StoryTile item={item} selected={selected} />;
}

const useStoryFrameStyles = makeStyles({
  frame: {
    boxSizing: 'border-box',
    width: '100%',
    minWidth: '320px',
    maxWidth: '960px',
    height: '560px',
    overflow: 'hidden',
    resize: 'horizontal',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
});

/** Fixed-height, horizontally resizable frame for the grid stories. */
export function StoryFrame({ children }: { children: ReactNode }): ReactElement {
  const classes = useStoryFrameStyles();

  return <div className={classes.frame}>{children}</div>;
}

/** Props accepted by the shared story grid. */
export interface StoryGridProps {
  /** Layout variant under test. */
  layout: TileGridLayout;
  /** Requested tile size. */
  tileSize?: number;
  /** Lower tile-size bound. */
  minTileSize?: number;
  /** Upper tile-size bound. */
  maxTileSize?: number;
  /** Explicit column count. */
  columns?: number;
  /** Gap between tiles. */
  gap?: number;
  /** Items to render; defaults to the shared sample set. */
  items?: readonly StoryItem[];
  /** Partial string overrides. */
  strings?: Partial<TileGridStrings>;
  /** Replaces the default empty state. */
  renderEmpty?: () => ReactNode;
  /** Accessible list name. */
  ariaLabel?: string;
}

/**
 * Shared grid wrapper for the stories.
 *
 * The callbacks are module-level functions so the memoized tile wrapper sees a
 * stable `renderItem` identity across story re-renders.
 */
export function StoryGrid({
  layout,
  tileSize,
  minTileSize,
  maxTileSize,
  columns,
  gap,
  items = storyItems,
  strings,
  renderEmpty,
  ariaLabel = 'Photo grid',
}: StoryGridProps): ReactElement {
  return (
    <TileGrid
      items={items}
      getItemId={getStoryItemId}
      getItemLabel={getStoryItemLabel}
      getItemAspectRatio={getStoryItemAspectRatio}
      getItemSpan={getStoryItemSpan}
      renderItem={renderStoryTile}
      layout={layout}
      tileSize={tileSize}
      minTileSize={minTileSize}
      maxTileSize={maxTileSize}
      columns={columns}
      gap={gap}
      strings={strings}
      renderEmpty={renderEmpty}
      ariaLabel={ariaLabel}
    />
  );
}
