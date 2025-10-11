export class CategoryEntity {
  /**
   * @param {object} opts
   * @param {number} opts.id
   * @param {string} opts.name
   * @param {FeedEntity[]} [opts.feeds]
   */
  constructor({ id, name, feeds = [] }) {
    this.id = id;
    this.name = name;
    /** @type {FeedEntity[]} */
    this.feeds = feeds;
  }
}

export class FeedEntity {
  /**
   * @param {object} opts
   * @param {number} opts.id
   * @param {number} opts.categoryId
   * @param {string} opts.title
   * @param {string} opts.xmlUrl
   * @param {string} opts.htmlUrl
   * @param {string} [opts.fetchedAt]
   * @param {string} [opts.etag]
   * @param {string} [opts.lastModified]
   */
  constructor({ id, categoryId, title, xmlUrl, htmlUrl, fetchedAt, etag, lastModified }) {
    this.id = id;
    this.categoryId = categoryId;
    this.title = title;
    this.xmlUrl = xmlUrl;
    this.htmlUrl = htmlUrl;
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
   * @param {string} [opts.etag]
   * @param {string} [opts.lastModified]
   */
  constructor({ externalId, url, blob, contentType, etag, lastModified }) {
    this.externalId = externalId;

    this.url = url;
    this.blob = blob;
    this.contentType = contentType;

    this.etag = etag;
    this.lastModified = lastModified;
  }
}

export class EntryEntity {
  /**
   * @param {object} opts
   * @param {number} opts.id
   * @param {number} opts.feedId
   * @param {string} opts.guid
   * @param {string} opts.title
   * @param {string} opts.link
   * @param {string} opts.date
   * @param {string} [opts.author]
   * @param {string} [opts.readAt]
   * @param {string} [opts.starredAt]
   */
  constructor({ id, feedId, guid, title, link, date, author, readAt, starredAt }) {
    this.id = id;
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
