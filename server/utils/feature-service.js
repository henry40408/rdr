// @ts-check

/**
 * @typedef {object} UserFeatures
 * @property {boolean} summarization
 * @property {boolean} save
 * @property {boolean} linkding
 */

export class FeatureService {
  /**
   * @param {object} opts
   * @param {Repository} opts.repository
   */
  constructor({ repository }) {
    this.repository = repository;
  }

  /**
   * @param {number} userId
   * @returns {Promise<UserFeatures>}
   */
  async userFeatures(userId) {
    const settings = await this.repository.findUserSettings(userId);
    const summarization = !!settings.kagiSessionLink && !!settings.kagiLanguage;

    const linkding = !!settings.linkdingApiUrl && !!settings.linkdingApiToken;
    const save = !!linkding;
    return {
      summarization,
      save,
      linkding,
    };
  }
}
