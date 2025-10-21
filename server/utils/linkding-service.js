import got from "got";

export class LinkdingService {
  /**
   * @param {object} opts
   * @param {DownloadService} opts.downloadService
   * @param {FeatureService} opts.featureService
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ downloadService, featureService, logger, repository }) {
    this.downloadService = downloadService;
    this.featureService = featureService;
    this.logger = logger.child({ service: "linkding-service" });
    this.repository = repository;
  }

  /**
   * @param {object} opts
   * @param {number} opts.userId
   * @param {string} opts.url
   * @param {string} opts.title
   * @param {string} opts.description
   * @returns {Promise<string|undefined>}
   */
  async save({ userId, url, title, description }) {
    const features = await this.featureService.userFeatures(userId);
    if (!features.linkding) return;

    const settings = await this.repository.findUserSettings(userId);
    const { linkdingApiUrl, linkdingApiToken, linkdingDefaultTags } = settings;

    let tagNames = [];
    try {
      tagNames = JSON.parse(linkdingDefaultTags);
    } catch (err) {
      this.logger.error(err);
      this.logger.error("Failed to parse Linkding default tags, falling back to empty array");
      tagNames = [];
    }

    const apiUrl = new URL("/api/bookmarks/", linkdingApiUrl);
    const json = { url, title, description, tag_names: tagNames };

    await this.downloadService.queue.add(() =>
      got
        .post(apiUrl.toString(), {
          headers: { Authorization: `Token ${linkdingApiToken}` },
          json,
        })
        .json(),
    );

    return url;
  }
}
