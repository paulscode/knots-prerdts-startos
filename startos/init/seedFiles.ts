import {
  bitcoinConfFile,
  defaultDatacarriercost,
  defaultDbbatchsize,
  defaultDbcache,
  defaultPruneMib,
} from '../fileModels/bitcoin.conf'
import { i2pdConfFile } from '../fileModels/i2pd.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { i2PSamAddress } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (!kind) return

  // install, update, restore
  await storeJson.merge(effects, {})
  await i2pdConfFile.merge(effects, {})

  if (kind === 'install') {
    await bitcoinConfFile.merge(effects, {
      // Cleared rather than left unwritten, so a fresh install and one that
      // upgraded into this version read the same. They did not: this seed runs on
      // install only, so a fresh install had ZeroMQ on and exported two extra
      // interfaces while an upgraded one had neither.
      zmqEnabled: false,
      blockfilters: { blockfilterindex: true },
      dbcache: defaultDbcache(),
      dbbatchsize: defaultDbbatchsize(),
      natpmp: false,
      datacarriercost: defaultDatacarriercost,
      // Pruned on every fresh install, where the official package this forks
      // prunes only on a small disk. This node is a companion meant to run
      // beside your main one, so a second full copy of the same chain is the
      // outcome almost nobody wants. Pruning costs a dependent nothing, because
      // main.ts runs btc-rpc-proxy in front of the node whenever this is
      // non-zero. Existing installs keep whatever they already have.
      prune: defaultPruneMib,
      raw: {
        i2psam: i2PSamAddress,
      },
    })
  } else {
    await bitcoinConfFile.merge(effects, {})
  }
})
