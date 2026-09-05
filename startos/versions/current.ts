import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'

/**
 * Reset all mempool settings to undefined so the new flavor's upstream
 * defaults take effect. Applied on Core↔Knots transitions only; Knots
 * variants share identical mempool defaults so switching between them
 * leaves the mempool config alone.
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
 * Chain-split recovery flag (see startos/forkRecovery.ts), set on the `up`
 * sidegrade from the RDTS-enforcing `#knots` sibling and consumed by this
 * flavor's chain-recovery oneshot at next start (a clean no-op when there is
 * nothing to fix). The shared datadir carries the sibling's persisted
 * per-block verdicts across the switch, so its RDTS-driven invalid verdicts
 * must be reconsidered or they pin this node to a stale chain across a
 * split. The runtime rdtsEnforcedLastRun marker detects the same transition
 * independently; setting the flag here makes the switch case deterministic
 * even if a prior run never recorded a marker.
 *
 * The `down` edge toward the sibling needs nothing: the Knots release it
 * pins re-validates the RDTS-applicable range itself when it starts on a
 * datadir that advanced without enforcement.
 */
const leavingRdtsFlavor = { reconsiderInvalidTips: true }

export const current = VersionInfo.of({
  version: '#knotsprerdts:29.3:28',
  releaseNotes: {
    en_US: `- This node is now pruned on a fresh install, keeping about 5 GB of blocks, whatever the size of your disk. It is a companion meant to run beside your main node, and a second full copy of the same chain is rarely what anyone installs it for. Previously it followed the official package and pruned only on a disk below roughly 900 GB, so on a large disk you got a second archival node without asking for one.
- **Nothing changes for an install that already exists.** The setting is seeded once, at install, so your node keeps whatever it is running now.
- To run it as a full archival node, set Pruning to 0 under Actions and Config, Other Settings. The field's minimum stays disk-aware, so 0 is offered only where the disk could hold the whole chain. Note that going from pruned to archival re-syncs from scratch.\n- The service is now called "Bitcoin Knots (SHA256) Companion". Only the display name and description changed; the package id, the version flavor and your data are untouched, and this is the same build following the same chain as before.\n- SHA256 rather than pre-RDTS, because the first thing to know when choosing between this and the BLAKE2b companion is which chain it follows. That it does not enforce BIP-110 is still true, still the reason to run it, and now explained in the description rather than compressed into the title.\n- The instructions no longer claim you can switch between this and Bitcoin Core without re-syncing. That is true of the upstream package this is built from, which shares the bitcoind package id and data volume with every Knots flavor. It has never been true of this one: it is a companion with its own id and its own volume, which is what lets it run alongside your existing node instead of replacing it.\n- Fixes an interface export that could take RPC and peer down with it. A read of bitcoin.conf that came back empty used to de-export every interface at once, including the two that do not depend on that file, which every dependent watches. Only the ZMQ and I2P exports need the file now, and an empty read is treated as a gap rather than as data. Ported from Start9-Community/bitcoin-knots-startos#63.`,
    es_ES: `- This node is now pruned on a fresh install, keeping about 5 GB of blocks, whatever the size of your disk. It is a companion meant to run beside your main node, and a second full copy of the same chain is rarely what anyone installs it for. Previously it followed the official package and pruned only on a disk below roughly 900 GB, so on a large disk you got a second archival node without asking for one.
- **Nothing changes for an install that already exists.** The setting is seeded once, at install, so your node keeps whatever it is running now.
- To run it as a full archival node, set Pruning to 0 under Actions and Config, Other Settings. The field's minimum stays disk-aware, so 0 is offered only where the disk could hold the whole chain. Note that going from pruned to archival re-syncs from scratch.\n- The service is now called "Bitcoin Knots (SHA256) Companion". Only the display name and description changed; the package id, the version flavor and your data are untouched, and this is the same build following the same chain as before.\n- SHA256 rather than pre-RDTS, because the first thing to know when choosing between this and the BLAKE2b companion is which chain it follows. That it does not enforce BIP-110 is still true, still the reason to run it, and now explained in the description rather than compressed into the title.\n- The instructions no longer claim you can switch between this and Bitcoin Core without re-syncing. That is true of the upstream package this is built from, which shares the bitcoind package id and data volume with every Knots flavor. It has never been true of this one: it is a companion with its own id and its own volume, which is what lets it run alongside your existing node instead of replacing it.\n- Fixes an interface export that could take RPC and peer down with it. A read of bitcoin.conf that came back empty used to de-export every interface at once, including the two that do not depend on that file, which every dependent watches. Only the ZMQ and I2P exports need the file now, and an empty read is treated as a gap rather than as data. Ported from Start9-Community/bitcoin-knots-startos#63.`,
    de_DE: `- This node is now pruned on a fresh install, keeping about 5 GB of blocks, whatever the size of your disk. It is a companion meant to run beside your main node, and a second full copy of the same chain is rarely what anyone installs it for. Previously it followed the official package and pruned only on a disk below roughly 900 GB, so on a large disk you got a second archival node without asking for one.
- **Nothing changes for an install that already exists.** The setting is seeded once, at install, so your node keeps whatever it is running now.
- To run it as a full archival node, set Pruning to 0 under Actions and Config, Other Settings. The field's minimum stays disk-aware, so 0 is offered only where the disk could hold the whole chain. Note that going from pruned to archival re-syncs from scratch.\n- The service is now called "Bitcoin Knots (SHA256) Companion". Only the display name and description changed; the package id, the version flavor and your data are untouched, and this is the same build following the same chain as before.\n- SHA256 rather than pre-RDTS, because the first thing to know when choosing between this and the BLAKE2b companion is which chain it follows. That it does not enforce BIP-110 is still true, still the reason to run it, and now explained in the description rather than compressed into the title.\n- The instructions no longer claim you can switch between this and Bitcoin Core without re-syncing. That is true of the upstream package this is built from, which shares the bitcoind package id and data volume with every Knots flavor. It has never been true of this one: it is a companion with its own id and its own volume, which is what lets it run alongside your existing node instead of replacing it.\n- Fixes an interface export that could take RPC and peer down with it. A read of bitcoin.conf that came back empty used to de-export every interface at once, including the two that do not depend on that file, which every dependent watches. Only the ZMQ and I2P exports need the file now, and an empty read is treated as a gap rather than as data. Ported from Start9-Community/bitcoin-knots-startos#63.`,
    pl_PL: `- This node is now pruned on a fresh install, keeping about 5 GB of blocks, whatever the size of your disk. It is a companion meant to run beside your main node, and a second full copy of the same chain is rarely what anyone installs it for. Previously it followed the official package and pruned only on a disk below roughly 900 GB, so on a large disk you got a second archival node without asking for one.
- **Nothing changes for an install that already exists.** The setting is seeded once, at install, so your node keeps whatever it is running now.
- To run it as a full archival node, set Pruning to 0 under Actions and Config, Other Settings. The field's minimum stays disk-aware, so 0 is offered only where the disk could hold the whole chain. Note that going from pruned to archival re-syncs from scratch.\n- The service is now called "Bitcoin Knots (SHA256) Companion". Only the display name and description changed; the package id, the version flavor and your data are untouched, and this is the same build following the same chain as before.\n- SHA256 rather than pre-RDTS, because the first thing to know when choosing between this and the BLAKE2b companion is which chain it follows. That it does not enforce BIP-110 is still true, still the reason to run it, and now explained in the description rather than compressed into the title.\n- The instructions no longer claim you can switch between this and Bitcoin Core without re-syncing. That is true of the upstream package this is built from, which shares the bitcoind package id and data volume with every Knots flavor. It has never been true of this one: it is a companion with its own id and its own volume, which is what lets it run alongside your existing node instead of replacing it.\n- Fixes an interface export that could take RPC and peer down with it. A read of bitcoin.conf that came back empty used to de-export every interface at once, including the two that do not depend on that file, which every dependent watches. Only the ZMQ and I2P exports need the file now, and an empty read is treated as a gap rather than as data. Ported from Start9-Community/bitcoin-knots-startos#63.`,
    fr_FR: `- This node is now pruned on a fresh install, keeping about 5 GB of blocks, whatever the size of your disk. It is a companion meant to run beside your main node, and a second full copy of the same chain is rarely what anyone installs it for. Previously it followed the official package and pruned only on a disk below roughly 900 GB, so on a large disk you got a second archival node without asking for one.
- **Nothing changes for an install that already exists.** The setting is seeded once, at install, so your node keeps whatever it is running now.
- To run it as a full archival node, set Pruning to 0 under Actions and Config, Other Settings. The field's minimum stays disk-aware, so 0 is offered only where the disk could hold the whole chain. Note that going from pruned to archival re-syncs from scratch.\n- The service is now called "Bitcoin Knots (SHA256) Companion". Only the display name and description changed; the package id, the version flavor and your data are untouched, and this is the same build following the same chain as before.\n- SHA256 rather than pre-RDTS, because the first thing to know when choosing between this and the BLAKE2b companion is which chain it follows. That it does not enforce BIP-110 is still true, still the reason to run it, and now explained in the description rather than compressed into the title.\n- The instructions no longer claim you can switch between this and Bitcoin Core without re-syncing. That is true of the upstream package this is built from, which shares the bitcoind package id and data volume with every Knots flavor. It has never been true of this one: it is a companion with its own id and its own volume, which is what lets it run alongside your existing node instead of replacing it.\n- Fixes an interface export that could take RPC and peer down with it. A read of bitcoin.conf that came back empty used to de-export every interface at once, including the two that do not depend on that file, which every dependent watches. Only the ZMQ and I2P exports need the file now, and an empty read is treated as a gap rather than as data. Ported from Start9-Community/bitcoin-knots-startos#63.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
    other: {
      // Core ↔ #knotsprerdts. Mirrors what `#knots` does for the same
      // Core majors: mempool reset on every transition, plus data-path
      // cleanup for Core 30 (coinstatsindex moved) and Core 31 (fees-file
      // bump + coinstatsindex).
      ['^28']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^29']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^30']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^31']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await rm('/media/startos/volumes/main/fee_estimates.dat', {
            force: true,
          }).catch(console.error)
          await rm('/media/startos/volumes/main/indexes/coinstatsindex', {
            recursive: true,
            force: true,
          }).catch(console.error)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      // #knots ↔ #knotsprerdts. Same data layout; this flavor ships
      // the last pre-RDTS Knots release (20260507). Switching here is
      // an explicit opt-out of RDTS, so queue the invalid-verdict
      // reconsideration. Any `consensusrules=rdts` carried over is
      // stripped by the file model on the first write, so there is
      // nothing to clear here. No `down`: the sibling's own binary
      // re-validates the RDTS-applicable range on its first start.
      ['^#knots:29.3']: {
        up: async ({ effects }) => {
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
      // `#knotsrdts` (the retired "Bitcoin Knots plus BIP-110" build)
      // is being de-listed. Users on it can move here; same data layout,
      // and same RDTS-opt-out cleanup and verdict-clearing as the
      // `#knots` path above. No `down` — `#knotsrdts` can't be selected
      // as a destination.
      ['^#knotsrdts:29.3']: {
        up: async ({ effects }) => {
          await storeJson.merge(effects, leavingRdtsFlavor)
        },
      },
    },
  },
})
  .satisfies('29.4:13')
  .satisfies('28.4:26')
