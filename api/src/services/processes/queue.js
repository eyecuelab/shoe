import Core from '../../../core';
import QueueService from '../queue';

const { LogUtil } = Core.utils;

module.exports = async function (job) {
  const log = LogUtil.getLogger('QueueService');
  log.debug('Queue processor', job.name);

  const queueSvc = QueueService.create();
  try {
    const res = await queueSvc.handle(job.name, job.data);
    return res;
  } catch (err) {
    log.error(err);
    throw err;
  }
};
