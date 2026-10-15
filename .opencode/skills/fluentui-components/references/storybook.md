# Storybook

Storybook is the component workbench and the published documentation. It runs
from the package (`pnpm storybook`, port 6006), builds statically with
`pnpm storybook:build`, and deploys to GitHub Pages from `main`. Every
component ships a story file; a component without a story is not done.

## Where stories live

`src/components/<Name>/<Name>.stories.tsx` — beside the component, so a
component and its story travel together. Stories are excluded from the built
package (`tsconfig.build.json` and the `files` field), so nothing from
Storybook reaches npm. Storybook's own config lives in
`packages/react-components/.storybook/`:

- `main.ts` — collects `../src/**/*.stories.@(ts|tsx)`, registers the docs and
  a11y addons, and sets the asset base path for GitHub Pages.
- `preview.tsx` — wraps every story in `FluentProvider` with `webLightTheme`,
  so stories render the way applications mount them. Do not re-wrap a story in
  a provider.

## The shape of a story file

```tsx
import { Badge } from '@fluentui/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Example } from './Example';

const meta: Meta<typeof Example> = {
  title: 'Components/Example',
  component: Example,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Example>;

/** One line on what this variant shows and when to choose it. */
export const Default: Story = {
  args: { label: 'Example' },
};

/** A second variant with a different documented behavior. */
export const Compact: Story = {
  args: { label: 'Example', layout: 'compact' },
};
```

Conventions:

- `title: 'Components/<Name>'` — all components live under `Components/`;
  container/child pairs are separate entries, and the container's stories show
  the pair together.
- `tags: ['autodocs']` gives the component an autodocs page built from the
  props types and JSDoc. The doc comments you write are the documentation the
  page renders — keep them accurate.
- `args` for scalar props. Use `render` when the story needs children or rich
  content:

  ```tsx
  export const RichValues: Story = {
    args: { layout: 'columns' },
    render: args => (
      <Example {...args}>
        <Badge color="brand">Pro</Badge>
      </Example>
    ),
  };
  ```

- When several stories share the same children, extract one local renderer
  (`function renderSubscription(args: ExampleProps): ReactElement`) and
  reference it from each story, so the stories differ only in their props.

## Which variants must exist

At minimum, one story per row of the component's README prop table — each
documented variant is reachable in Storybook:

- the default arrangement,
- every alternative layout or size the props type documents,
- rich/heterogeneous content, when the component accepts `ReactNode`,
- disabled states, when the component supports them (show `disabled` and
  `disabledFocusable` side by side and explain the difference in the story
  description).

A story description (the JSDoc above the export) states _when_ to choose the
variant, not what it looks like — the rendered story shows that.

## Accessibility in Storybook

The a11y addon reports violations per story. Treat a violation like a failing
test: fix the component, not the story. Add focused variants (for example a
long-label case or an RTL case) when a component has a known edge its default
story cannot show.

## Building and publishing

```bash
pnpm storybook        # development server on :6006
pnpm storybook:build  # static build into packages/react-components/storybook-static
```

The Pages workflow rebuilds on every push to `main` and passes
`STORYBOOK_BASE_PATH` so the built assets resolve under
`https://blendsdk.github.io/fluentui-react-components/`. Local builds should
not set that variable.

## Review checklist

- [ ] Story file exists beside the component with `autodocs`.
- [ ] Every documented prop variant is reachable; descriptions say when to use
      each one.
- [ ] `pnpm storybook:build` succeeds and the a11y addon shows no violations.
- [ ] No provider, theme or wrapper duplicated from `preview.tsx`.
- [ ] Stories and story types do not leak into the published package.
