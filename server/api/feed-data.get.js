export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const feedIds = opmlService.categories.flatMap((c) => c.feeds).map((f) => f.id);
  const [counts, allMetadata, imagePks] = await Promise.all([
    repository.countEntriesByFeedIds(feedIds),
    repository.listFeedMetadata(),
    repository.listImagePks(),
  ]);

  /** @type {Record<string,{count:number,imageExists:boolean,metadata:FeedMetadataEntity}>} */
  const feeds = {};
  for (const feedId of feedIds) {
    const imagePk = buildFeedImageExternalId(feedId);
    if (typeof counts[feedId] === "undefined") continue;

    const metadata = allMetadata.find((m) => m.feedId === feedId);
    if (typeof metadata === "undefined") continue;

    feeds[feedId] = {
      count: counts[feedId],
      imageExists: imagePks.includes(imagePk),
      metadata: metadata,
    };
  }

  return { feeds };
});
