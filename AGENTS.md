# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Package id is `bitcoind`, not `knots-sha256`.** Bitcoin Core, Bitcoin Knots and this package are drop-in flavors of one package; the repo and directory are named after the product, the flavor is `#knotssha` (letters only — StartOS's exver grammar allows nothing else), but `effects` calls, dependents, and `start-cli` all take `bitcoind`.
- **The node comes from the Bitcoin Knots SHA256 release process, not from here.** `VERSION` in the manifest is the release string printed by `tools/cfg version` in the private framework repo (`/mnt/Black/knots-sha256-framework`, run-book `docs/RUNBOOK.md` §9.1b); `assets/release-keys/` is a copy of that repo's `config/keys/maintainer.asc`. Bump them via `UPDATING.md`, never by hand-editing a fingerprint.
- **`upstream` is `Start9-Community/bitcoin-knots-prerdts-startos` `master`**, the drop-in pre-RDTS flavor this was forked from on 2026-09-19. Pull generic fixes from there; do not pull its pin, its migrations, or its release notes. Paul's companion fork `knots-prerdts-startos` (remote `prerdts`) is a different animal — own id, own ports, pruned by default — so its defaults are not this package's defaults.
- **Nothing imports this package yet.** Check both registries (Paul's and Start9's) before assuming otherwise.
- **Never drop a key from `store.json`'s shape because this flavor does not act on it.** All bitcoind flavors share one store, and dropping the declaration would discard another flavor's pending state on a switch.
- **`startos/i2pdLogFilter.ts` and `test/i2pdLogFilter.test.ts` are shared verbatim with `bitcoin-core-startos` and the Knots repos** — edit all the trees together. `npm test` runs the suite and is chained into `npm run check`, so `make` and CI gate on it. The drop list is keyed to the pinned i2pd image's exact message wording; read UPDATING.md's i2pd section before bumping that image.
- **`fullConfigSpec` has three hand-maintained halves and no exhaustiveness check.** A new setting must be added to `shape`, `fileToForm`, and `formToFile` in `startos/fileModels/bitcoin.conf.ts` — TypeScript will not tell you one is missing. Then select it in one of the four config actions' `filter({…})`; a field no action selects is unreachable from the UI.
- **Every Wallet-group action gates on `!conf?.raw?.disablewallet`.** A new one must do the same, or it appears on a node with no wallet and fails at the RPC.
- **`setInterfaces` must not drop RPC and peer along with the conf.** Only the ZMQ and I2P exports read `bitcoin.conf`; an early return on a null read de-exports every interface, and the fifteen dependents that watch this host see them all vanish at once. A torn write is a real way to read null (Start9Labs/start-technologies#3668).
