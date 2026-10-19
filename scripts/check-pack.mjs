#!/usr/bin/env node
/**
 * Publish artifact guard.
 *
 * Runs `npm pack --dry-run --json` for the publishable package and inspects
 * the file list npm would actually publish. The package publishes only its
 * `dist/` output, so this guard fails if source, Storybook configuration, or
 * story files ever enter the tarball.
 *
 * The guard requires a completed build: it also fails when the pack list has
 * no `dist/` entries, which catches an accidentally empty artifact. The two
 * distributable skills must also be present, because consumers install them
 * from the published package.
 *
 * Usage:
 *
 * ```bash
 * pnpm build
 * pnpm pack:check
 * ```
 */

import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, derived from this script's location (`<root>/scripts/`). */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Directory of the only publishable workspace package. */
const PACKAGE_DIR = join(ROOT, 'packages', 'react-components');

/** Paths that must never be published. */
const FORBIDDEN_PREFIXES = ['src/', 'storybook-static/', '.storybook/'];

/** Directory name that must never appear in a published path. */
const FORBIDDEN_SEGMENT = 'stories';

/** Filename fragments that identify a story or scenario file. */
const FORBIDDEN_FILENAME_PARTS = ['.stories.', '.story.'];

/** Skill entry files that every published artifact must contain. */
const REQUIRED_SKILL_FILES = [
  'skills/fluentui-components/SKILL.md',
  'skills/rhf-zod-forms/SKILL.md',
];

/** Generated skill templates that may legitimately carry story/test names. */
const SKILL_TEMPLATE_PATTERN = /^skills\/[^/]+\/templates\//;

/**
 * Reports whether a path from the pack list is source or story material.
 *
 * The generated `skills/` payload intentionally contains templates with names
 * such as `Component.stories.tsx` and `form.spec.test.tsx` under each skill's
 * `templates/` directory. Those files are documentation assets, not compiled
 * component sources or Storybook stories. Every other path keeps the normal
 * source/story checks.
 *
 * @param {string} filePath - path relative to the package root
 * @returns {boolean} `true` when the path must not be published
 */
function isForbidden(filePath) {
  if (SKILL_TEMPLATE_PATTERN.test(filePath)) {
    return false;
  }

  return (
    FORBIDDEN_PREFIXES.some(prefix => filePath.startsWith(prefix)) ||
    filePath.split('/').includes(FORBIDDEN_SEGMENT) ||
    FORBIDDEN_FILENAME_PARTS.some(part => filePath.includes(part))
  );
}

/**
 * Reads the file list npm would publish, failing with a clear message when
 * npm does not produce the expected JSON.
 *
 * @returns {string[]} published paths relative to the package root
 */
function readPublishedPaths() {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: PACKAGE_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  // The package's `prepack` script prints a sync line to stdout before npm
  // writes the JSON manifest. Keep the manifest, ignore the lifecycle output.
  const jsonStart = output.search(/^\[/m);
  const jsonText = jsonStart >= 0 ? output.slice(jsonStart) : output;

  let manifest;

  try {
    [manifest] = JSON.parse(jsonText);
  } catch {
    console.error('Could not parse the output of `npm pack --dry-run --json`.');
    process.exit(1);
  }

  if (!Array.isArray(manifest?.files)) {
    console.error('The npm pack manifest does not contain a file list.');
    process.exit(1);
  }

  return manifest.files.map(entry => entry.path);
}

const paths = readPublishedPaths();
const forbidden = paths.filter(isForbidden);

if (forbidden.length > 0) {
  console.error('The publish artifact contains source or story files:');

  for (const filePath of forbidden) {
    console.error(`  ${filePath}`);
  }

  process.exit(1);
}

if (!paths.some(filePath => filePath.startsWith('dist/'))) {
  console.error('The publish artifact has no dist/ files. Run `pnpm build` first.');
  process.exit(1);
}

const missingSkillFiles = REQUIRED_SKILL_FILES.filter(filePath => !paths.includes(filePath));

if (missingSkillFiles.length > 0) {
  console.error('The publish artifact is missing required skill files:');

  for (const filePath of missingSkillFiles) {
    console.error(`  ${filePath}`);
  }

  process.exit(1);
}

console.log(
  `Publish artifact verified: ${paths.length} files, both skills present, no source or story files.`
);
