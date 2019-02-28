const {uuidv4} = require('../uuid')
const R = require('ramda')

const {
  getProp,
  getUuid,
} = require('./surveyUtils')

const taxonomyPropKeys = {
  name: 'name',
  vernacularLanguageCodes: 'vernacularLanguageCodes',
}

const taxonPropKeys = {
  code: 'code',
  family: 'family',
  genus: 'genus',
  scientificName: 'scientificName',
  vernacularNames: 'vernacularNames',
  vernacularNameUuid: 'vernacularNameUuid',
}

const vernacularNamePropKeys = {
  name: 'name',
  lang: 'lang'
}

const unlistedCode = 'UNL'
const unknownCode = 'UNK'

// ====== CREATE
const newTaxonomy = (props = {}) => ({
  uuid: uuidv4(),
  props,
})

const newTaxon = (taxonomyUuid, code, family, genus, scientificName, vernacularNames = {}) => ({
  uuid: uuidv4(),
  taxonomyUuid,
  props: {
    [taxonPropKeys.code]: code,
    [taxonPropKeys.family]: family,
    [taxonPropKeys.genus]: genus,
    [taxonPropKeys.scientificName]: scientificName,
    [taxonPropKeys.vernacularNames]: vernacularNames
  },
})

// ====== READ
const getTaxonCode = getProp(taxonPropKeys.code, '')

const getTaxonVernacularNames = getProp(taxonPropKeys.vernacularNames, {})

const getTaxonVernacularName = lang => R.pipe(
  getTaxonVernacularNames,
  R.prop(lang),
)

module.exports = {
  taxonomyPropKeys,
  taxonPropKeys,
  vernacularNamePropKeys,
  unlistedCode,
  unknownCode,

  //CREATE
  newTaxonomy,
  newTaxon,

  //READ
  getUuid,
  getTaxonomyName: getProp(taxonomyPropKeys.name, ''),
  getTaxonomyVernacularLanguageCodes: getProp(taxonomyPropKeys.vernacularLanguageCodes, []),
  getTaxonCode,
  getTaxonFamily: getProp(taxonPropKeys.family, ''),
  getTaxonGenus: getProp(taxonPropKeys.genus, ''),
  getTaxonScientificName: getProp(taxonPropKeys.scientificName, ''),
  getTaxonVernacularNames,
  getTaxonVernacularName,
  getTaxonVernacularNameUuid: getProp(taxonPropKeys.vernacularNameUuid),
  isUnlistedTaxon: R.pipe(getTaxonCode, R.equals(unlistedCode)),
  isUnknownTaxon: R.pipe(getTaxonCode, R.equals(unknownCode)),
}