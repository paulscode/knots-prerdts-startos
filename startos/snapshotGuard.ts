/**
 * Bitcoin Core 32.1 bug (bitcoin/bitcoin#36939, also in Knots SHA256 32.1): a PRUNED node running blockfilterindex or
 * coinstatsindex that loads a UTXO snapshot dies when background validation finishes (the index's saved position
 * stays behind while pruning deletes the blocks it needs). Until that is fixed upstream, the snapshot action is not
 * offered in that combination. Pure function so test/ can cover it without the SDK.
 */
// Shape of bitcoinConfFile.read(): the FORM, not the raw file. In the form the block filter index sits at
// blockfilters.blockfilterindex (fileToForm in fileModels/bitcoin.conf.ts); prune and coinstatsindex are top-level.
export type SnapshotConf = {
  prune?: number | null
  coinstatsindex?: boolean | null
  blockfilters?: { blockfilterindex?: boolean | null } | null
}

export const snapshotBlockedByIndex = (
  conf: SnapshotConf | null | undefined,
): boolean =>
  !!conf &&
  !!conf.prune &&
  (!!conf.blockfilters?.blockfilterindex || !!conf.coinstatsindex)
