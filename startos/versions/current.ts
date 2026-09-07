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
  version: '#knotsprerdts:29.3:30',
  releaseNotes: {
    en_US: `- Runs the official Start9 build of the RPC proxy again, now that the fixes this node needed have been released upstream.\n- **Nothing changes in how this node behaves.** The previous release already carried both fixes; it carried them as our own build of the proxy, because upstream had not cut a release with them yet. Upstream v0.8.1 is tagged at exactly that merge, so this swaps back to the official image for the same code.\n- For reference, the two faults those fixes address, both of which stop a pruned node serving history to anything that depends on it: block 434,499 was rejected as tampered with when it is simply an unusual, valid block mined while SegWit was being signalled, which left indexers retrying it forever; and the proxy kept a copy of this node's cookie from when it started, so after this node restarted it rejected every request its dependents made.\n- Fewer moving parts, no loss of platform support: the official image covers the same three architectures, and it does not carry the BLAKE2b header handling this chain has no use for.`,
    es_ES: `- Runs the official Start9 build of the RPC proxy again, now that the fixes this node needed have been released upstream.\n- **Nothing changes in how this node behaves.** The previous release already carried both fixes; it carried them as our own build of the proxy, because upstream had not cut a release with them yet. Upstream v0.8.1 is tagged at exactly that merge, so this swaps back to the official image for the same code.\n- For reference, the two faults those fixes address, both of which stop a pruned node serving history to anything that depends on it: block 434,499 was rejected as tampered with when it is simply an unusual, valid block mined while SegWit was being signalled, which left indexers retrying it forever; and the proxy kept a copy of this node's cookie from when it started, so after this node restarted it rejected every request its dependents made.\n- Fewer moving parts, no loss of platform support: the official image covers the same three architectures, and it does not carry the BLAKE2b header handling this chain has no use for.`,
    de_DE: `- Runs the official Start9 build of the RPC proxy again, now that the fixes this node needed have been released upstream.\n- **Nothing changes in how this node behaves.** The previous release already carried both fixes; it carried them as our own build of the proxy, because upstream had not cut a release with them yet. Upstream v0.8.1 is tagged at exactly that merge, so this swaps back to the official image for the same code.\n- For reference, the two faults those fixes address, both of which stop a pruned node serving history to anything that depends on it: block 434,499 was rejected as tampered with when it is simply an unusual, valid block mined while SegWit was being signalled, which left indexers retrying it forever; and the proxy kept a copy of this node's cookie from when it started, so after this node restarted it rejected every request its dependents made.\n- Fewer moving parts, no loss of platform support: the official image covers the same three architectures, and it does not carry the BLAKE2b header handling this chain has no use for.`,
    pl_PL: `- Runs the official Start9 build of the RPC proxy again, now that the fixes this node needed have been released upstream.\n- **Nothing changes in how this node behaves.** The previous release already carried both fixes; it carried them as our own build of the proxy, because upstream had not cut a release with them yet. Upstream v0.8.1 is tagged at exactly that merge, so this swaps back to the official image for the same code.\n- For reference, the two faults those fixes address, both of which stop a pruned node serving history to anything that depends on it: block 434,499 was rejected as tampered with when it is simply an unusual, valid block mined while SegWit was being signalled, which left indexers retrying it forever; and the proxy kept a copy of this node's cookie from when it started, so after this node restarted it rejected every request its dependents made.\n- Fewer moving parts, no loss of platform support: the official image covers the same three architectures, and it does not carry the BLAKE2b header handling this chain has no use for.`,
    fr_FR: `- Runs the official Start9 build of the RPC proxy again, now that the fixes this node needed have been released upstream.\n- **Nothing changes in how this node behaves.** The previous release already carried both fixes; it carried them as our own build of the proxy, because upstream had not cut a release with them yet. Upstream v0.8.1 is tagged at exactly that merge, so this swaps back to the official image for the same code.\n- For reference, the two faults those fixes address, both of which stop a pruned node serving history to anything that depends on it: block 434,499 was rejected as tampered with when it is simply an unusual, valid block mined while SegWit was being signalled, which left indexers retrying it forever; and the proxy kept a copy of this node's cookie from when it started, so after this node restarted it rejected every request its dependents made.\n- Fewer moving parts, no loss of platform support: the official image covers the same three architectures, and it does not carry the BLAKE2b header handling this chain has no use for.`,
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
