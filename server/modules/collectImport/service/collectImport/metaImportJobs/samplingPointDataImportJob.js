import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Point from '@core/geo/point'
import * as CollectImportJobContext from '../collectImportJobContext'

import * as CategoryManager from '../../../../category/manager/categoryManager'
import CategoryImportJob from '../../../../category/service/categoryImportJob'
import * as CategoryImportJobParams from '../../../../category/service/categoryImportJobParams'

const keysExtra = {
  x: 'x',
  y: 'y',
  // eslint-disable-next-line camelcase
  srs_id: 'srs_id',
}

const keysItem = {
  location: 'location',
}

const samplingPointDataZipEntryPath = 'sampling_design/sampling_design.csv'

export default class SamplingPointDataImportJob extends CategoryImportJob {
  constructor(params) {
    super(
      {
        ...params,
        [CategoryImportJobParams.keys.categoryName]: SamplingPointDataImportJob.categoryName,
      },
      'SamplingPointDataImportJob',
    )
  }

  async logCategoryImportActivity() {
    // Do not log category import activity for sampling point data category
  }

  async shouldExecute() {
    // Skip import if summary is not specified (csv file not found)
    return Boolean(this.summary)
  }

  async beforeSuccess() {
    // Delete empty levels
    this.logDebug('Deleting empty level(s)')
    const levelsCount = Category.getLevelsArray(this.category).length
    this.category = await CategoryManager.deleteLevelsEmptyByCategory(this.user, this.surveyId, this.category, this.tx)
    this.logDebug(`${levelsCount - Category.getLevelsArray(this.category).length} level(s) deleted`)

    await super.beforeSuccess()
  }

  // Start of overridden methods from CategoryImportJob
  async createReadStream() {
    const collectSurveyFileZip = CollectImportJobContext.getCollectSurveyFileZip(this.context)
    return await collectSurveyFileZip.getEntryStream(samplingPointDataZipEntryPath)
  }

  async getOrCreateSummary() {
    const stream = await this.createReadStream()
    return stream ? await CategoryManager.createImportSummaryFromStream(stream) : null
  }

  extractItemExtraDef() {
    return R.pipe(
      R.omit(R.keys(keysExtra)),
      R.assoc(keysItem.location, {
        [CategoryItem.keysExtraDef.dataType]: Category.itemExtraDefDataTypes.geometryPoint,
      }),
    )(super.extractItemExtraDef())
  }

  extractItemExtraProps(extra) {
    const { srs_id: srsId, x, y } = extra

    const extraUpdated = {
      ...R.omit(R.keys(keysExtra))(extra),
      [keysItem.location]: Point.newPoint(srsId, x, y),
    }

    return super.extractItemExtraProps(extraUpdated)
  }

  // End of overridden methods from CategoryImportJob

  // overridden from Job
  async beforeEnd() {
    await super.beforeEnd()
    // Assoc imported category to context categories (to be used by NodeDefsImportJob)
    this.setContext(CollectImportJobContext.assocCategory(this.category)(this.context))
  }
}

SamplingPointDataImportJob.categoryName = 'sampling_point_data'
