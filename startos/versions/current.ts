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

export const current = VersionInfo.of({
  // #knotssha — the flavor is letters only (StartOS's exver grammar), so the
  // product name "knots-sha256" cannot be used verbatim. 31.2 is the Bitcoin
  // Core base of the installed release; the Knots SHA256 series date lives in
  // the VERSION build-arg in startos/manifest/index.ts, not here. The trailing
  // number is this package's own revision and bumps on every wrapper release.
  version: '#knotssha:31.2:1',
  releaseNotes: {
    en_US: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), the final release, on Bitcoin Core 31.2. This is revision 1 of the 31.2 package.\n- Stands in for Bitcoin Core's package 31.2:1, so services that require it, such as Electrs 0.12.0:7, can be installed and updated.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.2 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package. Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.`,
    es_ES: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), the final release, on Bitcoin Core 31.2. This is revision 1 of the 31.2 package.\n- Stands in for Bitcoin Core's package 31.2:1, so services that require it, such as Electrs 0.12.0:7, can be installed and updated.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.2 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package. Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.`,
    de_DE: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), the final release, on Bitcoin Core 31.2. This is revision 1 of the 31.2 package.\n- Stands in for Bitcoin Core's package 31.2:1, so services that require it, such as Electrs 0.12.0:7, can be installed and updated.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.2 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package. Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.`,
    pl_PL: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), the final release, on Bitcoin Core 31.2. This is revision 1 of the 31.2 package.\n- Stands in for Bitcoin Core's package 31.2:1, so services that require it, such as Electrs 0.12.0:7, can be installed and updated.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.2 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package. Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.`,
    fr_FR: `- Bitcoin Knots SHA256 31.2 (31.2.knots-sha256.20261031), the final release, on Bitcoin Core 31.2. This is revision 1 of the 31.2 package.\n- Stands in for Bitcoin Core's package 31.2:1, so services that require it, such as Electrs 0.12.0:7, can be installed and updated.\n- New spam filters, on by default: data hidden in pushes that are immediately dropped (bare envelopes), fake public keys that carry data (BPUB), and data in script branches that can never run. Counterparty transactions are rejected along with other token transactions under Reject Tokens.\n- The data carrier cost now also lowers a transaction's priority for mining and raises it for eviction, not only at admission to the mempool.\n- Bitcoin now runs Block Notify commands that contain \`=\` or \`;\` or start with \`[\` as entered, and settings added to bitcoin.conf by hand keep their values as written, as in Bitcoin Core's package 31.1:27. Block Notify can no longer contain \`#\`, and a command that did is removed.\n- Built on start-sdk 3.1.1.\n- Bitcoin Knots' policy patch series maintained on top of Bitcoin Core 31.2 for the SHA256 chain, consensus-identical to Bitcoin Core, as a flavor of the bitcoind package. Full release notes: https://github.com/paulscode/knots-sha256/releases/tag/v31.2.knots-sha256.20261031\n- Switch to it from Bitcoin Core, Bitcoin Knots (pre-RDTS), or Bitcoin Knots (Legacy) as carried over from StartOS 0.3.5.1, and keep your synced chain. Switching from Bitcoin Core resets the mempool settings so this node's policy defaults apply. Bitcoin Knots (RDTS) follows a different chain and can be switched neither to nor from.\n- Switching back to Bitcoin Core 30 or older, or to Bitcoin Knots (pre-RDTS), removes the fee estimates, and for Bitcoin Core 29 or older and Bitcoin Knots (pre-RDTS) also the coinstats index, because the older node cannot read them; both are rebuilt.`,
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
      // the data upgrade to a 31.x datadir is bitcoind's own. `down` (leaving
      // for Core) resets the mempool config again and removes what the older
      // binary cannot read.
      // Newest first: given a version range rather than an exact target, the SDK's
      // version graph takes the first matching edge, and the gentlest cleanup must win.
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
  // every 31.1 floor); see UPDATING.md.
  //
  // Claim a Core revision only when this package offers every dependent-facing
  // feature up to it. At 31.1:25 those are: REST on the bridge-only `rpc-local`
  // binding with btc-rpc-proxy v0.8.2 fronting `rpc` (:17/:18; electrs 0.12
  // requires >=31.1:17 and reads the node over REST), the dependent-enabled
  // wallet (:19), and coinbase block weight that mining services can reserve
  // (:25); Block Notify written raw (:27); Bitcoin Core 31.2 (31.2:0) and the
  // Background Validation health check electrs 0.12.0:7 requires (31.2:1). Host
  // ids, interface ids and ports are identical to Core's.
  .satisfies('31.2:1')
  .satisfies('30.3:16')
  .satisfies('29.4:16')
  .satisfies('28.4:29')
