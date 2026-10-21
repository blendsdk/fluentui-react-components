import { makeStyles, tokens } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import { createTileGridFixture } from '../../../../test/fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../../../../test/fixtures/tileGridFixture';
import { TileGrid } from '../TileGrid';
import type { TileGridItemRenderArgs } from '../TileGrid.types';

const benchmarkItems = createTileGridFixture(20_000);

const useStyles = makeStyles({
  frame: {
    width: '100%',
    height: '900px',
    overflow: 'hidden',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tile: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
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

function getBenchmarkItemId(item: TileGridFixtureItem): string {
  return item.id;
}

function getBenchmarkItemLabel(item: TileGridFixtureItem): string {
  return item.label;
}

function getBenchmarkAspectRatio(item: TileGridFixtureItem): number {
  return item.aspectRatio;
}

function BenchmarkTile({ item }: { item: TileGridFixtureItem }): ReactElement {
  const classes = useStyles();

  return (
    <div className={classes.tile}>
      <img className={classes.image} src={item.thumbnailUrl} alt="" decoding="async" />
      <span className={classes.label}>{item.label}</span>
    </div>
  );
}

function renderBenchmarkItem({ item }: TileGridItemRenderArgs<TileGridFixtureItem>): ReactElement {
  return <BenchmarkTile item={item} />;
}

/**
 * The 20,000-item benchmark. The fixed-height frame is the scroll container's
 * parent, so the grid keeps its own scroll position while only the visible
 * window and a small overscan are mounted.
 */
export const TwentyThousandBenchmark = (): ReactElement => {
  const classes = useStyles();

  return (
    <div className={classes.frame}>
      <TileGrid
        items={benchmarkItems}
        getItemId={getBenchmarkItemId}
        getItemLabel={getBenchmarkItemLabel}
        getItemAspectRatio={getBenchmarkAspectRatio}
        renderItem={renderBenchmarkItem}
        ariaLabel="Twenty thousand photo grid"
        tileSize={160}
        gap={8}
      />
    </div>
  );
};
