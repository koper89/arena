import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

const SurveyListRowHeader = () => {
  const i18n = useI18n()

  return (
    <>
      <div />
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.label')}</div>
      <div>{i18n.t('common.dateCreated')}</div>
      <div>{i18n.t('common.dateLastModified')}</div>
      <div>{i18n.t('homeView.surveyList.status')}</div>
    </>
  )
}

export default SurveyListRowHeader
