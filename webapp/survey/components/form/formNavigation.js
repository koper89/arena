import React from 'react'
import { connect } from 'react-redux'

import { getNodeDefChildren } from '../../../../common/survey/survey'
import { filterOuterPageChildren } from '../../../../common/survey/nodeDefLayout'

import { getFormActivePageNodeDef, getSurvey, isNodeDefFormActivePage } from '../../surveyState'

import { setFormActivePage } from '../../nodeDef/actions'

const FormNavigationItem = (props) => {
  const {
    nodeDef,
    childDefs,
    node,
    parentNode,

    level,
    isActive,

    setFormActivePage,
  } = props

  const outerPageChildDefs = childDefs ? filterOuterPageChildren(childDefs) : []

  return (
    <React.Fragment>

      <button className={`btn btn-of-light${isActive ? ' active' : ''}`}
              onClick={() => {
                // fetchNodeDefChildren(nodeDef.id, draft)
                setFormActivePage(nodeDef, node, parentNode)
              }}
              style={{height: `${100 - level * 10}%`}}>
        {nodeDef.props.name}
      </button>

      {
        outerPageChildDefs.map((child, i) =>
          <FormNavigationItemConnect key={child.uuid}
                                     level={level + 1}
                                     nodeDef={child}
                                     node={{}}
                                     parentNode={node}
                                     />
        )
      }

    </React.Fragment>
  )
}

const mapStateToProps = (state, props) => ({
  childDefs: getNodeDefChildren(props.nodeDef)(getSurvey(state)),
  currentPageNodeDef: getFormActivePageNodeDef(state),
  isActive: isNodeDefFormActivePage(props.nodeDef)(getSurvey(state)),
})
const FormNavigationItemConnect = connect(
  mapStateToProps,
  {setFormActivePage}
)(FormNavigationItem)

const FormNavigation = ({rootNodeDef, rootNode}) => {

  return (
    <div className="survey-form__nav" style={{
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <FormNavigationItemConnect nodeDef={rootNodeDef} node={rootNode} level={0}/>
    </div>
  )
}

export default FormNavigation