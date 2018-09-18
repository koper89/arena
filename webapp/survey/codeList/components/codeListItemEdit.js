import './codeListItemEdit.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import LabelsEditor from '../../components/labelsEditor'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getSurveyDefaultLanguage } from '../../../../common/survey/survey'
import { getCodeListItemCode, getCodeListItemLabel, getCodeListItemLabels } from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import { getSurvey } from '../../surveyState'
import { putCodeListItemProp } from '../../codeList/actions'

class CodeListItemEdit extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      edit: false,
    }
  }

  onPropLabelsChange (labelItem) {
    const {level, item, putCodeListItemProp} = this.props
    putCodeListItemProp(level, item.uuid, 'labels',
      R.assoc(labelItem.lang, labelItem.label, getCodeListItemLabels(item)))
  }

  render () {
    const {survey, level, item, putCodeListItemProp} = this.props
    const {edit} = this.state

    const validation = {} //TODO
    const language = getSurveyDefaultLanguage(survey)


    return <div className={`codeListItem ${edit ? 'edit': ''}`}>
      {
        edit ?
          <React.Fragment>
            <FormItem label={'code'}>
              <Input value={getCodeListItemCode(item)}
                     validation={getFieldValidation('code')(validation)}
                     onChange={e => putCodeListItemProp(level, item.uuid, 'code', normalizeName(e.target.value))}/>
            </FormItem>
            <button className="btn-of-light-xs btn-s"
                    style={{
                      padding: '0.2rem 0.5rem',
                    }}
                    onClick={() => this.setState({edit: false})}>
              <span className="icon icon-arrow-up icon-8px"/>
            </button>
            <LabelsEditor labels={getCodeListItemLabels(item)}
                          onChange={(labelItem) => this.onPropLabelsChange(labelItem, 'labels')}/>
          </React.Fragment>
          :
          <React.Fragment>
            <label>{getCodeListItemCode(item)}</label>
            <label>{getCodeListItemLabel(language)(item)}</label>
            <button className="open-btn"
                    onClick={() => this.setState({edit: true})}>
              <span className="icon icon-arrow-down icon-8px"/>
            </button>
          </React.Fragment>
      }
    </div>
  }
}

CodeListItemEdit.defaultProps = {
  level: null,
  item: null,
}

const mapStateToProps = (state) => ({
  survey: getSurvey(state),
})

export default connect(mapStateToProps, {putCodeListItemProp})(CodeListItemEdit)