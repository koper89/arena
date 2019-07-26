import React from 'react'

import component from './appView'

import homeReducer from './modules/home/reducer'
import dataReducer from './modules/data/reducer'
import surveyViewsReducer from './surveyViews/reducer'
import tableViewsReducer from './tableViews/reducer'

import * as HomeState from './modules/home/homeState'
import * as DataState from './modules/data/dataState'
import * as SurveyViewsState from './surveyViews/surveyViewsState'
import * as TableViewsState from './tableViews/tableViewsState'

const reducers = [
  { name: HomeState.stateKey, fn: homeReducer },
  { name: DataState.stateKey, fn: dataReducer },
  { name: SurveyViewsState.stateKey, fn: surveyViewsReducer },
  { name: TableViewsState.stateKey, fn: tableViewsReducer },
]

export {
  component,
  reducers,
}




