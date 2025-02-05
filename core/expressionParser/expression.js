import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'

import jsep from './helpers/jsep'
import * as Evaluator from './helpers/evaluator'
import * as ExpressionUtils from './helpers/utils'

import { types } from './helpers/types'

export { types } from './helpers/types'
export { operators } from './helpers/operators'

export const modes = {
  json: 'json',
  sql: 'sql',
}

export const toString = (expr, exprMode = modes.json) => {
  const string = ExpressionUtils.toString(expr)

  return exprMode === modes.sql
    ? R.pipe(R.replace(/&&/g, 'AND'), R.replace(/\|\|/g, 'OR'), R.replace(/==/g, '='), R.replace(/!=/g, '!='))(string)
    : string
}

export const fromString = (string, exprMode = modes.json) => {
  const exprString =
    exprMode === modes.json
      ? string
      : R.pipe(
          R.replace(/AND/g, '&&'),
          R.replace(/OR/g, '||'),
          R.replace(/=/g, '=='),
          R.replace(/!==/g, '!='),
          R.replace(/>==/g, '>='),
          R.replace(/<==/g, '<='),
        )(string)

  return jsep(exprString)
}

export const evalString = (query, ctx) => Evaluator.evalExpression(fromString(query), ctx)

export const isValid = ExpressionUtils.isValid
export const getExpressionIdentifiers = Evaluator.getExpressionIdentifiers

// ====== Type checking

const isType = type => R.propEq('type', type)

// Return true if the nodeDef can be used in expressions and false otherwise
export const isValidExpressionType = nodeDef =>
  !NodeDef.isEntity(nodeDef) &&
  !NodeDef.isMultiple(nodeDef) &&
  !NodeDef.isCoordinate(nodeDef) &&
  !NodeDef.isFile(nodeDef)

export const isLiteral = isType(types.Literal)
export const isCompound = isType(types.Compound)
export const isBinary = isType(types.BinaryExpression)
export const isIdentifier = isType(types.Identifier)
export const isLogical = isType(types.LogicalExpression)

// ====== Instance creators

export const newLiteral = (value = null) => ({
  type: types.Literal,
  value,
  raw: value || '',
})

export const newIdentifier = (value = '') => ({
  type: types.Identifier,
  name: value,
})

export const newBinary = (left, right, operator = '') => ({
  type: types.BinaryExpression,
  operator,
  left,
  right,
})
