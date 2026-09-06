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
  version: '#knotsprerdts:29.3:29',
  releaseNotes: {
    en_US: `- Fixes two faults in the RPC proxy this node runs when it is pruned. The proxy is what lets a pruned node still answer for blocks it has dropped, by fetching them from the network, so anything that depends on this node for history goes through it. Either fault stops that dependent dead, and neither clears on its own.\n- **Block 434,499.** Every fetch of history stopped at that block and stayed there. It was mined in 2016 while SegWit was still being signalled, which gives it an unusual but perfectly valid shape, and the proxy mistook that shape for a block a peer had tampered with. Since every peer returns the same block, every peer looked like it was lying, so the block was never fetched. An indexer such as Electrs sat and retried it forever while reporting no progress.\n- **After a restart.** The proxy read this node's cookie once when it started and kept that copy. Bitcoin writes a new cookie every time it starts, so from this node's next restart the proxy rejected every request its dependents made. That is self-inflicted by any ordinary update, and restarting the dependent did not help, because the stale copy was in the proxy.\n- **Nothing is lost and nothing resyncs.** A dependent that was stuck picks up where it stopped.\n- Both faults are upstream rather than anything specific to this package, and both fixes have been sent upstream as Start9Labs/btc-rpc-proxy#34. This release runs our build of the proxy until that lands; it is the same three architectures as the Start9 image.`,
    es_ES: `- Fixes two faults in the RPC proxy this node runs when it is pruned. The proxy is what lets a pruned node still answer for blocks it has dropped, by fetching them from the network, so anything that depends on this node for history goes through it. Either fault stops that dependent dead, and neither clears on its own.\n- **Block 434,499.** Every fetch of history stopped at that block and stayed there. It was mined in 2016 while SegWit was still being signalled, which gives it an unusual but perfectly valid shape, and the proxy mistook that shape for a block a peer had tampered with. Since every peer returns the same block, every peer looked like it was lying, so the block was never fetched. An indexer such as Electrs sat and retried it forever while reporting no progress.\n- **After a restart.** The proxy read this node's cookie once when it started and kept that copy. Bitcoin writes a new cookie every time it starts, so from this node's next restart the proxy rejected every request its dependents made. That is self-inflicted by any ordinary update, and restarting the dependent did not help, because the stale copy was in the proxy.\n- **Nothing is lost and nothing resyncs.** A dependent that was stuck picks up where it stopped.\n- Both faults are upstream rather than anything specific to this package, and both fixes have been sent upstream as Start9Labs/btc-rpc-proxy#34. This release runs our build of the proxy until that lands; it is the same three architectures as the Start9 image.`,
    de_DE: `- Fixes two faults in the RPC proxy this node runs when it is pruned. The proxy is what lets a pruned node still answer for blocks it has dropped, by fetching them from the network, so anything that depends on this node for history goes through it. Either fault stops that dependent dead, and neither clears on its own.\n- **Block 434,499.** Every fetch of history stopped at that block and stayed there. It was mined in 2016 while SegWit was still being signalled, which gives it an unusual but perfectly valid shape, and the proxy mistook that shape for a block a peer had tampered with. Since every peer returns the same block, every peer looked like it was lying, so the block was never fetched. An indexer such as Electrs sat and retried it forever while reporting no progress.\n- **After a restart.** The proxy read this node's cookie once when it started and kept that copy. Bitcoin writes a new cookie every time it starts, so from this node's next restart the proxy rejected every request its dependents made. That is self-inflicted by any ordinary update, and restarting the dependent did not help, because the stale copy was in the proxy.\n- **Nothing is lost and nothing resyncs.** A dependent that was stuck picks up where it stopped.\n- Both faults are upstream rather than anything specific to this package, and both fixes have been sent upstream as Start9Labs/btc-rpc-proxy#34. This release runs our build of the proxy until that lands; it is the same three architectures as the Start9 image.`,
    pl_PL: `- Fixes two faults in the RPC proxy this node runs when it is pruned. The proxy is what lets a pruned node still answer for blocks it has dropped, by fetching them from the network, so anything that depends on this node for history goes through it. Either fault stops that dependent dead, and neither clears on its own.\n- **Block 434,499.** Every fetch of history stopped at that block and stayed there. It was mined in 2016 while SegWit was still being signalled, which gives it an unusual but perfectly valid shape, and the proxy mistook that shape for a block a peer had tampered with. Since every peer returns the same block, every peer looked like it was lying, so the block was never fetched. An indexer such as Electrs sat and retried it forever while reporting no progress.\n- **After a restart.** The proxy read this node's cookie once when it started and kept that copy. Bitcoin writes a new cookie every time it starts, so from this node's next restart the proxy rejected every request its dependents made. That is self-inflicted by any ordinary update, and restarting the dependent did not help, because the stale copy was in the proxy.\n- **Nothing is lost and nothing resyncs.** A dependent that was stuck picks up where it stopped.\n- Both faults are upstream rather than anything specific to this package, and both fixes have been sent upstream as Start9Labs/btc-rpc-proxy#34. This release runs our build of the proxy until that lands; it is the same three architectures as the Start9 image.`,
    fr_FR: `- Fixes two faults in the RPC proxy this node runs when it is pruned. The proxy is what lets a pruned node still answer for blocks it has dropped, by fetching them from the network, so anything that depends on this node for history goes through it. Either fault stops that dependent dead, and neither clears on its own.\n- **Block 434,499.** Every fetch of history stopped at that block and stayed there. It was mined in 2016 while SegWit was still being signalled, which gives it an unusual but perfectly valid shape, and the proxy mistook that shape for a block a peer had tampered with. Since every peer returns the same block, every peer looked like it was lying, so the block was never fetched. An indexer such as Electrs sat and retried it forever while reporting no progress.\n- **After a restart.** The proxy read this node's cookie once when it started and kept that copy. Bitcoin writes a new cookie every time it starts, so from this node's next restart the proxy rejected every request its dependents made. That is self-inflicted by any ordinary update, and restarting the dependent did not help, because the stale copy was in the proxy.\n- **Nothing is lost and nothing resyncs.** A dependent that was stuck picks up where it stopped.\n- Both faults are upstream rather than anything specific to this package, and both fixes have been sent upstream as Start9Labs/btc-rpc-proxy#34. This release runs our build of the proxy until that lands; it is the same three architectures as the Start9 image.`,
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
