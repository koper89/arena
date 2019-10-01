const R = require('ramda')

const Job = require('../../../../../job/job')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const Validation = require('../../../../../../common/validation/validation')

const SurveyManager = require('../../../../survey/manager/surveyManager')

class NodeDefsValidationJob extends Job {

  constructor (params) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute (tx) {
    const survey = SurveyManager.fetchSurveyById(this.surveyId, true, false, tx)
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycles, R.keys)(survey)
    for (const cycle of cycleKeys) {
      const surveyAndNodeDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, cycle, true, true, true, false, tx)

      R.pipe(
        Survey.getNodeDefsValidation,
        Validation.getFieldValidations,
        R.forEachObjIndexed((nodeDefValidation, nodeDefUuid) => {
          const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(surveyAndNodeDefs)
          this.errors[NodeDef.getName(nodeDef)] = Validation.getFieldValidations(nodeDefValidation)
        })
      )(surveyAndNodeDefs)
    }
    if (!R.isEmpty(this.errors)) {
      await this.setStatusFailed()
    }
  }
}

NodeDefsValidationJob.type = 'NodeDefsValidationJob'

module.exports = NodeDefsValidationJob