import { assert, expect } from 'chai'

import jsep from '@core/expressionParser/helpers/jsep'
import { getWherePreparedStatement } from '@common/surveyRdb/dataFilter'

const goodExpressions = [
  { q: '1', r: { clause: '$/_0/', params: { _0: '1' } } },
  { q: '1 / 1', r: { clause: '$/_0/ / $/_1/', params: { _0: '1', _1: '1' } } },
  {
    q: '1 + 1 == 2',
    r: {
      clause: '$/_0/ + $/_1/ IS NOT DISTINCT FROM $/_2/',
      params: { _0: '1', _1: '1', _2: '2' },
    },
  },
  { q: 'a', r: { clause: '$/_0:name/', params: { _0: 'a' } } },
  { q: '-a', r: { clause: '- $/_0:name/', params: { _0: 'a' } } },
  {
    q: 'a == 1',
    r: {
      clause: '$/_0:name/ IS NOT DISTINCT FROM $/_1/',
      params: { _0: 'a', _1: '1' },
    },
  },
  {
    q: "a != 'a'",
    r: {
      clause: '$/_0:name/ IS DISTINCT FROM $/_1/',
      params: { _0: 'a', _1: "'a'" },
    },
  },
  {
    q: 'a != "a"',
    r: {
      clause: '$/_0:name/ IS DISTINCT FROM $/_1/',
      params: { _0: 'a', _1: '"a"' },
    },
  },
  {
    q: "a == 1 && b != 'b'",
    r: {
      clause: '$/_0:name/ IS NOT DISTINCT FROM $/_1/ AND $/_2:name/ IS DISTINCT FROM $/_3/',
      params: { _0: 'a', _1: '1', _2: 'b', _3: "'b'" },
    },
  },

  // This is complicated because logical OR has special semantics:
  {
    q: "(a == 1 && b != 'b') || c > 1",
    r: {
      clause:
        'CASE\n  WHEN (($/_0:name/ IS NOT DISTINCT FROM $/_1/ AND $/_2:name/ IS DISTINCT FROM $/_3/)) IS NULL AND ($/_4:name/ > $/_5/) IS NULL\n  THEN NULL\n  ELSE coalesce(($/_0:name/ IS NOT DISTINCT FROM $/_1/ AND $/_2:name/ IS DISTINCT FROM $/_3/), false) OR coalesce($/_4:name/ > $/_5/, false)\nEND',
      params: { _0: 'a', _1: '1', _2: 'b', _3: "'b'", _4: 'c', _5: '1' },
    },
  },

  {
    q: 'min(1,2,a) < max(10/a,pow(2+a,3-a))',
    r: {
      clause:
        'least($/_0/, $/_1/, $/_2:name/) < greatest($/_3/ / $/_4:name/, pow($/_5/ + $/_6:name/, $/_7/ - $/_8:name/))',
      params: {
        _0: '1',
        _1: '2',
        _2: 'a',
        _3: '10',
        _4: 'a',
        _5: '2',
        _6: 'a',
        _7: '3',
        _8: 'a',
      },
    },
  },
]

const badExpressions = [
  { q: '1 z 1' }, // Compound expressions are not converted
  { q: 'a b c d e' }, // Compound expressions are not converted

  // Unknown operators raise an error:
  { q: '1 & 1' },
]

describe('dataFilter test', () => {
  for (const { q, r } of goodExpressions) {
    it(q, () => {
      const ps = getWherePreparedStatement(jsep(q))
      assert.deepEqual(ps, r)
    })
  }

  for (const { q } of badExpressions) {
    it(q, () => {
      const ps = () => getWherePreparedStatement(jsep(q))
      expect(ps).to.throw()
    })
  }
})
