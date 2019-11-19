import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validation from '@core/validation/validation'
import { languageCodesISO636_2 } from '@core/app/languages'
import * as StringUtils from '@core/stringUtils'

import Job from '@server/job/job'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import TaxonomyImportManager from '@server/modules/taxonomy/manager/taxonomyImportManager'

import * as CSVReader from '@server/utils/file/csvReader'

const speciesFilesPath = 'species/'

/**
 * Inserts a taxonomy for each taxonomy in the Collect survey.
 * Saves the list of inserted taxonomies in the "taxonomies" context property
 */
export default class TaxonomiesImportJob extends Job {

  constructor (params) {
    super('TaxonomiesImportJob', params)

    this.taxonomyCurrent = null //current taxonomy being imported
    this.taxonomyImportManager = null //import manager associated to the current taxonomy
    this.rowsByCode = {} //used to detect duplicate codes
    this.rowsByScientificName = {} //used to detect duplicate scientific names
    this.currentRow = 0 //current file row number
  }

  async execute (tx) {
    const { collectSurveyFileZip } = this.context

    const taxonomies = []

    const speciesFileNames = collectSurveyFileZip.getEntryNames(speciesFilesPath)

    for (const speciesFileName of speciesFileNames) {
      if (this.isCanceled())
        break

      await this.importTaxonomyFromSpeciesFile(speciesFileName, tx)

      if (!this.isRunning())
        break

      taxonomies.push(this.taxonomyCurrent)
      this.taxonomyCurrent = null
      this.taxonomyImportManager = null

      this.incrementProcessedItems()
    }

    this.setContext({ taxonomies })
  }

  async importTaxonomyFromSpeciesFile (speciesFileName, tx) {
    const { collectSurveyFileZip, surveyId } = this.context

    // 1. reset duplicate values indexes
    this.rowsByCode = {}
    this.rowsByScientificName = {}

    // 2. insert taxonomy
    const taxonomyName = speciesFileName.substring(0, speciesFileName.length - 4)

    const taxonomyParam = Taxonomy.newTaxonomy({
      [Taxonomy.keysProps.name]: taxonomyName,
    })
    this.taxonomyCurrent = await TaxonomyManager.insertTaxonomy(this.user, surveyId, taxonomyParam, true, tx)
    const taxonomyUuid = Taxonomy.getUuid(this.taxonomyCurrent)

    // 3. parse CSV file
    const speciesFileStream = await collectSurveyFileZip.getEntryStream(`${speciesFilesPath}${speciesFileName}`)

    const totalPrevious = this.total

    await CSVReader.createReaderFromStream(
      speciesFileStream,
      headers => this.onHeaders(headers),
      async row => await this.onRow(speciesFileName, taxonomyUuid, row),
      total => this.total = totalPrevious + total
    ).start()

    if (this.hasErrors()) {
      await this.setStatusFailed()
    } else {
      await this.taxonomyImportManager.finalizeImport()
    }
  }

  async onHeaders (headers) {
    this.vernacularLangCodes = R.innerJoin((a, b) => a === b, languageCodesISO636_2, headers)

    console.log('====langCodes', this.vernacularLangCodes)

    this.taxonomyImportManager = new TaxonomyImportManager(this.user, this.surveyId, this.taxonomyCurrent, this.vernacularLangCodes, this.tx)
    await this.taxonomyImportManager.init()

    this.currentRow = 1
    this.incrementProcessedItems()
  }

  async onRow (speciesFileName, taxonomyUuid, row) {
    if (this.validateRow(speciesFileName, row)) {
      const { code, family, scientific_name: scientificName } = row

      const genus = R.pipe(R.split(' '), R.head)(scientificName)
      const vernacularNames = R.reduce((acc, lang) => {
        const name = row[lang]
        return R.when(
          R.always(StringUtils.isNotBlank(name)),
          R.assoc(lang, TaxonVernacularName.newTaxonVernacularName(lang, name))
        )(acc)
      }, {}, this.vernacularLangCodes)

      const taxon = Taxon.newTaxon(taxonomyUuid, code, family, genus, scientificName, vernacularNames)

      await this.taxonomyImportManager.addTaxonToUpdateBuffer(taxon)
    }
    this.currentRow++
    this.incrementProcessedItems()
  }

  validateRow (speciesFileName, rowIndexed) {
    // do not try to insert taxa with empty or duplicate code or duplicate scientific name (DB constraints)
    const { code, scientific_name: scientificName } = rowIndexed

    if (!code) {
      // ignore rows with blank code (auto-generated by Collect)
      return false
    }

    // check if code is duplicate
    const rowDuplicateCode = this.rowsByCode[code]
    if (rowDuplicateCode) {
      this.addError({
        [Taxon.propKeys.code]: {
          valid: false,
          errors: [{
            key: Validation.messageKeys.taxonomyEdit.codeDuplicate,
            params: { code, row: this.currentRow, duplicateRow: rowDuplicateCode },
          }],
        },
      }, speciesFileName)
    } else {
      this.rowsByCode[code] = this.currentRow
    }

    // check if scientific name is duplicate
    const rowDuplicateScientificName = this.rowsByScientificName[scientificName]
    if (rowDuplicateScientificName) {
      this.addError({
        [Taxon.propKeys.scientificName]: {
          valid: false,
          errors: [{
            key: Validation.messageKeys.taxonomyEdit.scientificNameDuplicate,
            params: { scientificName, row: this.currentRow, duplicateRow: rowDuplicateScientificName },
          }],
        },
      }, speciesFileName)
    } else {
      this.rowsByScientificName[scientificName] = this.currentRow
    }

    return !(rowDuplicateCode || rowDuplicateScientificName)
  }
}
