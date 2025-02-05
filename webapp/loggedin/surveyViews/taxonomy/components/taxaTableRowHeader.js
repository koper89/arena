import React from 'react'
import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import { languages } from '@core/app/languages'

import useI18n from '@webapp/commonComponents/hooks/useI18n'

const TaxaTableRowHeader = props => {
  const { vernacularLanguageCodes, taxonomy } = props

  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('#')}</div>
      <div>{i18n.t('common.code')}</div>
      <div>{i18n.t('taxonomy.edit.family')}</div>
      <div>{i18n.t('taxonomy.edit.genus')}</div>
      <div>{i18n.t('taxonomy.edit.scientificName')}</div>
      {vernacularLanguageCodes.map(lang => (
        <div key={`vernacular_name_header_${Taxonomy.getUuid(taxonomy)}_${lang}`}>
          {R.propOr(lang, lang)(languages)}
        </div>
      ))}
    </>
  )
}

export default TaxaTableRowHeader
