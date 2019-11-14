import * as R from 'ramda'

import BatchPersister from '@server/db/batchPersister'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as Validation from '@core/validation/validation'

import * as TaxonomyManager from './taxonomyManager'

const createPredefinedTaxa = (taxonomy) => [
  Taxon.newTaxon(Taxonomy.getUuid(taxonomy), Taxon.unknownCode, 'Unknown', 'Unknown', 'Unknown'),
  Taxon.newTaxon(Taxonomy.getUuid(taxonomy), Taxon.unlistedCode, 'Unlisted', 'Unlisted', 'Unlisted')
]

export default class TaxonomyImportManager {

  constructor (user, surveyId, taxonomy, vernacularLanguageCodes, tx) {
    this.user = user
    this.surveyId = surveyId
    this.taxonomy = taxonomy
    this.vernacularLanguageCodes = vernacularLanguageCodes
    this.tx = tx

    this.batchPersisterInsert = new BatchPersister(async items => await TaxonomyManager.insertTaxa(this.surveyId, items, this.user, this.tx))
    this.batchPersisterUpdate = new BatchPersister(async items => await TaxonomyManager.updateTaxa(this.surveyId, items, this.user, this.tx))
    this.insertedCodes = {} //cache of inserted taxa codes
    this.existingUuidAndVernacularNamesByCode = null // existing taxon uuids and vernacular names (indexed by code)
  }

  async init () {
    this.existingUuidAndVernacularNamesByCode = await TaxonomyManager.fetchTaxonUuidAndVernacularNamesByCode(
      this.surveyId, Taxonomy.getUuid(this.taxonomy), true, this.tx)
  }

  async addTaxonToInsertBuffer (taxon, t) {
    const taxonExisting = this.existingUuidAndVernacularNamesByCode[Taxon.getCode(taxon)]
    if (taxonExisting) {
      const vernacularNamesUpdated = {
        ...Taxon.getVernacularNames(taxonExisting)
      }
      const taxonUpdated = {
        ...taxonExisting,
        [Taxon.keys.props]: {
          ...Taxon.getProps(taxonExisting),
          [Taxon.propKeys.scientificName]: Taxon.getScientificName(taxon),
          [Taxon.propKeys.vernacularNames]: vernacularNamesUpdated,
        }
      }
      await this.batchPersisterUpdate.addItem(R.omit([Validation.keys.validation], taxonUpdated), t)
    } else {
      await this.batchPersisterInsert.addItem(R.omit([Validation.keys.validation], taxon), t)
    }
    this.insertedCodes[Taxon.getCode(taxon)] = true
  }

  async finalizeImport (taxonomy, t) {
    const { user, surveyId } = this

    await this.batchPersisterInsert.flush(t)

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
      Taxonomy.keysProps.vernacularLanguageCodes, this.vernacularLanguageCodes, true, t)
  }
}
