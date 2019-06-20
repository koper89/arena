const axios = require('axios')
const jwkToPem = require('jwk-to-pem')
const jwt = require('jsonwebtoken')
const R = require('ramda')

const region = 'eu-west-1'
const poolId = process.env.COGNITO_USER_POOL_ID
const issuer = `https://cognito-idp.${region}.amazonaws.com/${poolId}`

const verificationOptions = {
  algorithms: ['RS256'],
  issuer,
}

// Error handling
const handleError = err => {
  console.error(err)
}

const getKeys = async (region, poolId) => {
  const jwksUrl = issuer + '/.well-known/jwks.json'
  const response = await axios.get(jwksUrl)
  return response.data.keys
}

// Index keys by "kid", and convert to PEM
const indexKeys = keyList => keyList.reduce((keys, jwk) => {
  keys[jwk.kid] = jwkToPem(jwk)
  return keys
}, {})

const decode = token => jwt.decode(token, { complete: true })

// Now we need to decode our token, to find the verification key
const findVerificationKey = token => pemList => {
  const decoded = decode(token)
  return pemList[decoded.header.kid]
}

// Verify our token
const verifyToken = token => pem =>
  jwt.verify(token, pem, verificationOptions)

const validate = async (token) => {
  const keys = await getKeys(region, poolId)

  try {
    return R.pipe(
      indexKeys,
      findVerificationKey(token),
      verifyToken(token),
      // checkTokenToUse,
    )(keys)
  } catch (err) {
    handleError(err)
  }
}

// const doSomething = console.info

// const validate_ = (token, doSomething) => {
//   getKeys(region, poolId)
//     .then(indexKeys)
//     .then(findVerificationKey(token))
//     .then(verifyToken(token))
//     // .then(checkTokenUse)
//     // .then(doSomething)
//     // .catch(handleError)
// }

const token = 'xxx.zzz.ttt'

validate(token)

module.exports = {
  decode,
  validate
}