const R = require('ramda')
const db = require('../db/db')
const fastcsv = require('fast-csv')

const {
  getTaxonomyVernacularLanguageCodes,
  getTaxonCode,
  getTaxonFamily,
  getTaxonGenus,
  getTaxonScientificName,
  getTaxonVernacularName,
} = require('../../common/survey/taxonomy')

const {
  createJob,
  updateJobProgress,
  updateJobStatus,
} = require('../job/jobManager')

const {
  jobStatus,
} = require('../../common/job/job')

const {TaxaParser} = require('./taxaParser')

const {
  fetchTaxonomyById,
  fetchTaxa,
  insertTaxa,
  updateTaxonomyProp,
  deleteTaxaByTaxonomyId
} = require('../../server/taxonomy/taxonomyRepository')

const storeTaxa = async (surveyId, taxonomyId, vernacularLanguageCodes, taxa) => {
  await db.tx(async t => {
    await updateTaxonomyProp(surveyId, taxonomyId, {
      key: 'vernacularLanguageCodes',
      value: vernacularLanguageCodes
    }, true, t)
    await deleteTaxaByTaxonomyId(surveyId, taxonomyId, t)
    await insertTaxa(surveyId, taxa, t)
  })
}

const exportTaxa = async (surveyId, taxonomyId, output, draft = false) => {
  console.log('start csv export')

  const taxonomy = await fetchTaxonomyById(surveyId, taxonomyId, draft)
  const vernacularLanguageCodes = getTaxonomyVernacularLanguageCodes(taxonomy)

  const csvStream = fastcsv.createWriteStream({headers: true})
  csvStream.pipe(output)

  const fixedHeaders = [
    'code',
    'family',
    'genus',
    'scientific_name'
  ]
  //write headers
  csvStream.write(R.concat(fixedHeaders, vernacularLanguageCodes))

  //write taxa
  const taxa = await fetchTaxa(surveyId, taxonomyId, null, 0, null, {
    field: 'scientificName',
    asc: true
  }, draft)

  taxa.forEach(taxon => {
    csvStream.write(R.concat([
        getTaxonCode(taxon),
        getTaxonFamily(taxon),
        getTaxonGenus(taxon),
        getTaxonScientificName(taxon)
      ],
      R.map(langCode => getTaxonVernacularName(langCode)(taxon))(vernacularLanguageCodes)
    ))
  })
  csvStream.end()

  console.log('csv export completed')
}

const importTaxa = async (userId, surveyId, taxonomyId, inputBuffer) => {
  const importJob = await createJob(userId, surveyId, 'import taxa', () => parser.cancel())

  const parser = await new TaxaParser(taxonomyId, inputBuffer)
    .onStart(async event => await updateJobStatus(importJob.id, jobStatus.running, event.total, event.processed))
    .onProgress(async event => await updateJobProgress(importJob.id, event.total, event.processed))
    .onEnd(async event => {
      const result = event.result
      const hasErrors = !R.isEmpty(R.keys(result.errors))
      if (hasErrors) {
        console.log('errors found')
        await updateJobStatus(importJob.id, jobStatus.error, event.total, event.processed, {errors: result.errors})
      } else {
        await storeTaxa(surveyId, taxonomyId, result.vernacularLanguageCodes, result.taxa)
        console.log(`taxa stored: ${result.taxa.length}`)
        await updateJobStatus(importJob.id, jobStatus.completed, event.total, event.processed)
      }
    })
    .start()

  return importJob
}

module.exports = {
  exportTaxa,
  importTaxa,
}