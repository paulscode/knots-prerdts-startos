import { FileHelper, IMPOSSIBLE, VersionInfo, z } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile, toBitcoinConf } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'

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

/**
 * Bitcoin Knots SHA256 32.x raised the -datacarriercost default from 1 to 2. Installs
 * up to 31.x wrote 1 into bitcoin.conf, which cannot be told apart from a deliberate
 * choice, so a stored 1 becomes 2 once, on the first update to a 32.x package
 * (decisions/0027, as decisions/0026 does for Umbrel; the release notes say how to set
 * 1 again). The store.json flag makes it run once: a 1 set afterwards stays.
 */
async function raiseDatacarriercost32(
  effects: Parameters<typeof bitcoinConfFile.merge>[0],
) {
  const store = await storeJson.read().once()
  if (store?.datacarriercost32) return
  const conf = await bitcoinConfFile.read().once()
  if (conf?.datacarriercost === 1) {
    await bitcoinConfFile.merge(effects, { datacarriercost: 2 })
  }
  await storeJson.merge(effects, { datacarriercost32: true })
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

/**
 * Revisions up to #knotssha:31.1:4 wrote bitcoin.conf with FileHelper.ini's quoting
 * and escapes, which bitcoind keeps verbatim. Re-read such a file that way and rewrite
 * it raw, as Bitcoin Core's package does on its own upgrade to 31.1:27. Only on our own
 * upgrade path: a flavor switched over from may already write raw (Core 31.1:27+), and
 * re-reading a raw file as ini would cut a Block Notify command at its first \`;\`.
 */
async function rewriteConfRaw(
  effects: Parameters<typeof bitcoinConfFile.write>[0],
) {
  const conf = await FileHelper.ini(bitcoinConfFile.path, z.looseObject({}), {
    bracketedArray: false,
  })
    .read()
    .once()
  if (conf)
    await FileHelper.string(bitcoinConfFile.path).write(
      effects,
      toBitcoinConf(conf),
    )
}

const notes = [
  'Bitcoin Knots SHA256 32.1 rc1 (32.1.knots-sha256.20261113rc1), a release candidate for testing, on Bitcoin Core 32.1. This is revision 0 of the 32.1 package. Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v32.1.knots-sha256.20261113rc1',
  "Fixes Stop, updates and restarts that never finish. A status check that sent the node a request that never came back stayed at Starting from then on, and it also kept the service from stopping: the RPC proxy and I2P shut down, but the node itself was never asked to, so an update sat at Installing 80% and a restart of the server hung. Each check now gives up on a request after a minute and asks again, so it can no longer hold up a stop. This does not shorten the node's own shutdown, which still has its full 5 minutes to save its data.",
  'Before updating to this version, press Stop and wait until it shows Stopped. If it does not stop within 10 minutes, or a status check has been stuck at Starting for a long time, the version you are running has this problem: restart the server, and update once it is back up. If the restart also hangs, turn the server off and on again. The node recovers from that, though its next start can take longer while it catches up on what it had not yet saved.',
  'The Datacarrier Cost default is now 2: each byte of data counts as at least 2 virtual bytes, at admission to the mempool and for mining order, eviction and fee bumping. Earlier versions of this package wrote 1 into the settings at install, so a stored 1 becomes 2 once, on this update. To keep 1, set it again in Mempool Settings after the update; it then stays.',
  'New spam filters, on by default: output hashes and keys that are all printable text, witness items a script drops without using them, and multisig keys that no signature proves now count as data. Payments to future witness versions are no longer relayed (Accept Unknown Witness is off by default).',
  'Bitcoin Core 32.1 underneath. Maximum Connections now defaults to 200 on a new install; a value already saved in Peer Settings is kept.',
  "Stands in for Bitcoin Core's package 31.2:1, as revision 31.2:1 of this package did, so services that require it, such as Electrs 0.12.0:7, keep working.",
  "Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.",
  'Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.',
].join(' ')

export const current = VersionInfo.of({
  // #knotssha — the flavor is letters only (StartOS's exver grammar), so the
  // product name "knots-sha256" cannot be used verbatim. 32.1 is the Bitcoin
  // Core base of the installed release; the Knots SHA256 series date lives in
  // the VERSION build-arg in startos/manifest/index.ts, not here. The trailing
  // number is this package's own revision and bumps on every wrapper release.
  version: '#knotssha:32.1:0',
  releaseNotes: {
    en_US: notes,
    es_ES: notes,
    de_DE: notes,
    pl_PL: notes,
    fr_FR: notes,
  },
  migrations: {
    up: async ({ effects }) => {
      await rewriteConfRaw(effects)
      await raiseDatacarriercost32(effects)
    },
    down: IMPOSSIBLE,
    other: {
      // Bitcoin Core ↔ #knotssha, keyed by Core major series. `up` (arriving
      // from Core) resets the mempool config so Knots' policy defaults apply;
      // the data upgrade to a 32.x datadir is bitcoind's own. `down` (leaving
      // for Core) resets the mempool config again and removes what the older
      // binary cannot read.
      // Newest first: given a version range rather than an exact target, the SDK's
      // version graph takes the first matching edge, and the gentlest cleanup must win.
      // Bitcoin Core 32: no StartOS package yet (2026-11-15); the key is here so a later
      // one can be switched to and from. Same major as this node: nothing to clean up.
      ['^32']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^31']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
        },
        down: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
        },
      },
      ['^30']: {
        up: async ({ effects }) => {
          await bitcoinConfFile.merge(effects, mempoolReset)
          await dropInheritedSoftwareExpiry(effects)
          await raiseDatacarriercost32(effects)
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
          await raiseDatacarriercost32(effects)
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
          await raiseDatacarriercost32(effects)
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
          await raiseDatacarriercost32(effects)
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
          await raiseDatacarriercost32(effects)
        },
      },
    },
  },
})
  // The Bitcoin Core revisions this package stands in for when a dependent's
  // `versionRange` is evaluated: the official bitcoin-core-startos `version`
  // plus the `.satisfies(...)` it carries. Copied from Core 31.x at 31.2:1 on
  // 2026-11-01 (Core's own list no longer names a 31.1 revision: 31.2:1 is above
  // every 31.1 floor); see UPDATING.md. Kept at 31.2:1 for 32.1:0 (2026-11-15):
  // Core 31.x is at 31.2:3, but :2 is the move to start-sdk 4 (StartOS 0.4.1,
  // which this package does not require) and :3 IPv6 listeners, neither of which
  // a dependent relies on; there is no Core 32 package yet.
  //
  // Claim a Core revision only when this package offers every dependent-facing
  // feature up to it. At 31.1:25 those are: REST on the bridge-only `rpc-local`
  // binding with btc-rpc-proxy v0.8.2 fronting `rpc` (:17/:18; electrs 0.12
  // requires >=31.1:17 and reads the node over REST), the dependent-enabled
  // wallet (:19), and coinbase block weight that mining services can reserve
  // (:25); Block Notify written raw (:27); Bitcoin Core 31.2 (31.2:0) and the
  // Background Validation health check electrs 0.12.0:7 requires (31.2:1). Host
  // ids, interface ids and ports are identical to Core's.
  // 2026-11-20 (31.2:2, hotfix): Core's 31.2:4 publishes .cookie and prune in a
  // `public` volume that dependents mount alone (electrs 0.12.1:1, lnd
  // 0.21.8-beta:2 and mempool 3.3.2:7 require >=31.2:4 and mount it), and 31.2:5
  // is btc-rpc-proxy 0.8.3, which refuses fetched blocks with repeated
  // transactions. This package has both (proxy 0.8.4, as Core's 31.2:6), so it
  // claims 31.2:5 and the other lines' releases with the same layout, as Core's
  // 31.x list does. Core's 31.2:2 (start-sdk 4) and 31.2:3 (IPv6 listeners) are
  // not dependent-facing.
  .satisfies('31.2:5')
  .satisfies('30.4:4')
  .satisfies('29.5:4')
  .satisfies('28.4:42')
