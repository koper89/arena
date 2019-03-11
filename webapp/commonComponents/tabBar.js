import './tabBar.scss'

import React from 'react'

const TabBarButtons = ({ tabs, selection, onClick }) => (
  <div className="flex-center tab-bar__header">
    {
      tabs.map((tab, i) => {
        const active = i === selection

        return tab.showTab === false
          ? null
          : (
            <button key={i}
                    className={`btn btn-of${active ? ' active' : ''}`}
                    onClick={() => onClick(i)}
                    aria-disabled={!!tab.disabled}>
              {
                tab.icon &&
                <span className={`icon ${tab.icon} icon-12px icon-left`}/>
              }
              {tab.label}
            </button>
          )
      })
    }
  </div>
)

class TabBar extends React.Component {

  constructor (props) {
    super(props)

    this.state = { selection: TabBar.defaultProps.selection }
  }

  render () {
    const {
      tabs, className,
      renderer, onClick,
    } = this.props

    const { selection } = this.state

    const tab = tabs[selection]

    return (
      <div className={`tab-bar ${className}`}>

        <TabBarButtons
          tabs={tabs}
          selection={selection}
          onClick={tabIndex => {
            this.setState({ selection: tabIndex })
            onClick && onClick(tabs[tabIndex])
          }}
        />

        {
          renderer
            ? React.createElement(renderer, { ...this.props })
            : (
              typeof tab.component === 'object'
                ? tab.component
                : React.createElement(tab.component, { ...tab.props, ...this.props })
            )
        }

      </div>
    )
  }

}

TabBar.defaultProps = {
  className: '',
  selection: 0,
  tabs: [],
  renderer: null,
  onClick: null,
}

export default TabBar
