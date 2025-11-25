// @ts-check

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
   * @param {object} opts
   * @param {number} opts.userId
   * @param {string} opts.externalId
   * @param {string} opts.url
   * @param {boolean} opts.disableHttp2
   * @param {string} [opts.userAgent]
   * @returns {Promise<ImageEntity|undefined>}
   */
  async download({ userId, externalId, url, disableHttp2, userAgent }) {
    const logger = this.logger.child({ externalId });
    try {
      const parsed = new URL(url);
      // @ts-check
      if (parsed.protocol === "data:") {
        const parsedData = parseDataURL(url);
        const newImage = new ImageEntity({
          externalId,
          url,
          blob: parsedData.data,
          contentType: parsedData.mediaType,
          etag: undefined,
          lastModified: undefined,
        });
        await this.repository.upsertImage(userId, newImage);
        return newImage;
      }

      const existing = await this.repository.findImageByExternalId(userId, externalId);
      const res = await this.downloadService.downloadBinary({
        url,
        etag: existing?.etag,
        lastModified: existing?.lastModified,
        disableHttp2,
        userAgent,
        priority: Number.MIN_SAFE_INTEGER, // lowerest priority
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

      const contentType = res.headers["content-type"] ?? "application/octet-stream";
      if (ImageService._isNotImageOrBinary(contentType)) {
        logger.warn({ msg: "Content-Type is not image or binary", url, contentType });
        return existing;
      }

      const etag = res.headers["etag"];
      const lastModified = res.headers["last-modified"];

      const newImage = new ImageEntity({
        externalId,
        url,
        blob: data,
        contentType,
        etag,
        lastModified,
      });
      await this.repository.upsertImage(userId, newImage);
      return newImage;
    } catch (err) {
      this.logger.error(err);
      this.logger.error({ msg: "Failed to download image", externalId, url });
      return undefined;
    }
  }

  /**
   * @param {string} contentType
   * @returns {boolean}
   */
  static _isNotImageOrBinary(contentType) {
    const trimmed = (contentType.split(";")[0] ?? "").trim().toLowerCase();
    return !trimmed.startsWith("image/") && trimmed !== "application/octet-stream";
  }
}
