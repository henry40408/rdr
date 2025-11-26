// @ts-check

import * as cheerio from "cheerio";
import { Agent, fetch } from "undici";
import PQueue from "p-queue";
import os from "node:os";
import retry from "p-retry";

export class DownloadService {
  /**
   * @param {object} opts
   * @param {import('nuxt/schema').RuntimeConfig} opts.config
   * @param {import('pino').Logger} opts.logger
   */
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger.child({ context: "download-service" });
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
    const headers = new Headers();
    headers.set("User-Agent", this.config.userAgent);

    if (etag) headers.set("If-None-Match", etag);
    if (lastModified) headers.set("If-Modified-Since", lastModified);
    if (userAgent) headers.set("User-Agent", userAgent);

    this.logger.debug({ url, etag, lastModified, disableHttp2, userAgent, priority });

    const dispatcher = new Agent({ allowH2: !disableHttp2, bodyTimeout: this.config.httpTimeoutMs });
    return await retry(() => this.queue.add(() => fetch(url, { headers, dispatcher }), { priority }));
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
    const headers = new Headers();
    headers.set("User-Agent", this.config.userAgent);

    if (etag) headers.set("If-None-Match", etag);
    if (lastModified) headers.set("If-Modified-Since", lastModified);
    if (userAgent) headers.set("User-Agent", userAgent);

    this.logger.debug({ url, etag, lastModified, disableHttp2, userAgent, priority });

    const dispatcher = new Agent({ allowH2: !disableHttp2, bodyTimeout: this.config.httpTimeoutMs });
    return await retry(() => this.queue.add(() => fetch(url, { headers, dispatcher }), { priority }));
  }

  /**
   * @param {object} opts
   * @param {string} opts.htmlUrl
   * @param {boolean} [opts.disableHttp2]
   * @returns {Promise<string|undefined>}
   */
  async findFavicon({ htmlUrl, disableHttp2 }) {
    try {
      const headers = new Headers();
      headers.set("User-Agent", this.config.userAgent);

      const dispatcher = new Agent({ allowH2: !disableHttp2, bodyTimeout: this.config.httpTimeoutMs });
      const content = await retry(() => fetch(htmlUrl, { headers, dispatcher }).then((res) => res.text()));
      const $ = cheerio.load(content);
      const href =
        $('link[rel="icon"]').attr("href") ??
        $('link[rel="shortcut icon"]').attr("href") ??
        $('link[rel="apple-touch-icon"]').attr("href");
      if (href) return String(new URL(href, htmlUrl));
      return undefined;
    } catch (err) {
      this.logger.error(err);
      this.logger.error({ msg: "Failed to find favicon", htmlUrl });
      return undefined;
    }
  }
}
