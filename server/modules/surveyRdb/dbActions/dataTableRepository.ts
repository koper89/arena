import * as R from 'ramda';
import Survey from '../../../../core/survey/survey';
import NodeDef from '../../../../core/survey/nodeDef';
import SchemaRdb from '../../../../common/surveyRdb/schemaRdb';
import NodeDefTable from '../../../../common/surveyRdb/nodeDefTable';
import DataTable from '../schemaRdb/dataTable';
import SurveySchemaRepositoryUtils from '../../survey/repository/surveySchemaRepositoryUtils';

/**
 * Returns a list of items for each record containing duplicate entities.
 * Each item is in the format:
 * {
 *   uuid, //record uuid,
 *   validation: {}, //record validation object,
     node_duplicate_uuids: [nodeUuid1, nodeUuid2, ...] //array of duplicate entity uuids
 * }
 */
const fetchRecordsWithDuplicateEntities = async (survey, cycle, nodeDefEntity, nodeDefKeys, client) => {
  const surveyId = Survey.getId(survey)

  const tableName = `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getTableName(nodeDefEntity)}`

  const aliasA = 'e1'
  const aliasB = 'e2'

  const getColEqualCondition = colName => `${aliasA}.${colName} = ${aliasB}.${colName}`

  const getNullableColEqualCondition = colName =>
    `(${aliasA}.${colName} IS NULL AND ${aliasB}.${colName} IS NULL OR ${getColEqualCondition(colName)})`

  const equalKeysCondition = R.pipe(
    R.map(nodeDefKey => getNullableColEqualCondition(NodeDefTable.getColName(nodeDefKey))),
    R.join(' AND '),
  )(nodeDefKeys)

  const recordAndParentEqualCondition =
    NodeDef.isRoot(nodeDefEntity)
      ? ''
      : `AND ${getColEqualCondition(DataTable.colNameRecordUuuid)}
         AND ${getColEqualCondition(DataTable.colNameParentUuuid)}`

  return await client.any(`
    SELECT r.uuid, r.validation, json_agg(${aliasA}.uuid) as node_duplicate_uuids
    FROM ${SurveySchemaRepositoryUtils.getSurveyDBSchema(surveyId)}.record r
      JOIN ${tableName} ${aliasA}
        ON r.uuid = ${aliasA}.${DataTable.colNameRecordUuuid}
    WHERE
      r.cycle = $1
      AND EXISTS (
      --exists a node entity with the same key node values in the same record (if not root entity) and in the same parent node entity
      SELECT ${aliasB}.${DataTable.colNameUuuid}
      FROM ${tableName} ${aliasB}
      WHERE
        --same cycle
        ${aliasB}.${DataTable.colNameRecordCycle} = $1
        --different node uuid
        AND ${aliasA}.${DataTable.colNameUuuid} != ${aliasB}.${DataTable.colNameUuuid}
        ${recordAndParentEqualCondition}
        --same key node(s) values
        AND (${equalKeysCondition})
      )
    GROUP BY r.uuid, r.validation
    `,
    [cycle]
  )
}

export default {
  fetchRecordsWithDuplicateEntities
};
