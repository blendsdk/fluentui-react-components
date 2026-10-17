import type { Meta } from '@storybook/react-vite';
import { AppLauncher } from '../AppLauncher';

const meta: Meta<typeof AppLauncher> = {
  title: 'Components/AppLauncher',
  component: AppLauncher,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The launcher shell: a waffle trigger that opens a docked panel of application tiles',
          'and rows. The application owns the data and the open state — which apps exist, when one',
          'is disabled, what a search matches and what "recent" means. The stories below are the',
          'integrated demo suite: the Microsoft 365 flow, docking variants, the trigger slot,',
          'disabled and icon treatments, search and controlled-open states, localization and',
          'branded bars.',
          '',
          '**Manual review checklist (run in a real browser):**',
          '',
          '1. Docking geometry — in DockedToAppBar and KitchenSink, open the panel: it sits flush below the bar, edge to edge.',
          '2. Full docking — in FullDock, the panel reaches the window bottom, scrolls internally, and the search field stays pinned on top while the tiles scroll under it.',
          '3. Tooltip suppression — focus the closed waffle: the tooltip appears; open the panel and focus it again: no tooltip floats over the panel.',
          '4. Tile hover — hover a tile in any story: it lifts with a soft shadow and paints above its neighbors.',
          '5. Keyboard flow — Tab moves through the panel, Enter/Space activate an item, the first Escape clears a query and the second closes the panel.',
          '6. Toolbar trigger — in ToolbarTrigger, open the drawer: the waffle sits between the Home and Settings commands and opens the panel below itself, floating over the page.',
          '7. Branded bars — in BrandedBars, hover, press and focus each waffle: it stays on-brand on every bar color, with a soft white overlay as the feedback.',
          '8. Localization — in Localization, the German and Armenian examples render and filter as you type; the empty state is localized too.',
          '9. Item actions — in ItemActions, activating a tile or a row records it in the log and closes the panel; the disabled items never activate.',
          '10. Accessibility addon — the a11y panel reports no violations for every story.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

export { KitchenSink } from './AppLauncherKitchenSink.story';
export { DockedToAppBar } from './AppLauncherDockedToAppBar.story';
export { FullDock } from './AppLauncherFullDock.story';
export { TriggerAnchoredList } from './AppLauncherTriggerAnchoredList.story';
export { ToolbarTrigger } from './AppLauncherToolbarTrigger.story';
export { DisabledItems } from './AppLauncherDisabledItems.story';
export { IconTreatments } from './AppLauncherIconTreatments.story';
export { SearchStates } from './AppLauncherSearchStates.story';
export { ControlledOpen } from './AppLauncherControlledOpen.story';
export { ItemActions } from './AppLauncherItemActions.story';
export { Localization } from './AppLauncherLocalization.story';
export { BrandedBars } from './AppLauncherBrandedBars.story';
