import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'

/**
 * Reset all mempool settings to undefined so the new flavor's upstream
 * defaults take effect. Applied on Core ↔ Knots transitions only: Knots
 * flavors share the same policy defaults, so switching between them leaves
 * the mempool config alone.
 */
const mempoolReset = {
  // Shared mempool settings
  persistmempool: undefined,
  maxmempool: undefined,
  mempoolexpiry: undefined,
  mempoolfullrbf: undefined,
  permitbaremultisig: undefined,
  datacarrier: undefined,
  datacarriersize: undefined,
  // Knots-specific mempool settings
  permitbaredatacarrier: undefined,
  rejectparasites: undefined,
  rejecttokens: undefined,
  mempoolreplacement: undefined,
  mempooltruc: undefined,
  permitbareanchor: undefined,
  permitephemeral: undefined,
  minrelaytxfee: undefined,
  bytespersigop: undefined,
  bytespersigopstrict: undefined,
  maxtxlegacysigops: undefined,
  limitancestorcount: undefined,
  limitancestorsize: undefined,
  limitdescendantcount: undefined,
  limitdescendantsize: undefined,
  permitbarepubkey: undefined,
  maxscriptsize: undefined,
  datacarriercost: undefined,
  acceptnonstddatacarrier: undefined,
  dustrelayfee: undefined,
  acceptunknownwitness: undefined,
  minrelaycoinblocks: undefined,
  minrelaymaturity: undefined,
}

/**
 * This node is Bitcoin Core 31.x underneath, so its datadir carries two
 * things an older bitcoind refuses to read. Removing them is what the
 * official Core 31.x package does on its own downgrade path; both are
 * rebuilt by the destination binary.
 */
const removeFeeEstimates = async () => {
  // v31 changed CURRENT_FEES_FILE_VERSION (149900 → 309900) and the fee
  // estimator bucket size; ≤30 hard-fails on a v31-written file.
  await rm('/media/startos/volumes/main/fee_estimates.dat', {
    force: true,
  }).catch(console.error)
}
const removeCoinstatsIndex = async () => {
  // Core 30 moved the coinstatsindex layout; a ≤29 node cannot read it.
  await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
    recursive: true,
    force: true,
  }).catch(console.error)
}

export const current = VersionInfo.of({
  // #knotssha — the flavor is letters only (StartOS's exver grammar), so the
  // product name "knots-sha256" cannot be used verbatim. 31.1 is the Bitcoin
  // Core base of the installed release; the Knots SHA256 series date lives in
  // the VERSION build-arg in startos/manifest/index.ts, not here. The trailing
  // number is this package's own revision and bumps on every wrapper release.
  version: '#knotssha:31.1:0',
  releaseNotes: {
    en_US: `- First release of Bitcoin Knots SHA256 on StartOS: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core or Bitcoin Knots (pre-RDTS) and keep your synced chain. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- A Peers health check fails when the node has had no outbound peers for five minutes.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.`,
    es_ES: `- First release of Bitcoin Knots SHA256 on StartOS: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core or Bitcoin Knots (pre-RDTS) and keep your synced chain. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- A Peers health check fails when the node has had no outbound peers for five minutes.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.`,
    de_DE: `- First release of Bitcoin Knots SHA256 on StartOS: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core or Bitcoin Knots (pre-RDTS) and keep your synced chain. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- A Peers health check fails when the node has had no outbound peers for five minutes.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.`,
    pl_PL: `- First release of Bitcoin Knots SHA256 on StartOS: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core or Bitcoin Knots (pre-RDTS) and keep your synced chain. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- A Peers health check fails when the node has had no outbound peers for five minutes.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.`,
    fr_FR: `- First release of Bitcoin Knots SHA256 on StartOS: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core or Bitcoin Knots (pre-RDTS) and keep your synced chain. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- A Peers health check fails when the node has had no outbound peers for five minutes.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    other: {
      // Bitcoin Core ↔ #knotssha, keyed by Core major series. `up` (arriving
      // from Core) resets the mempool config so Knots' policy defaults apply;
      // the data upgrade to a 31.x datadir is bitcoind's own. `down` (leaving
      // for Core) resets the mempool config again and removes what the older
      // binary cannot read.
      ['^28']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      ['^29']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      ['^30']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
        },
      },
      ['^31']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      // Bitcoin Knots (pre-RDTS) ↔ #knotssha. Same chain, same policy
      // defaults, same data layout apart from the 31.x files above, so the
      // mempool config is left alone. That flavor is pinned to Knots
      // 29.3.knots20260507 forever, which is exactly the release this series
      // inherits from.
      ['^#knotsprerdts:29.3']: {
        up: async ({ effects }) => {},
        down: async ({ effects }) => {
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      // No entry for `#knots` or `#knotsrdts`: from 29.4 on Bitcoin Knots
      // enforces BIP-110 and mines BLAKE2b proof-of-work, so those flavors'
      // datadirs are on a different chain. A migration in either direction is
      // refused, as the pre-RDTS package refuses it.
    },
  },
})
  // The Bitcoin Core revisions this package stands in for when a dependent's
  // `versionRange` is evaluated. Track the official bitcoin-core-startos:
  // its current `version` plus the `.satisfies(...)` it carries. Copied from
  // Core 31.x on 2026-09-19; see UPDATING.md.
  //
  // 31.1:16, NOT :17, deliberately. Core 31.1:17 is where the official package
  // started serving `rpc-local` (bitcoind's REST port, `rest=1`), and dependents
  // key on that: official electrs 0.12 requires >=31.1:17 because it reads the
  // node over REST. This package has no REST and no `rpc-local` host, so claiming
  // :17 let such a dependent install against it and then fail at runtime. Raise
  // this past :16 only together with REST, `rpc-local` and btc-rpc-proxy v0.8.2
  // fronting `rpc` (upstream 871b2d7, 66d4495, e19c0ac).
  .satisfies('31.1:16')
  .satisfies('30.3:16')
  .satisfies('29.4:16')
  .satisfies('28.4:29')
