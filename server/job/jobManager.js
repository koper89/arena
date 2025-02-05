import ThreadsCache from '@server/threads/threadsCache'
import ThreadManager from '@server/threads/threadManager'

import * as WebSocket from '@server/utils/webSocket'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import { jobThreadMessageTypes } from './jobUtils'

// USER JOB WORKERS

const userJobThreads = new ThreadsCache()

const _notifyJobUpdate = jobSerialized => {
  const userUuid = jobSerialized.userUuid

  WebSocket.notifyUser(userUuid, WebSocketEvents.jobUpdate, jobSerialized)
  if (!jobSerialized.ended) {
    return
  }

  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) {
    return
  }

  const cleanupThread = () => {
    jobThread.terminate()
    userJobThreads.removeThread(userUuid)
  }

  // Delay thread termination by 1 second (give time to print debug info to the console)
  setTimeout(cleanupThread, 1000)
}

// ====== UPDATE

export const cancelActiveJobByUserUuid = async userUuid => {
  const jobThread = userJobThreads.getThread(userUuid)
  if (!jobThread) {
    return
  }

  jobThread.postMessage({ type: jobThreadMessageTypes.cancelJob })
}

// ====== EXECUTE

export const executeJobThread = job => {
  const thread = new ThreadManager('jobThread.js', { jobType: job.type, jobParams: job.params }, job =>
    _notifyJobUpdate(job),
  )

  userJobThreads.putThread(job.userUuid, thread)
}
