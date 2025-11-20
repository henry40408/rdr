// @ts-check

export class CategoryEntity {
  /**
   * @param {object} opts
   * @param {number} opts.id
   * @param {number} opts.userId
   * @param {string} opts.name
   * @param {FeedEntity[]} [opts.feeds]
   */
  constructor({ id, userId, name, feeds = [] }) {
    this.id = id;

    this.userId = userId;
    this.name = name;

    /** @type {FeedEntity[]} */
    this.feeds = feeds;
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
   * @param {string} [opts.lastError]
   * @param {string} [opts.date]
   * @param {number} [opts.errorCount]
   */
  constructor({
    id,
    categoryId,
    title,
    xmlUrl,
    htmlUrl,
    fetchedAt,
    etag,
    lastModified,
    lastError,
    date,
    errorCount = 0,
  }) {
    this.id = id;
    this.categoryId = categoryId;
    this.title = title;
    this.xmlUrl = xmlUrl;
    this.htmlUrl = htmlUrl;
    this.fetchedAt = fetchedAt;
    this.etag = etag;
    this.lastModified = lastModified;
    this.lastError = lastError;
    this.errorCount = errorCount;

    // virtual field, should not be stored in the database
    this.date = date;
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

export class JobEntity {
  /**
   * @param {object} opts
   * @param {number} opts.id
   * @param {string} opts.name
   * @param {string|null} [opts.pausedAt]
   * @param {string} [opts.lastDate]
   * @param {number} [opts.lastDurationMs]
   * @param {string} [opts.lastError]
   */
  constructor({ id, name, pausedAt, lastDate, lastDurationMs, lastError }) {
    this.id = id;
    this.name = name;
    this.pausedAt = pausedAt;
    this.lastDate = lastDate;
    this.lastDurationMs = lastDurationMs;
    this.lastError = lastError;
  }
}

export class PasskeyEntity {
  /**
   * @param {object} opts
   * @param {number} opts.id
   * @param {string} opts.credentialId
   * @param {number} opts.userId
   * @param {string} opts.publicKey
   * @param {number} opts.counter
   * @param {boolean} opts.backedUp
   * @param {import('@simplewebauthn/types').AuthenticatorTransportFuture[]} opts.transports
   * @param {string} [opts.displayName]
   * @param {string} [opts.createdAt]
   */
  constructor({ id, credentialId, userId, publicKey, counter, backedUp, transports, displayName, createdAt }) {
    this.id = id;
    this.credentialId = credentialId;
    this.userId = userId;
    this.publicKey = publicKey;
    this.counter = counter;
    this.backedUp = backedUp;
    this.transports = transports;
    this.displayName = displayName;
    this.createdAt = createdAt;
  }
}

export class UserEntity {
  /**
   * @param {object} opts
   * @param {number} opts.id
   * @param {string} opts.username
   * @param {number} opts.nonce
   * @param {boolean} [opts.isAdmin]
   */
  constructor({ id, username, nonce, isAdmin = false }) {
    this.id = id;
    this.username = username;
    this.nonce = nonce;
    this.isAdmin = isAdmin;
  }
}
