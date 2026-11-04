import { FileHelper, VersionInfo, z } from '@start9labs/start-sdk'
import { rm } from 'fs/promises'
import { bitcoinConfFile, toBitcoinConf } from '../fileModels/bitcoin.conf'

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

export const current = VersionInfo.of({
  // #knotsprerdts is this package's flavor and never changes (Datum (SHA256)
  // Companion depends on >=#knotsprerdts:29.3:25). 31.2 is the Bitcoin Core base
  // of the installed Bitcoin Knots SHA256 release; the trailing number is this
  // package's own revision.
  version: '#knotsprerdts:31.2:0',
  releaseNotes: {
    en_US: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), on Bitcoin Core 31.2. This is revision 0 of the 31.2 package.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031`,
    es_ES: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), on Bitcoin Core 31.2. This is revision 0 of the 31.2 package.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031`,
    de_DE: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), on Bitcoin Core 31.2. This is revision 0 of the 31.2 package.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031`,
    pl_PL: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), on Bitcoin Core 31.2. This is revision 0 of the 31.2 package.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031`,
    fr_FR: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), on Bitcoin Core 31.2. This is revision 0 of the 31.2 package.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031`,
  },
  migrations: {
    // From this package's own 29.3 releases: the same chain, so the datadir is
    // kept; only the expiry their Other Settings form wrote is dropped.
    up: async ({ effects }) => {
      await rewriteConfRaw(effects)
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
