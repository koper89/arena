import React from 'react'
import { connect } from 'react-redux'

import DeleteSurveyConfirmDialog from './deleteSurveyConfirmDialog'

import {
  getSurveyName,
  getSurveyStatus,
  isSurveyDraft,
} from '../../../common/survey/survey'

import { getSurvey } from '../../survey/surveyState'
import { deleteSurvey } from '../../survey/actions'
import { appModules } from '../appModules'
import { appModuleUri } from '../../app/app'

class SurveyInfoView extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      showDialog: false
    }
  }

  toggleDeleteConfirmDialog (show) {
    this.setState({
      showDialog: show
    })
  }

  componentDidUpdate (prevProps) {
    const {survey, history} = this.props
    const {survey: prevSurvey} = prevProps

    // redirecting when survey has been deleted
    if (prevSurvey && !survey) {
      history.push(appModuleUri(appModules.home))
    }
  }

  render () {
    const {survey, deleteSurvey} = this.props
    const {showDialog} = this.state

    return (
      <div className="app-dashboard__survey-info">

        <div className="survey-status">
          {
            isSurveyDraft(survey) &&
            <span className="icon icon-warning icon-12px icon-left"/>
          }

          {getSurveyStatus(survey)}
        </div>

        <h4 className="survey-name">
          {getSurveyName(survey)}
        </h4>

        <div className="button-bar">
          <button className="btn btn-of-light" aria-disabled={!isSurveyDraft(survey)}>
            <span className="icon icon-checkmark2 icon-16px icon-left"/> Publish
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-download3 icon-16px icon-left"/> Export
          </button>

          <button className="btn btn-of-light">
            <span className="icon icon-upload3 icon-16px icon-left"/> Import
          </button>

          <button className="btn btn-of-light" onClick={() => this.toggleDeleteConfirmDialog(true)}>
            <span className="icon icon-bin icon-16px icon-left"/> Delete
          </button>

          {showDialog &&
          <DeleteSurveyConfirmDialog show={showDialog}
                                     onCancel={() => this.toggleDeleteConfirmDialog(false)}
                                     onDelete={() => deleteSurvey(survey.id)}
                                     surveyName={getSurveyName(survey)}/>
          }
        </div>

      </div>
    )
  }
}

const mapStateToProps = state => ({
  survey: getSurvey(state)
})

export default connect(mapStateToProps, {deleteSurvey})(SurveyInfoView)
