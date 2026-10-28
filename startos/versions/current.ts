import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'

/**
 * Reset all mempool settings to undefined so the new flavor's upstream
 * defaults take effect. Applied on Core ↔ Knots transitions only: Knots
 * flavors share the same policy defaults, so switching between them leaves
 * the mempool config alone.
 */
/**
 * Knots 29.3's built-in software expiry (2027-11-07). The pre-RDTS packages'
 * Other Settings form wrote it into bitcoin.conf on every save whether or not
 * the user changed it, so a switched-over node would otherwise expire a year
 * before this release does. Only that exact value is dropped; a value the user
 * chose (0 included) is kept.
 */
const knots293SoftwareExpiry = 1825593420

async function dropInheritedSoftwareExpiry(
  effects: Parameters<typeof bitcoinConfFile.merge>[0],
) {
  const conf = await bitcoinConfFile.read().once()
  if (conf?.softwareexpiry === knots293SoftwareExpiry) {
    await bitcoinConfFile.merge(effects, { softwareexpiry: undefined })
  }
}

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
  version: '#knotssha:31.1:3',
  releaseNotes: {
    en_US: `- Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018). This is revision 3 of the package.\n- The package is now titled Bitcoin Knots (SHA256), matching the companion.\n- Updates the bundled I2P router from 2.58.0 to 2.59.0 and the helper image's Python from 3.14.2 to 3.14.10.\n- Compute Compact Block Filters (Other Settings) now warns that on a pruned node it can only be turned on before the node has pruned anything.\n- Stops trusting certificates from a compromised certificate authority (eMudhra), as Bitcoin Core's package 31.1:26 does.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.\n- Dependent services such as Electrs can read the node over its REST interface, served only to services on this server. RPC on port 8332 always goes through the RPC proxy, which answers JSON-RPC only.\n- Enable IPC (Actions) serves the node over a local socket for services such as Stratum v2 mining, as Bitcoin Core's package does.\n- Other Settings can set the block weight reserved for the coinbase transaction, and mining services can request it. The block template size settings now show the node's real defaults (300,000 bytes, 1,200,000 weight units).\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- Software Expiry is empty by default, meaning this release's built-in expiry. A node switched over keeps an expiry it set itself, but the value 1825593420 (2027-11-07) that earlier Knots packages wrote on every save is removed.\n- A Peers health check fails when the node has no outbound peers, from five minutes after it starts.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.`,
    es_ES: `- Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018). This is revision 3 of the package.\n- The package is now titled Bitcoin Knots (SHA256), matching the companion.\n- Updates the bundled I2P router from 2.58.0 to 2.59.0 and the helper image's Python from 3.14.2 to 3.14.10.\n- Compute Compact Block Filters (Other Settings) now warns that on a pruned node it can only be turned on before the node has pruned anything.\n- Stops trusting certificates from a compromised certificate authority (eMudhra), as Bitcoin Core's package 31.1:26 does.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.\n- Dependent services such as Electrs can read the node over its REST interface, served only to services on this server. RPC on port 8332 always goes through the RPC proxy, which answers JSON-RPC only.\n- Enable IPC (Actions) serves the node over a local socket for services such as Stratum v2 mining, as Bitcoin Core's package does.\n- Other Settings can set the block weight reserved for the coinbase transaction, and mining services can request it. The block template size settings now show the node's real defaults (300,000 bytes, 1,200,000 weight units).\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- Software Expiry is empty by default, meaning this release's built-in expiry. A node switched over keeps an expiry it set itself, but the value 1825593420 (2027-11-07) that earlier Knots packages wrote on every save is removed.\n- A Peers health check fails when the node has no outbound peers, from five minutes after it starts.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.`,
    de_DE: `- Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018). This is revision 3 of the package.\n- The package is now titled Bitcoin Knots (SHA256), matching the companion.\n- Updates the bundled I2P router from 2.58.0 to 2.59.0 and the helper image's Python from 3.14.2 to 3.14.10.\n- Compute Compact Block Filters (Other Settings) now warns that on a pruned node it can only be turned on before the node has pruned anything.\n- Stops trusting certificates from a compromised certificate authority (eMudhra), as Bitcoin Core's package 31.1:26 does.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.\n- Dependent services such as Electrs can read the node over its REST interface, served only to services on this server. RPC on port 8332 always goes through the RPC proxy, which answers JSON-RPC only.\n- Enable IPC (Actions) serves the node over a local socket for services such as Stratum v2 mining, as Bitcoin Core's package does.\n- Other Settings can set the block weight reserved for the coinbase transaction, and mining services can request it. The block template size settings now show the node's real defaults (300,000 bytes, 1,200,000 weight units).\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- Software Expiry is empty by default, meaning this release's built-in expiry. A node switched over keeps an expiry it set itself, but the value 1825593420 (2027-11-07) that earlier Knots packages wrote on every save is removed.\n- A Peers health check fails when the node has no outbound peers, from five minutes after it starts.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.`,
    pl_PL: `- Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018). This is revision 3 of the package.\n- The package is now titled Bitcoin Knots (SHA256), matching the companion.\n- Updates the bundled I2P router from 2.58.0 to 2.59.0 and the helper image's Python from 3.14.2 to 3.14.10.\n- Compute Compact Block Filters (Other Settings) now warns that on a pruned node it can only be turned on before the node has pruned anything.\n- Stops trusting certificates from a compromised certificate authority (eMudhra), as Bitcoin Core's package 31.1:26 does.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.\n- Dependent services such as Electrs can read the node over its REST interface, served only to services on this server. RPC on port 8332 always goes through the RPC proxy, which answers JSON-RPC only.\n- Enable IPC (Actions) serves the node over a local socket for services such as Stratum v2 mining, as Bitcoin Core's package does.\n- Other Settings can set the block weight reserved for the coinbase transaction, and mining services can request it. The block template size settings now show the node's real defaults (300,000 bytes, 1,200,000 weight units).\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- Software Expiry is empty by default, meaning this release's built-in expiry. A node switched over keeps an expiry it set itself, but the value 1825593420 (2027-11-07) that earlier Knots packages wrote on every save is removed.\n- A Peers health check fails when the node has no outbound peers, from five minutes after it starts.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.`,
    fr_FR: `- Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018). This is revision 3 of the package.\n- The package is now titled Bitcoin Knots (SHA256), matching the companion.\n- Updates the bundled I2P router from 2.58.0 to 2.59.0 and the helper image's Python from 3.14.2 to 3.14.10.\n- Compute Compact Block Filters (Other Settings) now warns that on a pruned node it can only be turned on before the node has pruned anything.\n- Stops trusting certificates from a compromised certificate authority (eMudhra), as Bitcoin Core's package 31.1:26 does.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package.\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.\n- Dependent services such as Electrs can read the node over its REST interface, served only to services on this server. RPC on port 8332 always goes through the RPC proxy, which answers JSON-RPC only.\n- Enable IPC (Actions) serves the node over a local socket for services such as Stratum v2 mining, as Bitcoin Core's package does.\n- Other Settings can set the block weight reserved for the coinbase transaction, and mining services can request it. The block template size settings now show the node's real defaults (300,000 bytes, 1,200,000 weight units).\n- Token transactions are rejected: new installs turn Reject Tokens on, and a node switched over from another flavor keeps a setting it made itself and otherwise gets this build's default, which is also on. Change it under Mempool Settings.\n- Software Expiry is empty by default, meaning this release's built-in expiry. A node switched over keeps an expiry it set itself, but the value 1825593420 (2027-11-07) that earlier Knots packages wrote on every save is removed.\n- A Peers health check fails when the node has no outbound peers, from five minutes after it starts.\n- Blockchain Sync reads "Catching up" with the number of blocks behind, rather than synced, when the node falls two or more blocks behind.\n- Delete Block Filter Index removes a corrupted block filter index so it can be rebuilt, which on a pruned node needs Reindex Blockchain.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.`,
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
      // Newest first: given a version range rather than an exact target, the SDK's
      // version graph takes the first matching edge, and the gentlest cleanup must win.
      ['^31']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^30']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
        },
      },
      ['^29']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      ['^28']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      // Bitcoin Knots (pre-RDTS) ↔ #knotssha. Same chain, same policy
      // defaults, same data layout apart from the 31.x files above, so the
      // mempool config is left alone. That flavor is pinned to Knots
      // 29.3.knots20260507 forever, which is exactly the release this series
      // inherits from.
      ['^#knotsprerdts:29.3']: {
        up: async ({ effects }) => {
          await dropInheritedSoftwareExpiry(effects)
        },
        down: async ({ effects }) => {
          await removeFeeEstimates()
          await removeCoinstatsIndex()
        },
      },
      // `#knots` only up to :7, which ran Knots 29.3.knots20260210 or earlier
      // (pre-RDTS, the same chain; StartOS 0.3.5.1's Knots included). From :8 on,
      // and for `#knotsrdts`, Bitcoin Knots enforces BIP-110 and later mines
      // BLAKE2b proof-of-work, so those datadirs are on a different chain and a
      // migration in either direction is refused, as the pre-RDTS package refuses it.
      ['<=#knots:29.3:7']: {
        up: async ({ effects }) => {
          await dropInheritedSoftwareExpiry(effects)
        },
      },
    },
  },
})
  // The Bitcoin Core revisions this package stands in for when a dependent's
  // `versionRange` is evaluated: the official bitcoin-core-startos `version`
  // plus the `.satisfies(...)` it carries. Copied from Core 31.x at 31.1:26 on
  // 2026-10-28 (:26 is only a rebuild picking up Debian's ca-certificates
  // 20250419+deb13u1, which distrusts the compromised eMudhra intermediates; our
  // image installs ca-certificates the same way); see UPDATING.md.
  //
  // Claim a Core revision only when this package offers every dependent-facing
  // feature up to it. At 31.1:25 those are: REST on the bridge-only `rpc-local`
  // binding with btc-rpc-proxy v0.8.2 fronting `rpc` (:17/:18; electrs 0.12
  // requires >=31.1:17 and reads the node over REST), the dependent-enabled
  // wallet (:19), and coinbase block weight that mining services can reserve
  // (:25). Host ids, interface ids and ports are identical to Core's.
  .satisfies('31.1:26')
  .satisfies('30.3:16')
  .satisfies('29.4:16')
  .satisfies('28.4:29')
