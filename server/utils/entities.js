import { generateId } from "./helper";

export class Category {
  /**
   * @param {object} opts
   * @param {string} opts.name
   */
  constructor({ name }) {
    this.id = generateId(name);
    this.name = name;
    /** @type {Feed[]} */
    this.feeds = [];
  }
}

export class Feed {
  /**
   * @param {object} opts
   * @param {string} opts.title
   * @param {string} opts.xmlUrl
   * @param {string} opts.htmlUrl
   */
  constructor({ title, xmlUrl, htmlUrl }) {
    this.id = generateId(title);
    this.title = title;
    this.xmlUrl = xmlUrl;
    this.htmlUrl = htmlUrl;
  }
}

export class FeedMetadata {
  /**
   * @param {object} opts
   * @param {string} opts.feedId
   * @param {string|null} [opts.etag]
   * @param {string|null} [opts.lastModified]
   */
  constructor({ feedId, etag = null, lastModified = null }) {
    this.feedId = feedId;
    this.etag = etag;
    this.lastModified = lastModified;
  }
}
