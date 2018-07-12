export const surveyDashboardApiUri = surveyId => `/api/surveyDashboard/${surveyId}`

const surveyDashboard = 'surveyDashboard'
export const statePaths = {
  surveyId: [surveyDashboard, 'surveyId'],

  survey: [surveyDashboard, 'survey']
}

export const actionTypes = {
  surveyLoaded: 'surveyDashboard/survey/loaded'
}

