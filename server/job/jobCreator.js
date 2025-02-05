import * as R from 'ramda'

import CategoryImportJob from '@server/modules/category/service/categoryImportJob'
import CollectImportJob from '@server/modules/collectImport/service/collectImport/collectImportJob'
import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'

const jobClasses = [CategoryImportJob, CollectImportJob, SurveyPublishJob, TaxonomyImportJob]

const getJobClass = jobType => R.find(R.propEq('type', jobType), jobClasses)

export const createJob = (jobType, params) => {
  const JobClass = getJobClass(jobType)

  return new JobClass(params)
}
