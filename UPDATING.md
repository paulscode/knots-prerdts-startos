# Updating the upstream version

This package installs Bitcoin Knots SHA256 (Bitcoin Knots' patch series maintained on top of Bitcoin Core for the SHA256
chain) and is kept **in lock-step with the drop-in package** `knots-sha256-startos`: it is that package plus an
enumerated companion delta (icon, identity, own ports, prune-by-default, ZeroMQ off, its own version chain). The
framework that produces the releases documents the procedure (RUNBOOK §9.1c) and enforces the delta
(`tools/companion-check.py`); the one-time conversion from the earlier pinned build is its Appendix E.

## Current pin

`VERSION` build-arg under `images.bitcoind.source.dockerBuild.buildArgs` in `startos/manifest/index.ts` — still
`29.3.knots20260507` until the first Bitcoin Knots SHA256 release; from then on always the same release string as the
drop-in package.

## Applying a bump (every Bitcoin Knots SHA256 release)

1. `git fetch dropin && git merge dropin/main` (remote `dropin` = knots-sha256-startos); resolve conflicts only in
   delta files, keeping this package's identity, ports and defaults.
2. `VERSION` = the release string of the drop-in; `startos/versions/current.ts`: bump `#knotsprerdts:<core>:<N>` — keep
   the `#knotsprerdts` flavor (Datum Gateway (SHA256) Companion depends on `>=#knotsprerdts:29.3:25`).
3. `npm run check`; framework `tools/companion-check.py --startos` must PASS.
4. Workspace `./release.sh knots-prerdts-startos`, sign `SHA256SUMS` on the air-gapped machine, `--publish`, then
   publish to the registry (`start9-store/start9-040`: `make publish PKG=<this repo>/builds`).

## The i2pd image

The service-log filter's drop list (`startos/i2pdLogFilter.ts`) is transcribed verbatim from the pinned i2pd image's message wording. Bumping the `i2pd` image tag can reword those messages; that fails open — a reworded family passes the filter and the log flood returns — rather than dropping evidence, but it means an i2pd bump owes a re-validation: run `npm test`, then watch a few hours of live service logs and fold any reworded families back into the list (and its test corpus). The filter and its test ship verbatim in the Knots repos — update all three together.

## Applying the bump

1. In `startos/manifest/index.ts`, bump the `bitcoind` image `buildArgs`:
   - `VERSION` — the full release string (e.g. `29.3.knots20260507`).
   - `PATH_VERSION` — the major track folder (e.g. `29.x`); only changes when the series rolls.
2. If upstream rotated release signers, update `PINNED_FINGERPRINTS` in `Dockerfile` and refresh the keys in `assets/release-keys/`.
3. Knots' `version` string stays put; `.satisfies('29.4:N')` in the current version file tracks Bitcoin Core 29.x's current `:N`. When Core 29.x bumps `:N`, update the `satisfies` argument here to match. The current version file also carries `.satisfies('28.4:N')` against Core 28.x — the baseline line every dependent's `versionRange` is written against — so bump that in the same pass.
4. Cross-flavor migrations with `bitcoin-core-startos` are declared inline in the current Knots version file's `migrations.other` map, keyed by Core version strings. When Bitcoin Core bumps its `:N`, add the matching entries here so the migration path runs.

> Sibling Knots branches (`29.x`, `29.x-prerdts`) share the Bitcoin Core revision suffix tracked by `.satisfies('29.4:N')` — bump one, bump the other in tandem. They do **not** share the upstream release: `29.x` tracks current Knots releases; this branch stays pinned to `29.3.knots20260507`.
