declare module "nitropack" {
  interface NitroApp {
    feedService: import("../server/plugins/15.feed-service").FeedService;
    opmlService: import("../server/plugins/10.opml-service").OpmlService;
    repository: import("../server/plugins/20.repository").Repository;
    logger: import("pino").Logger;
  }
}

export {};
