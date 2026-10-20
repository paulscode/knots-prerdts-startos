import { VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'

/**
 * Knots 29.3's built-in software expiry (2027-11-07). Earlier releases of this
 * package wrote it into bitcoin.conf from the Other Settings form on every save,
 * whether or not the user changed it, so an upgraded node would otherwise expire
 * a year before this release does. Only that exact value is dropped; a value the
 * user chose (0 included) is kept.
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
  // #knotsprerdts is this package's flavor and never changes (Datum (SHA256)
  // Companion depends on >=#knotsprerdts:29.3:25). 31.1 is the Bitcoin Core base
  // of the installed Bitcoin Knots SHA256 release; the trailing number is this
  // package's own revision.
  version: '#knotsprerdts:31.1:0',
  releaseNotes: {
    en_US: `- Release candidate 1 of Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018rc1), for testing before the final release.\n- This companion now runs Bitcoin Knots SHA256: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core. It was pinned to Bitcoin Knots 29.3.knots20260507 and now follows Bitcoin Knots SHA256 releases in lock-step with the drop-in Bitcoin Knots SHA256 package. It keeps its own id, ports and data, and stays pruned unless you changed that.\n- Upgrading keeps your synced chain. Downgrading to an earlier 29.3 release of this companion removes the fee estimates and the coinstats index, which the older node cannot read; both are rebuilt.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Dependent services can read the node over its REST interface, served only to services on this server. RPC now always goes through the RPC proxy, which answers JSON-RPC only.\n- A Peers health check, a Catching up state in Blockchain Sync, Delete Block Filter Index, and Other Settings for the block weight reserved for the coinbase transaction, which mining services such as Datum Gateway can request.\n- Software Expiry is now empty by default, meaning this release's built-in expiry. The value 1825593420 (2027-11-07) that earlier versions wrote on every save is removed on upgrade.`,
    es_ES: `- Release candidate 1 of Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018rc1), for testing before the final release.\n- This companion now runs Bitcoin Knots SHA256: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core. It was pinned to Bitcoin Knots 29.3.knots20260507 and now follows Bitcoin Knots SHA256 releases in lock-step with the drop-in Bitcoin Knots SHA256 package. It keeps its own id, ports and data, and stays pruned unless you changed that.\n- Upgrading keeps your synced chain. Downgrading to an earlier 29.3 release of this companion removes the fee estimates and the coinstats index, which the older node cannot read; both are rebuilt.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Dependent services can read the node over its REST interface, served only to services on this server. RPC now always goes through the RPC proxy, which answers JSON-RPC only.\n- A Peers health check, a Catching up state in Blockchain Sync, Delete Block Filter Index, and Other Settings for the block weight reserved for the coinbase transaction, which mining services such as Datum Gateway can request.\n- Software Expiry is now empty by default, meaning this release's built-in expiry. The value 1825593420 (2027-11-07) that earlier versions wrote on every save is removed on upgrade.`,
    de_DE: `- Release candidate 1 of Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018rc1), for testing before the final release.\n- This companion now runs Bitcoin Knots SHA256: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core. It was pinned to Bitcoin Knots 29.3.knots20260507 and now follows Bitcoin Knots SHA256 releases in lock-step with the drop-in Bitcoin Knots SHA256 package. It keeps its own id, ports and data, and stays pruned unless you changed that.\n- Upgrading keeps your synced chain. Downgrading to an earlier 29.3 release of this companion removes the fee estimates and the coinstats index, which the older node cannot read; both are rebuilt.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Dependent services can read the node over its REST interface, served only to services on this server. RPC now always goes through the RPC proxy, which answers JSON-RPC only.\n- A Peers health check, a Catching up state in Blockchain Sync, Delete Block Filter Index, and Other Settings for the block weight reserved for the coinbase transaction, which mining services such as Datum Gateway can request.\n- Software Expiry is now empty by default, meaning this release's built-in expiry. The value 1825593420 (2027-11-07) that earlier versions wrote on every save is removed on upgrade.`,
    pl_PL: `- Release candidate 1 of Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018rc1), for testing before the final release.\n- This companion now runs Bitcoin Knots SHA256: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core. It was pinned to Bitcoin Knots 29.3.knots20260507 and now follows Bitcoin Knots SHA256 releases in lock-step with the drop-in Bitcoin Knots SHA256 package. It keeps its own id, ports and data, and stays pruned unless you changed that.\n- Upgrading keeps your synced chain. Downgrading to an earlier 29.3 release of this companion removes the fee estimates and the coinstats index, which the older node cannot read; both are rebuilt.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Dependent services can read the node over its REST interface, served only to services on this server. RPC now always goes through the RPC proxy, which answers JSON-RPC only.\n- A Peers health check, a Catching up state in Blockchain Sync, Delete Block Filter Index, and Other Settings for the block weight reserved for the coinbase transaction, which mining services such as Datum Gateway can request.\n- Software Expiry is now empty by default, meaning this release's built-in expiry. The value 1825593420 (2027-11-07) that earlier versions wrote on every save is removed on upgrade.`,
    fr_FR: `- Release candidate 1 of Bitcoin Knots SHA256 31.1 (31.1.knots-sha256.20261018rc1), for testing before the final release.\n- This companion now runs Bitcoin Knots SHA256: Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.1 for the SHA256 chain, consensus-identical to Bitcoin Core. It was pinned to Bitcoin Knots 29.3.knots20260507 and now follows Bitcoin Knots SHA256 releases in lock-step with the drop-in Bitcoin Knots SHA256 package. It keeps its own id, ports and data, and stays pruned unless you changed that.\n- Upgrading keeps your synced chain. Downgrading to an earlier 29.3 release of this companion removes the fee estimates and the coinstats index, which the older node cannot read; both are rebuilt.\n- Built on version 3 of the StartOS packaging SDK, which needs StartOS 0.4.0.2.\n- Dependent services can read the node over its REST interface, served only to services on this server. RPC now always goes through the RPC proxy, which answers JSON-RPC only.\n- A Peers health check, a Catching up state in Blockchain Sync, Delete Block Filter Index, and Other Settings for the block weight reserved for the coinbase transaction, which mining services such as Datum Gateway can request.\n- Software Expiry is now empty by default, meaning this release's built-in expiry. The value 1825593420 (2027-11-07) that earlier versions wrote on every save is removed on upgrade.`,
  },
  migrations: {
    // From this package's own 29.3 releases: the same chain, so the datadir is
    // kept; only the expiry their Other Settings form wrote is dropped.
    up: async ({ effects }) => {
      await dropInheritedSoftwareExpiry(effects)
    },
    // Back to a 29.3 release of this package: remove what Bitcoin Core 31 adds
    // that the older node refuses to read (both are rebuilt).
    down: async () => {
      await removeFeeEstimates()
      await removeCoinstatsIndex()
    },
    // Its own package id: no cross-flavor migrations.
    other: {},
  },
})
