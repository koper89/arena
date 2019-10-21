import './surveyCreateView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../core/survey/survey'

import { Input } from '../../../../commonComponents/form/input'
import LanguageDropdown from '../../../../commonComponents/form/languageDropdown'
import UploadButton from '../../../../commonComponents/form/uploadButton'
import { useI18n, useOnUpdate } from '../../../../commonComponents/hooks'

import Validation from '../../../../../core/validation/validation'
import StringUtils from '../../../../../core/stringUtils'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyCreateState from './surveyCreateState'
import { appModuleUri, homeModules } from '../../../appModules'

import { updateNewSurveyProp, resetNewSurvey } from './actions'
import { createSurvey, importCollectSurvey } from './actions'

const SurveyCreateView = (props) => {

  const {
    surveyInfo, newSurvey, history,
    resetNewSurvey, updateNewSurveyProp, createSurvey, importCollectSurvey
  } = props

  const { name, label, lang, validation } = newSurvey

  const i18n = useI18n()

  // onMount reset new survey
  useEffect(() => {
    resetNewSurvey()
  }, [])

  // redirect to dashboard on survey change
  useOnUpdate(() => {
    history.push(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  return (
    <div className="home-survey-create">
      <div>
        <Input
          placeholder={i18n.t('common.name')}
          value={name}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={value => updateNewSurveyProp('name', StringUtils.normalizeName(value))}/>
      </div>
      <div>
        <Input
          placeholder={i18n.t('common.label')}
          value={label}
          validation={Validation.getFieldValidation('label')(validation)}
          onChange={value => updateNewSurveyProp('label', value)}/>
      </div>
      <div>
        <LanguageDropdown
          selection={lang}
          onChange={e => updateNewSurveyProp('lang', e)}
          validation={Validation.getFieldValidation('lang')(validation)}/>
      </div>
      <button className="btn"
              onClick={() => createSurvey({ name, label, lang })}>
        <span className="icon icon-plus icon-left icon-12px"/>
        {i18n.t('homeView.surveyCreate.createSurvey')}
      </button>


      <div className="home-survey-create__collect-import">

        <UploadButton
          label={i18n.t('homeView.surveyCreate.importFromCollect')}
          accept={'.collect-backup'}
          maxSize={1000}
          onChange={files => importCollectSurvey(files[0])}/>
      </div>

    </div>
  )
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  newSurvey: SurveyCreateState.getNewSurvey(state),
})

export default connect(
  mapStateToProps,
  {
    resetNewSurvey,
    createSurvey,
    updateNewSurveyProp,
    importCollectSurvey,
  }
)(SurveyCreateView)