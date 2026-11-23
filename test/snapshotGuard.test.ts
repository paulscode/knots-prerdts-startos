// Run with: npm test  (node --experimental-strip-types --test test/)
// The guard reads bitcoinConfFile.read(), which returns the FORM shape (fileToForm): the block filter index is
// blockfilters.blockfilterindex, not a top-level key. These cases use that shape on purpose.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { snapshotBlockedByIndex as blocked } from '../startos/snapshotGuard.ts'

test('pruned with an index blocks the snapshot action (bitcoin/bitcoin#36939)', () => {
  assert.equal(
    blocked({ prune: 550, blockfilters: { blockfilterindex: true } }),
    true,
  )
  assert.equal(
    blocked({ prune: 5000, blockfilters: { blockfilterindex: true } }),
    true,
  )
  assert.equal(blocked({ prune: 10000, coinstatsindex: true }), true)
})

test('unpruned, or pruned without either index, is allowed', () => {
  assert.equal(
    blocked({
      prune: 0,
      coinstatsindex: true,
      blockfilters: { blockfilterindex: true },
    }),
    false,
  )
  assert.equal(blocked({ prune: 550 }), false)
  assert.equal(
    blocked({
      prune: 550,
      coinstatsindex: false,
      blockfilters: { blockfilterindex: false },
    }),
    false,
  )
  assert.equal(blocked(null), false)
})
