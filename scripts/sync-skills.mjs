#!/usr/bin/env node
/**
 * Copies the distributable skills into the publishable package.
 *
 * The repository keeps one source of truth for agent skills at the top-level
 * `skills/` directory. npm can only publish files inside the package
 * directory, so this script mirrors that source into
 * `packages/react-components/skills/` before a build or pack.
 *
 * The generated copy is ignored by Git and must never be edited by hand.
 * Running the script is idempotent: it removes the previous copy first, so a
 * deleted or renamed skill cannot linger in the published artifact.
 *
 * Usage:
 *
 * ```bash
 * node scripts/sync-skills.mjs
 * ```
 */

import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, derived from this script's location (`<root>/scripts/`). */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The single source of truth for distributable skills. */
const SOURCE_DIR = join(ROOT, 'skills');

/** The generated copy consumed by npm and by the local `skills` CLI check. */
const TARGET_DIR = join(ROOT, 'packages', 'react-components', 'skills');

/**
 * Lists the skill directory IDs in the source tree.
 *
 * A skill is a directory with a `SKILL.md` file. Other files and folders at
 * the source root are ignored, so documentation can live beside the skills.
 *
 * @returns {string[]} skill IDs in stable alphabetical order
 */
function listSkillIds() {
  if (!existsSync(SOURCE_DIR) || !statSync(SOURCE_DIR).isDirectory()) {
    throw new Error(`The distributable skills directory is missing: ${SOURCE_DIR}`);
  }

  return readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry => existsSync(join(SOURCE_DIR, entry.name, 'SKILL.md')))
    .map(entry => entry.name)
    .sort();
}

const skillIds = listSkillIds();

if (skillIds.length === 0) {
  throw new Error(`No skills with a SKILL.md were found in ${SOURCE_DIR}`);
}

rmSync(TARGET_DIR, { recursive: true, force: true });
cpSync(SOURCE_DIR, TARGET_DIR, { recursive: true });

console.log(
  `Synced ${skillIds.length} skill(s) to packages/react-components/skills: ${skillIds.join(', ')}`
);
