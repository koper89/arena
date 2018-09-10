import React from 'react'
import * as R from 'ramda'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'

import { isNodeDefMultiple } from '../../../../../common/survey/nodeDef'
import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import { getNodeValue, newNodePlaceholder } from '../../../../../common/record/node'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

const NodeDefTextInput = ({nodeDef, node, parentNode, edit, updateNode}) =>
  <Input readOnly={edit}
         {...getNodeDefInputTextProps(nodeDef)}
         value={getNodeValue(node, '')}
         onChange={(e) =>
           updateNode(nodeDef, node, e.target.value)
         }
  />

const NodeDefDeleteButton = ({nodeDef, node, removeNode}) =>
  node.placeholder || !isNodeDefMultiple(nodeDef)
    ? null
    : <button className="btn btn-s btn-of-light-xs"
              style={{
                alignSelf: 'center',
                justifySelf: 'center',
              }}
              onClick={() => removeNode(nodeDef, node)}>
      <span className="icon icon-bin icon-12px"/>
    </button>

const NodeDefText = props => {

  const {
    nodeDef, nodes, parentNode,
    entry, edit, label, renderType
  } = props

  // table header
  if (renderType === nodeDefRenderType.tableHeader) {
    return <label className="node-def__table-header">
      {label}
    </label>
  }

  // EDIT MODE

  if (edit)
    return <NodeDefFormItem {...props}>
      <NodeDefTextInput {...props} />
    </NodeDefFormItem>

  // ENTRY MODE

  if (entry && renderType === nodeDefRenderType.tableBody)
    return <NodeDefTextInput {...props} node={nodes[0]}/>
  else
    return (
      <NodeDefFormItem {...props}>
        <div className="overflowYAuto">
          {
            nodes.map(n =>
              <div key={`nodeDefTextInput_${n.uuid}`}
                   style={{
                     display: 'grid',
                     gridTemplateColumns: '.9fr .1fr'
                   }}>

                <NodeDefTextInput {...props} node={n}/>

                <NodeDefDeleteButton {...props} node={n}/>

              </div>
            )
          }
        </div>
      </NodeDefFormItem>
    )
}

export default NodeDefText
