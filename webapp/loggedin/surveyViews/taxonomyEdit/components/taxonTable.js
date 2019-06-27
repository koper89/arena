import React from 'react'
import * as R from 'ramda'

import Taxonomy from '../../../../../common/survey/taxonomy'
import Taxon from '../../../../../common/survey/taxon'
import { languages } from '../../../../../common/app/languages'

import useI18n from '../../../../commonComponents/useI18n'

const TaxonTable = props => {

  const { taxonomy, taxa, currentPage, totalPages, rowsPerPage, onPageChange } = props
  const vernacularLanguageCodes = R.reduce(
    (acc, taxon) => R.concat(acc, R.difference(R.keys(Taxon.getVernacularNames(taxon)), acc)),
    [],
    taxa)

  const headerAndRowCustomStyle = {
    gridTemplateColumns: `60px .1fr .2fr .2fr .4fr ${R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`}`,
  }

  const i18n = useI18n()

  return <div className="taxa-table">
    <div className="header"
         style={headerAndRowCustomStyle}>
      <div className="position">#</div>
      <div>{i18n.t('common.code')}</div>
      <div>{i18n.t('taxonomy.edit.family')}</div>
      <div>{i18n.t('taxonomy.edit.genus')}</div>
      <div>{i18n.t('taxonomy.edit.scientificName')}</div>
      {
        vernacularLanguageCodes.map(lang =>
          <div key={`vernacular_name_header_${Taxonomy.getUuid(taxonomy)}_${lang}`}>{R.propOr(lang, lang)(languages)}</div>)
      }
    </div>
    <div className="body">
      {
        taxa.map(taxon =>
          <div key={Taxon.getUuid(taxon)}
               className="row"
               style={headerAndRowCustomStyle}>
            <div className="position">{(currentPage - 1) * rowsPerPage + taxa.indexOf(taxon) + 1}</div>
            <div>{Taxon.getCode(taxon)}</div>
            <div>{Taxon.getFamily(taxon)}</div>
            <div>{Taxon.getGenus(taxon)}</div>
            <div>{Taxon.getScientificName(taxon)}</div>
            {
              vernacularLanguageCodes.map(lang =>
                <div key={`vernacular_name_${Taxon.getUuid(taxon)}_${lang}`}>{Taxon.getVernacularName(lang)(taxon)}</div>)
            }
          </div>)
      }
    </div>

    <div className="paginator">
      <button className="btn"
              aria-disabled={currentPage === 1}
              onClick={() => onPageChange(1)}>
        <span className="icon icon-backward2 icon-16px"/>
      </button>
      <button className="btn"
              aria-disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              style={{transform: 'scaleX(-1)'}}>
        <span className="icon icon-play3 icon-16px"/>
      </button>
      <span className="page-count">{currentPage} / {totalPages}</span>
      <button className="btn"
              aria-disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}>
        <span className="icon icon-play3 icon-16px"/>
      </button>
      <button className="btn"
              aria-disabled={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}>
        <span className="icon icon-forward3 icon-16px"/>
      </button>
    </div>
  </div>
}

export default TaxonTable