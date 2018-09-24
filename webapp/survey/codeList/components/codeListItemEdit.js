import React from 'react'
import * as R from 'ramda'

import LabelsEditor from '../../components/labelsEditor'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getSurveyDefaultLanguage } from '../../../../common/survey/survey'
import { getCodeListItemCode, getCodeListItemLabel, getCodeListItemLabels } from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

const onPropLabelsChange = (props, labelItem) => {
  const {level, item, putCodeListItemProp} = props
  putCodeListItemProp(level.index, item.uuid, 'labels',
    R.assoc(labelItem.lang, labelItem.label, getCodeListItemLabels(item)))
}

const CodeListItemEdit = (props) => {

  const {survey, level, item, edit, putCodeListItemProp, onEditChange, onDelete} = props

  const validation = {} //TODO
  const language = getSurveyDefaultLanguage(survey)

  return <div className={`code-lists__item ${edit ? 'edit' : ''}`}>
    {
      edit
        ? <React.Fragment>
          <FormItem label={'code'}>
            <Input value={getCodeListItemCode(item)}
                   validation={getFieldValidation('code')(validation)}
                   onChange={e => putCodeListItemProp(level.index, item.uuid, 'code', normalizeName(e.target.value))}/>
          </FormItem>
          <button className="btn-of-light-xs btn-s"
                  onClick={() => onEditChange(false, item)}>
            <span className="icon icon-arrow-up icon-8px"/>
          </button>
          <button className="btn-of-light-xs btn-s"
                  onClick={() => onDelete(item)}>
            <span className="icon icon-bin2 icon-8px"/>
          </button>
          <LabelsEditor labels={getCodeListItemLabels(item)}
                        onChange={(labelItem) => onPropLabelsChange(props, labelItem)}/>
        </React.Fragment>

        : <React.Fragment>
          <label>{getCodeListItemCode(item)}</label>
          <label>{getCodeListItemLabel(language)(item)}</label>
          <button className="open-btn"
                  onClick={() => onEditChange(true, item)}>
            <span className="icon icon-arrow-down icon-8px"/>
          </button>
        </React.Fragment>
    }
  </div>
}

export default CodeListItemEdit