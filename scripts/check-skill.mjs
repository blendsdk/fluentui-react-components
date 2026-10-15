#!/usr/bin/env node
/**
 * Repository skill guard.
 *
 * Validates the project-local skills under `.opencode/skills` so a skill
 * cannot silently rot: every skill directory must be a lowercase kebab-case
 * ID with a `SKILL.md` whose frontmatter carries a `name` and a
 * `description`, and every relative Markdown link inside a skill must
 * resolve to a file that exists.
 *
 * The script prints one line per problem and exits with code 1 when any
 * problem was found, so CI fails on a broken skill. It exits with code 0 —
 * with a note — when the repository has no skills directory at all.
 *
 * Usage:
 *
 * ```bash
 * pnpm skill:check
 * ```
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, derived from this script's location (`<root>/scripts/`). */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Directory that holds every project-local skill. */
const SKILLS_DIR = join(ROOT, '.opencode', 'skills');

/**
 * Recommended skill ID shape: lowercase kebab-case, used for the directory
 * name that becomes the skill ID in OpenCode.
 */
const SKILL_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Longest description that stays readable in the model's skill list. */
const MAX_DESCRIPTION_LENGTH = 1024;

/** Problems found during validation; empty means the skills are healthy. */
const problems = [];

/**
 * Reads the YAML frontmatter block of a Markdown file.
 *
 * Only the two fields this guard validates are parsed — `name` and
 * `description` — with a deliberately small parser instead of a YAML
 * dependency, because frontmatter here is a flat list of `key: value` lines.
 *
 * @param {string} filePath - absolute path of the Markdown file to read
 * @returns {{ name?: string, description?: string } | null} parsed fields, or
 *   `null` when the file does not start with a frontmatter block
 */
function readFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) {
    return null;
  }

  /** @type {{ name?: string, description?: string }} */
  const fields = {};

  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^(name|description):\s*(.+)$/);

    if (entry) {
      fields[entry[1]] = entry[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }

  return fields;
}

/**
 * Lists every Markdown file inside a directory, recursively.
 *
 * @param {string} dirPath - directory to scan
 * @returns {string[]} absolute paths of the `.md` files found
 */
function listMarkdownFiles(dirPath) {
  const files = [];

  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(entryPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Checks that every relative link in one Markdown file resolves.
 *
 * Absolute URLs, mail links, and pure anchors are ignored; every other link
 * target is resolved against the file's directory and must exist. A missing
 * target is reported with the file and the raw link so the fix is obvious.
 *
 * @param {string} filePath - absolute path of the Markdown file to scan
 */
function checkLinks(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const linkPattern = /\]\(([^()]+)\)/g;

  for (const match of content.matchAll(linkPattern)) {
    const target = match[1].trim().split('#')[0].split('?')[0];

    if (target === '' || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
      continue;
    }

    const resolved = resolve(dirname(filePath), decodeURI(target));

    if (!existsSync(resolved)) {
      problems.push(`${filePath}: link target does not exist: ${match[1]}`);
    }
  }
}

/**
 * Validates one skill directory: ID shape, `SKILL.md`, frontmatter fields,
 * description length, and every relative link in the skill's Markdown files.
 *
 * @param {string} skillId - directory name of the skill (its OpenCode ID)
 * @param {string} skillPath - absolute path of the skill directory
 */
function checkSkill(skillId, skillPath) {
  if (!SKILL_ID_PATTERN.test(skillId)) {
    problems.push(`${skillPath}: skill ID must be lowercase kebab-case (${skillId})`);
  }

  const skillFile = join(skillPath, 'SKILL.md');

  if (!existsSync(skillFile)) {
    problems.push(`${skillPath}: missing SKILL.md`);
    return;
  }

  const frontmatter = readFrontmatter(skillFile);

  if (!frontmatter) {
    problems.push(`${skillFile}: missing frontmatter block`);
  } else {
    if (!frontmatter.name) {
      problems.push(`${skillFile}: frontmatter is missing "name"`);
    }

    if (!frontmatter.description) {
      problems.push(`${skillFile}: frontmatter is missing "description"`);
    } else if (frontmatter.description.length > MAX_DESCRIPTION_LENGTH) {
      problems.push(
        `${skillFile}: description is longer than ${MAX_DESCRIPTION_LENGTH} characters`
      );
    }
  }

  for (const filePath of listMarkdownFiles(skillPath)) {
    checkLinks(filePath);
  }
}

/**
 * Entry point: validates every skill directory and reports the result.
 */
function main() {
  if (!existsSync(SKILLS_DIR) || !statSync(SKILLS_DIR).isDirectory()) {
    console.log('skill:check — no .opencode/skills directory, nothing to validate');
    return;
  }

  const skillIds = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  for (const skillId of skillIds) {
    checkSkill(skillId, join(SKILLS_DIR, skillId));
  }

  if (problems.length > 0) {
    console.error(`skill:check — ${problems.length} problem(s) found:`);

    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(`skill:check — ${skillIds.length} skill(s) validated`);
}

main();
