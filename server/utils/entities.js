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
   * @param {string|null} [opts.fetchedAt]
   * @param {string|null} [opts.etag]
   * @param {string|null} [opts.lastModified]
   */
  constructor({ feedId, fetchedAt = null, etag = null, lastModified = null }) {
    this.feedId = feedId;
    this.fetchedAt = fetchedAt;
    this.etag = etag;
    this.lastModified = lastModified;
  }
}

export class ImageEntity {
  /**
   * @param {object} opts
   * @param {string} opts.externalId
   * @param {string} opts.url
   * @param {Buffer} opts.blob
   * @param {string} opts.contentType
   * @param {string|null} [opts.etag]
   * @param {string|null} [opts.lastModified]
   */
  constructor({ externalId, url, blob, contentType, etag = null, lastModified = null }) {
    this.externalId = externalId;

    this.url = url;
    this.blob = blob;
    this.contentType = contentType;

    this.etag = etag;
    this.lastModified = lastModified;
  }
}

export class PartialEntry {
  /**
   * @param {object} opts
   * @param {string} opts.feedId
   * @param {string} opts.guid
   * @param {string} opts.title
   * @param {string} opts.link
   * @param {string} opts.date
   * @param {string|null} [opts.author]
   * @param {string|null} [opts.readAt]
   * @param {string|null} [opts.starredAt]
   */
  constructor({ feedId, guid, title, link, date, author = null, readAt = null, starredAt = null }) {
    this.feedId = feedId;
    this.guid = guid;

    this.title = title;
    this.link = link;
    this.date = date;

    this.author = author;

    this.readAt = readAt;
    this.starredAt = starredAt;
  }
}
