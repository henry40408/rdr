export class ImageService {
  /**
   * @param {object} opts
   * @param {DownloadService} opts.downloadService
   * @param {import('pino').Logger} opts.logger
   * @param {Repository} opts.repository
   */
  constructor({ downloadService, logger, repository }) {
    this.downloadService = downloadService;
    this.logger = logger.child({ context: "image-service" });
    this.repository = repository;
  }

  /**
   * @param {string} externalId
   * @param {string} url
   * @returns {Promise<ImageEntity|undefined>}
   */
  async download(externalId, url) {
    const logger = this.logger.child({ externalId });
    try {
      const existing = await this.repository.findImageByExternalId(externalId);

      /** @type {Record<string, string>} */
      const headers = {};
      if (existing) {
        if (existing.etag) headers["If-None-Match"] = existing.etag;
        if (existing.lastModified) headers["If-Modified-Since"] = existing.lastModified;
      }
      const res = await this.downloadService.downloadBinary({
        url,
        etag: existing?.etag,
        lastModified: existing?.lastModified,
      });
      if (!res) {
        logger.warn({ msg: "Response is undefined", url });
        return existing;
      }
      if (res.statusCode === 304) {
        logger.debug({ msg: "Image not modified", url });
        return existing;
      }

      const data = res.body;
      if (data.length === 0) {
        logger.warn({ msg: "Image response is empty", url });
        return existing;
      }

      const contentType = res.headers["content-type"] || "application/octet-stream";
      const etag = res.headers["etag"] || undefined;
      const lastModified = res.headers["last-modified"] || undefined;

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
      return undefined;
    }
  }
}
