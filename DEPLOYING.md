# Deploying forage.life

**TL;DR — never run `vercel deploy` directly. Always go through `~/bin/forage-deploy.sh`.**

## Why this matters

Multiple Claude Code sessions and humans push to this repo and deploy to the `forage-life` Vercel project. A direct `vercel deploy` only ships whatever is in your local working directory — so any subpage, API route, or asset that another session added (`/btcpoly`, `/budfox`, `/polycopy`, `/fellowshipchurch`, `/api/*`, etc.) gets nuked from production every time someone deploys without it locally.

This actually happened on 2026-04-28: four commits to this repo (fellowshipchurch features, the `lib/book-utils.js` move, scripture matching, tab filters) were silently 404'd in prod for hours because a parallel CLI deploy didn't include them. Recovery required rebuilding the lost paths from `git show` of those commits.

## The safe deploy path

The wrapper script `~/bin/forage-deploy.sh` (lives on the deploying machine, not in this repo) does three things in order:

1. **Pulls GitHub HEAD as the base layer** — every non-media blob from `aviq777/forage.life` HEAD is downloaded and staged. So whatever's in this repo always survives.
2. **Mirrors the live forage.life site on top** — auto-discovers every `href="/..."` and `src="/..."` from the homepage and pulls each subpage that returns 200. Live state wins for files that exist on both layers, preserving the latest deploy of homepage / btcpoly / budfox / polycopy.
3. **Applies caller-specified overrides last** (`--homepage`, `--subpage`, `--add`).

Then it runs `vercel deploy --prod`. After deploy, it verifies that subpages still return 200 and screams in the log if any are missing.

## Usage

```bash
# Safe re-mirror (no edits) — proves the script works
~/bin/forage-deploy.sh

# Update homepage
~/bin/forage-deploy.sh --homepage /path/to/index.html

# Add or update a subpage
~/bin/forage-deploy.sh --subpage budfox /path/to/index.html

# Drop a single file at any path
~/bin/forage-deploy.sh --add api/example.js=/local/example.js
```

A `flock` prevents two sessions from deploying simultaneously. Every deploy is logged to `~/forage-deploys.log`.

## If you don't have the wrapper script

If you're cloning this repo on a new machine, ask the repo owner for a copy of `~/bin/forage-deploy.sh` before you deploy anything. Don't `vercel deploy` from a fresh clone — you'll nuke whatever's currently live.

The script is small, has no dependencies beyond `curl`, `python3`, and the `vercel` CLI (used via `npx`), and reads project config from a hardcoded `.vercel/project.json` it generates.

## If you push to git but never deploy

That's fine — the next person who runs `~/bin/forage-deploy.sh` will pull your commits into the deploy automatically (Step 1 above). There's no GitHub-triggered auto-deploy wired up; deploys only happen when someone runs the script.

## Adding a new subpage

1. Add the subpage as `<slug>/index.html` (or `<slug>.html`) to this repo.
2. Add a tile or link to the homepage `index.html` so the auto-discovery picks it up on future deploys.
3. Add the slug to `FALLBACK_SUBPAGES` in `~/bin/forage-deploy.sh` so it's always probed even if temporarily unlinked.
4. Commit, push, and run the wrapper.

## Project info

- Vercel project: `forage-life` (`prj_gNywh33j1B6EVBuVauqkJCIW8Qk3`)
- Vercel team: `aviq777s-projects` (`team_uQYvG5YoJWxD0lfECEH06Ppl`)
- Domain: forage.life
- Source of truth: this repo (`github.com/aviq777/forage.life`)
