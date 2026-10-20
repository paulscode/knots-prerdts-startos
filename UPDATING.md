# Updating the upstream version

This package installs Bitcoin Knots SHA256 (Bitcoin Knots' patch series maintained on top of Bitcoin Core for the SHA256
chain) and is kept **in lock-step with the drop-in package** `knots-sha256-startos`: it is that package plus an
enumerated companion delta (icon, identity, own ports, prune-by-default, ZeroMQ off, its own version chain). The
framework that produces the releases documents the procedure (RUNBOOK §9.1c) and enforces the delta
(`tools/companion-check.py`); the one-time conversion from the earlier pinned build is its Appendix E.

## Current pin

`VERSION` build-arg under `images.bitcoind.source.dockerBuild.buildArgs` in `startos/manifest/index.ts`: still
always the same release string as the drop-in package (`31.1.knots-sha256.20261018rc1` from
rc1 on).

## Applying a bump (every Bitcoin Knots SHA256 release)

1. `git fetch dropin && git merge dropin/main` (remote `dropin` = knots-sha256-startos); resolve conflicts only in
   delta files, keeping this package's identity, ports and defaults.
2. `VERSION` = the release string of the drop-in; `startos/versions/current.ts`: bump `#knotsprerdts:<core>:<N>`, and keep
   the `#knotsprerdts` flavor (Datum Gateway (SHA256) Companion depends on `>=#knotsprerdts:29.3:29`).
3. `npm run check`; framework `tools/companion-check.py --startos` must PASS.
4. Workspace `./release.sh knots-prerdts-startos`, sign `SHA256SUMS` on the air-gapped machine, `--publish`, then
   publish to the registry (`start9-store/start9-040`: `make publish PKG=<this repo>/builds`).

## The i2pd image

The service-log filter's drop list (`startos/i2pdLogFilter.ts`) is transcribed verbatim from the pinned i2pd image's message wording. Bumping the `i2pd` image tag can reword those messages; that fails open — a reworded family passes the filter and the log flood returns — rather than dropping evidence, but it means an i2pd bump owes a re-validation: run `npm test`, then watch a few hours of live service logs and fold any reworded families back into the list (and its test corpus). The filter and its test ship verbatim in the Knots repos — update all three together.

## Applying the bump

1. `startos/manifest/index.ts`: set `VERSION` to the new version string.
2. `startos/versions/current.ts`:
   - `version`: `#knotssha:<core major.minor>:<N>`. The middle part is the
     Bitcoin Core base of the release (`31.1`); it changes when the base does.
     `N` is this package's revision and bumps on every wrapper release, back to
     `0` when the base changes.
   - `releaseNotes`: what changed for a StartOS user (the node's own release
     notes live in the product repo; link rather than paste).
   - `.satisfies(...)`: the Bitcoin Core revisions this package stands in for
     when a dependent's `versionRange` is evaluated. Copy the official
     `bitcoin-core-startos` current branch's `version` and its `.satisfies`
     list; if Core has bumped its `:N` since the last wrapper release, raise
     them here or dependents that raised their floor stop accepting this
     flavor. Check against a real box: `tools/startos-deps.py --host
     start9@imposing-opponent.local` in the framework repo reads every
     installed dependent's `bitcoind` range and must PASS (electrs 0.12.0
     there requires `>=31.1:17`).
   - `migrations.other`: if the Core base changed major (31 → 32), review the
     `down` cleanups against what the official Core package removes on its own
     downgrade path, and add the new Core major key.
   - Move the previous version file under `startos/versions/` and list it in
     `versions/index.ts` `other` the first time a second version exists.
3. Signing key: `assets/release-keys/<FPR>.asc` must be byte-identical to the
   framework's `config/keys/maintainer.asc`, and `PINNED_FINGERPRINTS` in the
   `Dockerfile` must list exactly that fingerprint. The framework's
   `tools/keys-check.sh` compares the committed key with its published copy; a
   key rotation is a framework decision first and a wrapper change second.
4. Build, sign, publish, from the workspace directory above this repo:
   ```
   ./release.sh knots-sha256-startos            # builds the universal s9pk, writes builds/<ver>/SHA256SUMS
   # sign SHA256SUMS on the air-gapped machine, drop SHA256SUMS.asc beside it
   ./release.sh knots-sha256-startos --publish  # verifies, cuts the GitHub Release on this repo
   ```
   CI (`.github/workflows/check.yml`) type-checks and runs the unit tests only;
   it never builds or publishes a package.

## Architectures

The manifest declares `x86_64`, `aarch64` and `riscv64` for the node image, and
the `Dockerfile` maps each to the Guix host name. Confirm the release actually
carries all three `bitcoin-<version>-<host>.tar.gz` files before building; drop
an arch from the manifest rather than shipping a package that fails to build on
it.

## The i2pd image

The service-log filter's drop list (`startos/i2pdLogFilter.ts`) is transcribed
verbatim from the pinned i2pd image's message wording. Bumping the `i2pd` image
tag can reword those messages; that fails open — a reworded family passes the
filter and the log flood returns — rather than dropping evidence, but it means
an i2pd bump owes a re-validation: run `npm test`, then watch a few hours of
live service logs and fold any reworded families back into the list (and its
test corpus). The same filter and test ship in `bitcoin-core-startos` and the
Knots packages, which maintain their own copies.
