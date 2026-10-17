import {
  archivalMin,
  bitcoinConfFile,
  defaultDatacarriercost,
  defaultDbbatchsize,
  defaultDbcache,
  diskUsage,
  minPrune,
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
      zmqEnabled: true,
      blockfilters: { blockfilterindex: true },
      dbcache: defaultDbcache(),
      dbbatchsize: defaultDbbatchsize(),
      natpmp: false,
      // Written rather than left to the binary's own default (true for series
      // 31) so the choice belongs to this install and survives a series that
      // changes it. Only on install: an existing node keeps its bitcoin.conf.
      rejecttokens: true,
      datacarriercost: defaultDatacarriercost,
      prune: (await diskUsage()).total < archivalMin ? minPrune : 0,
      raw: {
        i2psam: i2PSamAddress,
      },
    })
  } else {
    await bitcoinConfFile.merge(effects, {})
  }
})
