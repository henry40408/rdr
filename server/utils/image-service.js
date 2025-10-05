import got from "got";

export class ImageService {
  /**
   * @param {object} opts
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ logger, repository }) {
    this.logger = logger;
    this.repository = repository;
  }

  /**
   * @param {string} externalId
   * @param {string} url
   * @returns {Promise<ImageEntity|null>}
   */
  async download(externalId, url) {
    const logger = this.logger.child({ externalId });
    try {
      const existing = await this.repository.findImageByUrl(url);

      /** @type {Record<string, string>} */
      const headers = {};
      if (existing) {
        if (existing.etag) headers["If-None-Match"] = existing.etag;
        if (existing.lastModified) headers["If-Modified-Since"] = existing.lastModified;
      }
      const res = await got(url, { responseType: "buffer", headers });
      if (res.statusCode === 304) {
        logger.debug("Image not modified");
        return existing;
      }

      const contentType = res.headers["content-type"] || "application/octet-stream";
      if (!contentType.toLowerCase().startsWith("image/")) return null;

      const etag = res.headers["etag"] || null;
      const lastModified = res.headers["last-modified"] || null;
      const data = res.body;

      const newImage = new ImageEntity({
        externalId,
        url,
        blob: data,
        contentType,
        etag,
        lastModified,
      });
      await this.repository.upsertImage(newImage);
      return newImage;
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
}
