// @ts-check

import * as cheerio from "cheerio";
import PQueue from "p-queue";
import got from "got";
import os from "node:os";

export class DownloadService {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {import('pino').Logger} opts.logger
   */
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger.child({ context: "download-service" });

    this.client = got.extend({
      headers: { "User-Agent": this.config.userAgent },
      timeout: { request: this.config.httpTimeoutMs },
    });
    this.queue = new PQueue({ concurrency: os.cpus().length });
  }

  /**
   * @param {object} params
   * @param {string} params.url
   * @param {string} [params.etag]
   * @param {string} [params.lastModified]
   * @param {boolean} [params.disableHttp2]
   * @param {string} [params.userAgent]
   * @param {number} [params.priority=0]
   */
  async downloadBinary({ url, etag, lastModified, disableHttp2, userAgent, priority = 0 }) {
    /** @type {Record<string, string>} */
    const headers = {};
    if (etag) headers["If-None-Match"] = etag;
    if (lastModified) headers["If-Modified-Since"] = lastModified;
    if (userAgent) headers["User-Agent"] = userAgent;
    return await this.queue.add(() => this.client.get(url, { responseType: "buffer", headers, http2: !disableHttp2 }), {
      priority,
    });
  }

  /**
   * @param {object} params
   * @param {string} params.url
   * @param {string} [params.etag]
   * @param {string} [params.lastModified]
   * @param {boolean} [params.disableHttp2]
   * @param {string} [params.userAgent]
   * @param {number} [params.priority=0]
   */
  async downloadText({ url, etag, lastModified, disableHttp2, userAgent, priority = 0 }) {
    /** @type {Record<string, string>} */
    const headers = {};
    if (etag) headers["If-None-Match"] = etag;
    if (lastModified) headers["If-Modified-Since"] = lastModified;
    if (userAgent) headers["User-Agent"] = userAgent;
    return await this.queue.add(() => this.client.get(url, { responseType: "text", headers, http2: !disableHttp2 }), {
      priority,
    });
  }

  /**
   * @param {string} htmlUrl
   * @returns {Promise<string|undefined>}
   */
  async findFavicon(htmlUrl) {
    try {
      const content = await this.client.get(htmlUrl, {}).text();
      const $ = cheerio.load(content);
      const href =
        $('link[rel="icon"]').attr("href") ??
        $('link[rel="shortcut icon"]').attr("href") ??
        $('link[rel="apple-touch-icon"]').attr("href");
      if (href) return new URL(href, htmlUrl).toString();
      return undefined;
    } catch (err) {
      this.logger.error(err);
      this.logger.error({ msg: "Failed to find favicon", htmlUrl });
      return undefined;
    }
  }
}
