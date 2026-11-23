// Run with: npm test  (node --experimental-strip-types --test test/)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { snapshotBlockedByIndex as blocked } from '../startos/snapshotGuard.ts'

test('pruned with an index blocks the snapshot action (bitcoin/bitcoin#36939)', () => {
  assert.equal(blocked({ prune: 550, blockfilterindex: 'basic' }), true)
  assert.equal(blocked({ prune: 550, blockfilterindex: true }), true)
  assert.equal(blocked({ prune: 10000, coinstatsindex: true }), true)
})

test('unpruned, or pruned without either index, is allowed', () => {
  assert.equal(
    blocked({ prune: 0, blockfilterindex: 'basic', coinstatsindex: true }),
    false,
  )
  assert.equal(blocked({ prune: 550 }), false)
  assert.equal(
    blocked({ prune: 550, blockfilterindex: false, coinstatsindex: false }),
    false,
  )
  assert.equal(blocked(null), false)
})
