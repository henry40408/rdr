export class CategoryEntity {
  /**
   * @param {object} opts
   * @param {string} opts.name
   */
  constructor({ name }) {
    this.id = generateId(name);
    this.name = name;
    /** @type {FeedEntity[]} */
    this.feeds = [];
  }
}

export class FeedEntity {
  /**
   * @param {object} opts
   * @param {string} opts.title
   * @param {string} opts.xmlUrl
   * @param {string} opts.htmlUrl
   */
  constructor({ title, xmlUrl, htmlUrl }) {
    this.id = generateId(xmlUrl);
    this.title = title;
    this.xmlUrl = xmlUrl;
    this.htmlUrl = htmlUrl;
  }
}

export class FeedMetadataEntity {
  /**
   * @param {object} opts
   * @param {string} opts.feedId
   * @param {string} [opts.fetchedAt]
   * @param {string} [opts.etag]
   * @param {string} [opts.lastModified]
   */
  constructor({ feedId, fetchedAt, etag, lastModified }) {
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

/**
 * @param {string} feedId
 * @param {string} guid
 * @returns {string}
 */
export function generateEntryId(feedId, guid) {
  return generateId(`${feedId}|${guid}`);
}

export class EntryEntity {
  /**
   * @param {object} opts
   * @param {string} opts.feedId
   * @param {string} opts.guid
   * @param {string} opts.title
   * @param {string} opts.link
   * @param {string} opts.date
   * @param {string} [opts.author]
   * @param {string} [opts.readAt]
   * @param {string} [opts.starredAt]
   */
  constructor({ feedId, guid, title, link, date, author, readAt, starredAt }) {
    this.id = generateEntryId(feedId, guid);
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
