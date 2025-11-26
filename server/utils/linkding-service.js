// @ts-check

import retry from "p-retry";

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
      if (linkdingDefaultTags) tagNames = JSON.parse(linkdingDefaultTags);
    } catch (err) {
      this.logger.error(err);
      this.logger.error("Failed to parse Linkding default tags, falling back to empty array");
      tagNames = [];
    }

    const apiUrl = new URL("/api/bookmarks/", linkdingApiUrl);
    const json = { url, title, description, tag_names: tagNames };

    const headers = new Headers();
    headers.set("Authorization", `Token ${linkdingApiToken}`);
    headers.set("Content-Type", "application/json");

    const res = await retry(() =>
      this.downloadService.queue.add(() =>
        fetch(apiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(json),
        }),
      ),
    );
    if (!res.ok) {
      this.logger.error({ status: res.status, statusText: res.statusText, body: await res.text() });
      throw new Error("Failed to save bookmark to Linkding");
    }

    return url;
  }
}
