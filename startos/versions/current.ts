import { FileHelper, VersionInfo, z } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile, toBitcoinConf } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'

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
 * Bitcoin Knots SHA256 32.x raised the -datacarriercost default from 1 to 2. Installs
 * up to 31.x wrote 1 into bitcoin.conf, which cannot be told apart from a deliberate
 * choice, so a stored 1 becomes 2 once, on the first update to a 32.x package
 * (decisions/0027, as in the drop-in package; the release notes say how to set 1
 * again). The store.json flag makes it run once: a 1 set afterwards stays.
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

/**
 * This node is Bitcoin Core 32.x underneath, so its datadir carries two
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
 * Revisions up to #knotsprerdts:31.1:4 (and the 29.3 releases) wrote bitcoin.conf with FileHelper.ini's quoting
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
].join(' ')

export const current = VersionInfo.of({
  // #knotsprerdts is this package's flavor and never changes (Datum (SHA256)
  // Companion depends on >=#knotsprerdts:29.3:25). 32.1 is the Bitcoin Core base
  // of the installed Bitcoin Knots SHA256 release; the trailing number is this
  // package's own revision.
  version: '#knotsprerdts:32.1:0',
  releaseNotes: {
    en_US: notes,
    es_ES: notes,
    de_DE: notes,
    pl_PL: notes,
    fr_FR: notes,
  },
  migrations: {
    // From this package's own 29.3 releases: the same chain, so the datadir is
    // kept; only the expiry their Other Settings form wrote is dropped.
    up: async ({ effects }) => {
      await rewriteConfRaw(effects)
      await dropInheritedSoftwareExpiry(effects)
      await raiseDatacarriercost32(effects)
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
