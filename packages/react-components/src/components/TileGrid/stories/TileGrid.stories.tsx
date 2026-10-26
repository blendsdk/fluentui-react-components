import type { Meta } from '@storybook/react-vite';
import { TileGrid } from '../TileGrid';

const meta: Meta<typeof TileGrid> = {
  title: 'Components/TileGrid',
  component: TileGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A measured tile grid with fixed, masonry, justified and mosaic layouts. The grid root',
          'is the scroll container; the application sizes its parent, owns the data and supplies',
          'the tile content through `renderItem`.',
          'Selection controls, keyboard navigation, filtering persistence, optional marquee, pointer arranging and the optional TileGridItem shell are available in this workbench. The npm 0.4.0 release is published.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Layouts — compare Fixed, FixedColumns, Masonry, Justified and Mosaic: fixed tiles share a square shape, masonry balances variable heights, justified fills each completed row, and mosaic shows 2x2 featured tiles.',
          '2. Resize — drag the right edge of the frame: columns recompute and every layout keeps its tiles inside the frame.',
          '3. Tile size — in ControlledTileSize, move the slider from 120 to 320: the displayed value follows, the grid reflows, and the tile size stays inside the bounds.',
          '4. Scroll — the frame is 560px tall with more content than fits: the grid scrolls internally and the page does not jump.',
          '5. Empty — DefaultEmpty shows the built-in message, CustomMessage replaces the string, and CustomEmpty replaces the whole state.',
          '6. Selection — in Selection, plain click replaces, Ctrl/Cmd toggles, Shift extends from the anchor, and the Select all/Clear buttons update the count and the selected outline.',
          '7. Accessibility — every story exposes a named list with labelled list items; the a11y addon reports no violations.',
          '8. 20K — open TwentyThousandBenchmark: the 900px frame scrolls 20,000 items and mounts only the visible window plus overscan.',
          '9. Drag — open Drag, choose each layout and drag a handle: the overlay follows the pointer, the accent line marks the boundary, and a held pointer near an edge auto-scrolls.',
          '10. Photo library — open PhotoLibraryRecipe: filter by label or orientation, confirm selection survives, preview a tile, zoom, and confirm handles disappear while filtered.',
          '11. Tile shell — open Components/TileGridItem: compare slots, states, actions and the default, custom and absent drag handles.',
          '',
        ].join('\n'),
      },
    },
  },
};

export default meta;

export { Fixed, FixedColumns, Masonry, Justified, Mosaic } from './TileGridLayouts.story';
export { DefaultEmpty, CustomMessage, CustomEmpty } from './TileGridEmpty.story';
export { ControlledTileSize } from './TileGridControlledTileSize.story';
export { Selection } from './TileGridSelection.story';
export { KeyboardNavigation } from './TileGridKeyboardNavigation.story';
export { InteractionModes } from './TileGridInteractionModes.story';
export { MarqueeSelection } from './TileGridMarqueeSelection.story';
export { FilteringAndZoom } from './TileGridFilteringAndZoom.story';
export { TwentyThousandBenchmark } from './TileGridTwentyThousandBenchmark.story';
export { Drag } from './TileGridDrag.story';
export { PhotoLibraryRecipe } from './TileGridPhotoLibrary.story';
