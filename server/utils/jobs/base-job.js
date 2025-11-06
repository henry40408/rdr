// @ts-check

import { CronJob } from "cron";

/** @interface */
export class BaseJob {
  /**
   * @param {object} opts
   * @param {string} opts.cronTime
   * @param {JobService} opts.jobService
   */
  constructor({ cronTime, jobService }) {
    this.jobService = jobService;
    this.jobService.register(this);

    this.job = CronJob.from({
      cronTime,
      onTick: () => this.jobService.run(this),
      waitForCompletion: true,
    });
  }

  async init() {
    this.job.start();
  }

  async dispose() {
    await this.job.stop();
  }

  /** @returns {string} */
  get name() {
    throw new Error("Not implemented");
  }

  /** @returns {string} */
  get description() {
    throw new Error("Not implemented");
  }

  /** @returns {Promise<void>} */
  async run() {
    throw new Error("Not implemented");
  }
}
