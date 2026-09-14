# Contributing

This is a private invention repository. The rules below exist so that work by several people and several agents lands looking like one hand wrote it.

## House style

**Punctuation is ASCII.** No em dash, no en dash, no curly quote, no curly apostrophe, no ellipsis character, anywhere: prose, comments, commit messages, UI strings. Code, filenames, flags, URLs and quoted third-party strings keep their own characters.

**Prose says the thing.** Lead with the finding. Say what is proven and what is not, in the same sentence as the claim. A number that is conditional carries its condition. "Zero-trust" belongs to the peer layer only; the fiat boundary has named trusted parties and a removal roadmap.

**Node code**: ES modules, two-space indent, single quotes, semicolons, `async`/`await` rather than raw `.then()`.

**Python**: 3.12 or newer, type hints on every signature, `from __future__ import annotations` at the top, formatted with `black`. Imports grouped standard library, third party, local, separated by blank lines.

**Solidity**: whatever `forge fmt` produces, line length 100 as set in `foundry.toml`.

**Markdown is one paragraph per line.** No hard wraps inside a paragraph, list item or quote; the site renders markdown as HTML and a wrapped source line wastes the reading column. `node scripts/reflow-markdown.mjs` unwraps a file, `--check` flags one that still needs it.

**Markdown in `docs/`**: it has to read correctly on GitHub. The site adds diagrams from fenced blocks GitHub does not know, so the body of such a block is written as plain lines that still make sense when nothing renders them.

## Commits

Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`. The subject says what changed, in the imperative, under about 70 characters.

    feat(web): port the landlord page to React and retire the static build
    docs: developer guides for every subsystem, with verified commands

No attribution trailers. No `Co-Authored-By`, no generator footer, no emoji.

Never pass `--no-verify` or `--no-gpg-sign`. A blocked hook is a signal to fix the cause.

Commit after each functional milestone rather than in one heap at the end, so a bisect lands somewhere useful.

## Branches

Work on a branch, never directly on `main`.

    git switch -c feat/<short-name>
    # work, commit as you go
    git push -u origin feat/<short-name>

Open a pull request, merge to `main` once it is verified, then delete the branch so nothing dangles. Before any destructive git operation (`reset --hard`, `push --force`, `checkout --`), look for the route that reaches the same place without losing work.

## Review checklist

Run through this before asking for a review, and again before merging.

1. **It builds.** For the site: `cd web && npx vite build --outDir ../.tmp-build-<name> --emptyOutDir`, then delete that folder. For everything else: `PYTHON=.venv/Scripts/python.exe MAKE=mingw32-make scripts/bootstrap.sh` ends with `BOOTSTRAP COMPLETE`.
2. **The proofs still pass.** A changed number in a scenario, a gas figure or a check count is a finding, not noise. Say what moved and why.
3. **No invariant drifted.** `HANDOVER.md` section 3 lists them: the wire formats across three implementations, the ticket field order, the escrow solvency identity, the fixed pin map, and the eight Laws with their named tests. Weakening a Law's test is a design change and goes to Martin first.
4. **Punctuation is ASCII** in every file the change touched.
5. **Docs match the code.** A command in a README was run and its exit code is what the README says. A retired path is retired everywhere, not just where it was noticed.
6. **Nothing secret is in the diff.** No `.env`, no `.pem`, no private key, no token in a URL. `docs/ops/` holds account material and is never imported by the site bundle; keep it that way.
7. **Pages, if the change touched `web/`**: the routes still render, the layout survives a 400 px window, both themes are readable, and the console is clean. `web/README.md` carries the full list.
