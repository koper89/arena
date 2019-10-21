const R = require('ramda')

const { uuidv4 } = require('../uuid')

const SurveyInfo = require('./_survey/surveyInfo')
const SurveyCycle = require('./surveyCycle')
const SurveyNodeDefs = require('./_survey/surveyNodeDefs')
const SurveyNodeDefsValidation = require('./_survey/surveyNodeDefsValidation')
const SurveyCategories = require('./_survey/surveyCategories')
const SurveyTaxonomies = require('./_survey/surveyTaxonomies')
const SurveyDefaults = require('./_survey/surveyDefaults')
const SurveyDependencies = require('./_survey/surveyDependencies')
const SurveyRefDataIndex = require('./_survey/surveyRefDataIndex')

const Srs = require('../geo/srs')

const newSurvey = (ownerUuid, name, label, lang, collectUri = null) => ({
  [SurveyInfo.keys.uuid]: uuidv4(),
  [SurveyInfo.keys.props]: {
    [SurveyInfo.keys.name]: name,
    [SurveyInfo.keys.labels]: { [lang]: label },
    [SurveyInfo.keys.languages]: [lang],
    [SurveyInfo.keys.srs]: [R.omit([Srs.keys.wkt], Srs.latLonSrs)],
    ...collectUri
      ? { collectUri }
      : {},
    [SurveyInfo.keys.cycles]: {
      [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle()
    }
  },
  [SurveyInfo.keys.ownerUuid]: ownerUuid,
})

module.exports = {
  newSurvey,

  infoKeys: SurveyInfo.keys,
  dependencyTypes: SurveyDependencies.dependencyTypes,
  collectReportKeys: SurveyInfo.collectReportKeys,
  cycleOneKey: SurveyInfo.cycleOneKey,

  // ====== DEFAULTS
  getDefaultAuthGroups: SurveyDefaults.getDefaultAuthGroups,

  // READ
  getId: R.pipe(SurveyInfo.getInfo, SurveyInfo.getId),
  getIdSurveyInfo: SurveyInfo.getId,
  getSurveyInfo: SurveyInfo.getInfo,

  // === context is surveyInfo
  getUuid: SurveyInfo.getUuid,
  getName: SurveyInfo.getName,
  getLanguages: SurveyInfo.getLanguages,
  getLanguage: SurveyInfo.getLanguage,
  getDefaultLanguage: SurveyInfo.getDefaultLanguage,
  getLabels: SurveyInfo.getLabels,
  getLabel: SurveyInfo.getLabel,
  getDefaultLabel: SurveyInfo.getDefaultLabel,
  getDescriptions: SurveyInfo.getDescriptions,
  getSRS: SurveyInfo.getSRS,
  getDefaultSRS: SurveyInfo.getDefaultSRS,
  getStatus: SurveyInfo.getStatus,
  getCycles: SurveyInfo.getCycles,
  getCycleKeys: SurveyInfo.getCycleKeys,
  getDateCreated: SurveyInfo.getDateCreated,
  getDateModified: SurveyInfo.getDateModified,
  isPublished: SurveyInfo.isPublished,
  isDraft: SurveyInfo.isDraft,
  isValid: SurveyInfo.isValid,
  isFromCollect: SurveyInfo.isFromCollect,
  getCollectUri: SurveyInfo.getCollectUri,
  getCollectReport: SurveyInfo.getCollectReport,
  hasCollectReportIssues: SurveyInfo.hasCollectReportIssues,

  getAuthGroups: SurveyInfo.getAuthGroups,
  isAuthGroupAdmin: SurveyInfo.isAuthGroupAdmin,
  getAuthGroupAdmin: SurveyInfo.getAuthGroupAdmin,

  // UPDATE
  markDraft: SurveyInfo.markDraft,

  // ====== READ nodeDefs
  getNodeDefs: SurveyNodeDefs.getNodeDefs,
  getNodeDefsArray: SurveyNodeDefs.getNodeDefsArray,
  getNodeDefsByUuids: SurveyNodeDefs.getNodeDefsByUuids,
  getNodeDefRoot: SurveyNodeDefs.getNodeDefRoot,
  getNodeDefByUuid: SurveyNodeDefs.getNodeDefByUuid,
  getNodeDefChildren: SurveyNodeDefs.getNodeDefChildren,
  hasNodeDefChildrenEntities: SurveyNodeDefs.hasNodeDefChildrenEntities,
  getNodeDefChildByName: SurveyNodeDefs.getNodeDefChildByName,
  getNodeDefSiblingByName: SurveyNodeDefs.getNodeDefSiblingByName,
  getNodeDefByName: SurveyNodeDefs.getNodeDefByName,
  getNodeDefsByCategoryUuid: SurveyNodeDefs.getNodeDefsByCategoryUuid,
  getNodeDefsByTaxonomyUuid: SurveyNodeDefs.getNodeDefsByTaxonomyUuid,
  getNodeDefParent: SurveyNodeDefs.getNodeDefParent,
  getNodeDefKeys: SurveyNodeDefs.getNodeDefKeys,
  isNodeDefRootKey: SurveyNodeDefs.isNodeDefRootKey,
  findNodeDef: SurveyNodeDefs.findNodeDef,

  // hierarchy
  isNodeDefAncestor: SurveyNodeDefs.isNodeDefAncestor,
  visitAncestorsAndSelf: SurveyNodeDefs.visitAncestorsAndSelf,
  getHierarchy: SurveyNodeDefs.getHierarchy,
  traverseHierarchyItem: SurveyNodeDefs.traverseHierarchyItem,
  traverseHierarchyItemSync: SurveyNodeDefs.traverseHierarchyItemSync,

  // ====== READ dependencies
  getNodeDefDependencies: SurveyDependencies.getNodeDefDependencies,

  // ====== UPDATE
  assocNodeDefs: SurveyNodeDefs.assocNodeDefs,
  assocDependencyGraph: SurveyDependencies.assocDependencyGraph,
  buildDependencyGraph: SurveyDependencies.buildGraph,

  // ====== NodeDefsValidation
  getNodeDefsValidation: SurveyNodeDefsValidation.getNodeDefsValidation,
  assocNodeDefsValidation: SurveyNodeDefsValidation.assocNodeDefsValidation,
  getNodeDefValidation: SurveyNodeDefsValidation.getNodeDefValidation,

  // ====== NodeDef Code
  getNodeDefCategoryLevelIndex: SurveyNodeDefs.getNodeDefCategoryLevelIndex,
  getNodeDefParentCode: SurveyNodeDefs.getNodeDefParentCode,
  getNodeDefCodeCandidateParents: SurveyNodeDefs.getNodeDefCodeCandidateParents,

  //TODO check where used
  canUpdateCategory: SurveyNodeDefs.canUpdateCategory,
  isNodeDefParentCode: SurveyNodeDefs.isNodeDefParentCode,

  // ====== Categories
  getCategories: SurveyCategories.getCategories,
  getCategoriesArray: SurveyCategories.getCategoriesArray,
  getCategoryByUuid: SurveyCategories.getCategoryByUuid,
  assocCategories: SurveyCategories.assocCategories,

  // ====== Taxonomies
  getTaxonomiesArray: SurveyTaxonomies.getTaxonomiesArray,
  getTaxonomyByUuid: SurveyTaxonomies.getTaxonomyByUuid,
  assocTaxonomies: SurveyTaxonomies.assocTaxonomies,
  canUpdateTaxonomy: SurveyNodeDefs.canUpdateTaxonomy,

  // ====== Survey Reference data index
  // category index
  getCategoryItemUuidAndCodeHierarchy: SurveyRefDataIndex.getCategoryItemUuidAndCodeHierarchy,
  getCategoryItemByUuid: SurveyRefDataIndex.getCategoryItemByUuid,
  // taxon index
  getTaxonUuid: SurveyRefDataIndex.getTaxonUuid,
  getTaxonVernacularNameUuid: SurveyRefDataIndex.getTaxonVernacularNameUuid,
  getTaxonByUuid: SurveyRefDataIndex.getTaxonByUuid,
  includesTaxonVernacularName: SurveyRefDataIndex.includesTaxonVernacularName,

  assocRefData: SurveyRefDataIndex.assocRefData,
}
