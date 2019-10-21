import fs from 'fs';
import path from 'path';
import schedule from 'node-schedule';
import {getLogger} from '../../log/log'
import DateUtils from '../../../core/dateUtils';
import ProcessUtils from '../../../core/processUtils';

const Logger = getLogger('TempFilesCleanup')

const initSchedule = () =>
  // execute the cron job every day at 2AM
  schedule.scheduleJob('0 2 * * *', async () => {
    // cleanup temp files older than 6 hours
    await cleanupTempFiles(6)
  })

const cleanupTempFiles = async (olderThanHours?: number) => {
  const tempFolder = ProcessUtils.ENV.tempFolder

  Logger.debug(`Cleaning up temp files in folder ${tempFolder}`)

  let count = 0
  try {
    if (await fs.existsSync(tempFolder)) {
      const now = new Date()
      const files = await fs.readdirSync(tempFolder)
      for (const file of files) {
        const filePath = path.join(tempFolder, file)
        const stat = await fs.statSync(filePath)
        if (stat.isFile() && (!olderThanHours || DateUtils.differenceInHours(now, new Date(stat.ctime)) >= olderThanHours)) {
          await fs.unlinkSync(filePath)
          Logger.debug('Temp file deleted', filePath)
          count++
        }
      }
    }
  } catch (error) {
    //ignore errors
    Logger.error('Error deleting temp files', error)
  }

  Logger.debug(`${count} temp files deleted`)
}

const init = async () => {
  await cleanupTempFiles()

  initSchedule()
}

export default {
  init
};
