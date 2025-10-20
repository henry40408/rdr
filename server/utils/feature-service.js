/**
 * @typedef {object} UserFeatures
 * @property {boolean} summarization
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
    return {
      summarization,
    };
  }
}
