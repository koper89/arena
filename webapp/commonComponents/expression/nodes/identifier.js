import React from 'react'
import * as R from 'ramda'

import Dropdown from '@webapp/commonComponents/form/dropdown'

const Identifier = ({ node, variables, onChange }) => (
  <Dropdown
    items={variables}
    selection={R.find(R.propEq('value', node.name), variables)}
    itemLabelProp="label"
    itemKeyProp="value"
    onChange={item => onChange(R.assoc('name', R.propOr('', 'value', item), node))}
  />
)

export default Identifier
