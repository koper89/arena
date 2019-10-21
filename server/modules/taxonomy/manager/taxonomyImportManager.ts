const R = require('ramda')

const BatchPersister = require('../../../db/batchPersister')

const Taxonomy = require('../../../../core/survey/taxonomy')
const Taxon = require('../../../../core/survey/taxon')
const Validation = require('../../../../core/validation/validation')

const TaxonomyManager = require('./taxonomyManager')

const createPredefinedTaxa = (taxonomy) => [
  Taxon.newTaxon(Taxonomy.getUuid(taxonomy), Taxon.unknownCode, 'Unknown', 'Unknown', 'Unknown'),
  Taxon.newTaxon(Taxonomy.getUuid(taxonomy), Taxon.unlistedCode, 'Unlisted', 'Unlisted', 'Unlisted')
]

class TaxonomyImportManager {
  constructor (user, surveyId, vernacularLanguageCodes) {
    this.user = user
    this.surveyId = surveyId
    this.vernacularLanguageCodes = vernacularLanguageCodes

    this.batchPersister = new BatchPersister(this.taxaInsertHandler.bind(this))
    this.insertedCodes = {} //cache of inserted taxa codes
  }

  async addTaxonToInsertBuffer (taxon, t) {
    await this.batchPersister.addItem(R.omit([Validation.keys.validation], taxon), t)
    this.insertedCodes[Taxon.getCode(taxon)] = true
  }

  async taxaInsertHandler (items, t) {
    await TaxonomyManager.insertTaxa(this.surveyId, items, this.user, t)
  }

  async finalizeImport (taxonomy, t) {
    const { user, surveyId } = this

    await this.batchPersister.flush(t)

    //insert predefined taxa (UNL - UNK)
    const predefinedTaxaToInsert = R.pipe(
      createPredefinedTaxa,
      R.filter(taxon => !this.insertedCodes[Taxon.getCode(taxon)])
    )(taxonomy)

    if (!R.isEmpty(predefinedTaxaToInsert)) {
      await TaxonomyManager.insertTaxa(surveyId, predefinedTaxaToInsert, user, t)
    }

    //set vernacular lang codes in taxonomy
    await TaxonomyManager.updateTaxonomyProp(user, surveyId, Taxonomy.getUuid(taxonomy),
      Taxonomy.keysProps.vernacularLanguageCodes, this.vernacularLanguageCodes, t)
  }
}

module.exports = TaxonomyImportManager