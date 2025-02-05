import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import { FormItem } from '@webapp/commonComponents/form/input'
import Checkbox from '@webapp/commonComponents/form/checkbox'
import NodeDefExpressionsProp from './expressionsProp/nodeDefExpressionsProp'

const AdvancedProps = props => {
  const { nodeDef, validation, nodeDefParent, setNodeDefProp, readOnly } = props

  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  const i18n = useI18n()

  return (
    <div className="form">
      {NodeDef.canHaveDefaultValue(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.advancedProps.readOnly')}>
            <Checkbox
              checked={NodeDef.isReadOnly(nodeDef)}
              disabled={readOnly || NodeDef.isKey(nodeDef) || NodeDef.isMultiple(nodeDef)}
              validation={Validation.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
              onChange={checked => setNodeDefProp(NodeDef.propKeys.readOnly, checked)}
            />
          </FormItem>

          <NodeDefExpressionsProp
            nodeDef={nodeDef}
            nodeDefValidation={validation}
            setNodeDefProp={setNodeDefProp}
            label={i18n.t('nodeDefEdit.advancedProps.defaultValues')}
            readOnly={readOnly}
            propName={NodeDef.keysPropsAdvanced.defaultValues}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant={true}
            isBoolean={NodeDef.isBoolean(nodeDef)}
          />
        </>
      )}

      <NodeDefExpressionsProp
        nodeDef={nodeDef}
        nodeDefValidation={validation}
        setNodeDefProp={setNodeDefProp}
        label={i18n.t('nodeDefEdit.advancedProps.applicableIf')}
        readOnly={readOnly}
        propName={NodeDef.keysPropsAdvanced.applicable}
        applyIf={false}
        multiple={false}
        nodeDefUuidContext={nodeDefUuidContext}
        isContextParent={true}
        hideAdvanced={true}
      />
    </div>
  )
}

export default AdvancedProps
