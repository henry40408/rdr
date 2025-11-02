import { z } from "zod";

const schema = z.object({
  categoryName: z.string(),
  xmlUrl: z.url(),
  htmlUrl: z.url().optional(),
});

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await requireUserSession(event);
  const userId = session.user.id;

  const body = await readValidatedBody(event, (body) => {
    console.log(">>> body", body);
    return schema.parse(body);
  });

  /** @type {Repository} */
  const repository = container.resolve("repository");
  /** @type {FeedService} */
  const feedService = container.resolve("feedService");

  const feed = new FeedEntity({
    id: 0,
    categoryId: 0,
    title: "",
    xmlUrl: body.xmlUrl,
    htmlUrl: body.htmlUrl || "",
  });

  const fetched = await feedService.fetchEntries(feed);
  feed.title = fetched.meta?.title || "(No title)";

  const feedId = await repository.createFeed(userId, body.categoryName, feed);

  return { feedId };
});
