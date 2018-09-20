import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import AddSurveyForm from './addSurveyForm'
import SurveysList from './surveysList'

import { appModuleUri, getSurveys } from '../../app/app'
import { appModules } from '../appModules'

import { getNewSurvey, getSurvey } from '../../survey/surveyState'

import { createSurvey, resetNewSurvey, updateNewSurveyProp } from '../../survey/actions'
import { fetchSurveys } from '../../app/actions'

class AppHomeView extends React.Component {

  componentDidMount () {
    this.props.fetchSurveys()
  }

  componentDidUpdate (prevProps) {

    const {currentSurvey: prevCurrentSurvey} = prevProps
    const {currentSurvey, history} = this.props

    if (currentSurvey && (!prevCurrentSurvey || currentSurvey.id !== prevCurrentSurvey.id)) {
      history.push(appModuleUri(appModules.surveyDashboard))
    }
  }

  componentWillUnmount () {
    this.props.resetNewSurvey()
  }

  render () {
    return (
      <div style={{
        display: 'grid',
        gridTemplateRows: '.15fr .8fr',
      }}>

        <AddSurveyForm {...this.props}/>

        <SurveysList {...this.props}/>

      </div>
    )
  }
}

AppHomeView.defaultProps = {
  newSurvey: null,
  currentSurvey: null,
  surveys: [],
}

const mapStateToProps = state => ({
  newSurvey: getNewSurvey(state),
  currentSurvey: getSurvey(state),
  surveys: getSurveys(state)
})

export default withRouter(connect(
  mapStateToProps,
  {
    createSurvey,
    updateNewSurveyProp,
    resetNewSurvey,
    fetchSurveys,
  }
)(AppHomeView))