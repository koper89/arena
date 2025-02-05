import Job from '@server/job/job'

import * as SurveyManager from '../../../survey/manager/surveyManager'

import SurveyDependencyGraphsGenerationJob from '../../../survey/service/surveyDependencyGraphsGenerationJob'
import RecordsUniquenessValidationJob from '../../../record/service/recordsUniquenessValidationJob'
import SurveyRdbGeneratorJob from '../../../surveyRdb/service/surveyRdbGeneratorJob'
import CollectSurveyReaderJob from './metaImportJobs/collectSurveyReaderJob'
import SurveyCreatorJob from './metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from './metaImportJobs/categoriesImportJob'
import TaxonomiesImportJob from './metaImportJobs/taxonomiesImportJob'
import SamplingPointDataImportJob from './metaImportJobs/samplingPointDataImportJob'
import NodeDefsImportJob from './metaImportJobs/nodeDefsImportJob'

import RecordsImportJob from './dataImportJobs/recordsImportJob'

export default class CollectImportJob extends Job {
  constructor(params) {
    super(CollectImportJob.type, params, [
      new CollectSurveyReaderJob(),
      new SurveyCreatorJob(),
      new CategoriesImportJob(),
      new TaxonomiesImportJob(),
      new SamplingPointDataImportJob(),
      new NodeDefsImportJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new RecordsImportJob(),
      new SurveyRdbGeneratorJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
  }

  async onEnd() {
    await super.onEnd()

    const { collectSurveyFileZip, surveyId } = this.context

    if (collectSurveyFileZip) {
      collectSurveyFileZip.close()
    }

    if (!this.isSucceeded() && surveyId) {
      await SurveyManager.dropSurveySchema(surveyId)
    }
  }
}

CollectImportJob.type = 'CollectImportJob'
