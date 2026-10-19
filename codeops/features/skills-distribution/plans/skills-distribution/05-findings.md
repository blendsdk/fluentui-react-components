# Findings — skills distribution

## F-01 — `prepack` output broke the pack JSON parser

**Severity:** major (verification blocked)

`npm pack --dry-run --json` runs the new `prepack` lifecycle script. The sync
script writes a success line to stdout before npm writes the JSON manifest, so
`scripts/check-pack.mjs` failed with "Could not parse the output".

**Resolution:** the guard keeps the JSON from the first line that starts with
`[` and ignores the lifecycle output. The pack list is still parsed from npm's
manifest, not reconstructed from the script output.

**Status:** fixed and verified by `pnpm pack:check`.

## F-02 — The pack guard rejected a legitimate skill template

**Severity:** major (publishing blocked)

`skills/fluentui-components/templates/Component.stories.tsx` is a template that
the component skill instructs an agent to copy. The pack guard's story-file rule
is designed for compiled component stories and rejected the template.

**Resolution:** the guard allows the `skills/` payload and continues to reject
`src/`, `.storybook/`, `storybook-static/` and story-named files elsewhere in the
package. The exception is documented in the guard.

**Status:** fixed and verified by `pnpm pack:check`; the package still rejects
source and Storybook story files outside the skill payload.

## F-03 — `--skill <id>` did not match the frontmatter display name

**Severity:** major (documented install commands failed)

The documented commands use `--skill fluentui-components` and
`--skill rhf-zod-forms`. The `skills` CLI matches the frontmatter `name`, which
was "Fluent UI v9 components" and "React Hook Form + Zod forms"; it reported
"No matching skills found" for the IDs.

**Resolution:** align each frontmatter `name` with its directory ID. The H1
title and description still provide the human-readable name. Installation with
both IDs was verified in a temporary project.

**Status:** fixed and verified with the local package path.

## F-04 — The CI listing depended on the network

**Severity:** major (offline CI acceptance)

The first version used `npx --yes skills@1.7.2` in the `skills:check` script.
That fetches the CLI from npm on a cold cache, which does not satisfy the
offline local-package acceptance criterion.

**Resolution:** add `skills@1.7.2` as a root dev dependency and run the local
binary after the sync. The README installation instructions still use
`npx skills` because that is the consumer-facing installer.

**Status:** fixed and verified by `pnpm skills:check`.

## Open findings

None.
