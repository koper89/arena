import React, { useContext } from 'react'

import AppContext from '../../app/appContext'

const AppSideBarFooter = ({ logout, opened }) => {
  const { i18n } = useContext(AppContext)

  return (
    <div className="app-sidebar__footer">
      <a className="btn btn-s btn-of-light-xs"
         onClick={() => logout()}
         style={{
           display: 'flex',
           alignItems: 'baseline',
         }}>
        <span className={`icon icon-exit ${opened ? ' icon-left' : ''}`}
              style={{ transform: 'scaleX(-1)' }}/>
        {
          opened
            ? <span>{i18n.t('sidebar.logout')}</span>
            : null
        }
      </a>

      <a className="btn btn-of-link app-sidebar__btn-of"
         href="http://www.openforis.org"
         target="_blank">
        {
          i18n.t(opened ? 'sidebar.openForis' : 'sidebar.openForisShort')
        }
      </a>
    </div>
  )
}

export default AppSideBarFooter