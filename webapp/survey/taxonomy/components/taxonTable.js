import React from 'react'
import * as R from 'ramda'

import {
  getTaxonCode,
  getTaxonFamily,
  getTaxonGenus,
  getTaxonScientificName,
  getTaxonVernacularNames,
  getTaxonVernacularName,
} from '../../../../common/survey/taxonomy'
import { languages } from '../../../../common/app/languages'

class TaxonTable extends React.Component {

  constructor (props) {
    super(props)

    this.tableBody = React.createRef()
  }

  componentDidUpdate () {
    this.tableBody.current.scrollTop = 0
  }

  render () {
    const {taxonomy, taxa, currentPage, totalPages, rowsPerPage, onPageChange} = this.props
    const vernacularLanguageCodes = R.reduce(
      (acc, taxon) => R.concat(acc, R.difference(R.keys(getTaxonVernacularNames(taxon)), acc)),
      [],
      taxa)

    const headerAndRowCustomStyle = {
      gridTemplateColumns: `60px .1fr .2fr .2fr .4fr ${R.isEmpty(vernacularLanguageCodes) ? '' : `repeat(${vernacularLanguageCodes.length}, 60px)`}`
    }

    return <div className="taxa-table">
      <div className="header"
           style={headerAndRowCustomStyle}>
        <div className="position">#</div>
        <div>CODE</div>
        <div>FAMILY</div>
        <div>GENUS</div>
        <div>SCIENTIFIC NAME</div>
        {
          vernacularLanguageCodes.map(lang =>
            <div key={`vernacular_name_header_${taxonomy.uuid}_${lang}`}>{R.propOr(lang, lang)(languages)}</div>)
        }
      </div>
      <div className="body"
           ref={this.tableBody}>
        {
          taxa.map(taxon =>
            <div key={taxon.uuid}
                 className="row"
                 style={headerAndRowCustomStyle}>
              <div className="position">{(currentPage - 1) * rowsPerPage + taxa.indexOf(taxon) + 1}</div>
              <div>{getTaxonCode(taxon)}</div>
              <div>{getTaxonFamily(taxon)}</div>
              <div>{getTaxonGenus(taxon)}</div>
              <div>{getTaxonScientificName(taxon)}</div>
              {
                vernacularLanguageCodes.map(lang =>
                  <div key={`vernacular_name_${taxon.uuid}_${lang}`}>{getTaxonVernacularName(lang)(taxon)}</div>)
              }
            </div>)
        }
      </div>

      <div className="paginator">
        <button className="btn btn-of-light"
                aria-disabled={currentPage === 1}
                onClick={() => onPageChange(1)}>
          <span className="icon icon-backward2 icon-16px"/>
        </button>
        <button className="btn btn-of-light"
                aria-disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                style={{transform: 'scaleX(-1)'}}>
          <span className="icon icon-play3 icon-16px"/>
        </button>
        <span className="page-count">{currentPage} / {totalPages}</span>
        <button className="btn btn-of-light"
                aria-disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}>
          <span className="icon icon-play3 icon-16px"/>
        </button>
        <button className="btn btn-of-light"
                aria-disabled={currentPage === totalPages}
                onClick={() => onPageChange(totalPages)}>
          <span className="icon icon-forward3 icon-16px"/>
        </button>
      </div>
    </div>
  }
}

export default TaxonTable