// @ts-check

import retry from "p-retry";
import { z } from "zod";

const schema = z.object({ entryId: z.coerce.number() });

/**
 * @typedef {object} KagiSummarizationResponse
 * @property {string} output_text
 * @property {object} output_data
 * @property {string} output_data.status
 * @property {object} output_data.word_stats
 * @property {number} output_data.word_stats.n_tokens
 * @property {number} output_data.word_stats.n_words
 * @property {number} output_data.word_stats.n_pages
 * @property {number} output_data.word_stats.time_saved
 * @property {any} output_data.word_stats.length
 * @property {number} output_data.elapsed_seconds
 * @property {string} output_data.markdown
 * @property {object} output_data.response_metadata
 * @property {number} output_data.response_metadata.speed
 * @property {number} output_data.response_metadata.tokens
 * @property {number} output_data.response_metadata.total_time_second
 * @property {string} output_data.response_metadata.model
 * @property {string} output_data.response_metadata.version
 * @property {number} output_data.response_metadata.cost
 * @property {Array<any>} output_data.images
 * @property {string} output_data.title
 * @property {string|null} output_data.authors
 * @property {string} output_data.favicon_url
 * @property {number} tokens
 * @property {string} type
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  const { entryId } = await getValidatedRouterParams(event, (params) => schema.parse(params));

  /** @type {DownloadService} */
  const downloadService = container.resolve("downloadService");
  /** @type {import('pino').Logger} */
  const logger = container.resolve("logger");
  /** @type {Repository} */
  const repository = container.resolve("repository");

  const entry = await repository.findEntryById(userId, entryId);
  if (!entry) throw createError({ statusCode: 404, statusMessage: "Entry not found." });

  const settings = await repository.findUserSettings(userId);
  const kagiSessionLink = settings.kagiSessionLink;
  if (!kagiSessionLink) throw createError({ statusCode: 503, statusMessage: "Kagi session link is not configured." });

  const parsed = new URL(kagiSessionLink);
  const token = parsed.searchParams.get("token");
  if (!token) throw createError({ statusCode: 503, statusMessage: "Kagi session link is invalid." });

  const url = new URL("https://kagi.com/mother/summary_labs");
  url.searchParams.set("summary_type", "summary");
  url.searchParams.set("target_language", settings.kagiLanguage ?? "EN");
  url.searchParams.set("url", entry.link);

  const headers = new Headers();
  headers.set("Authorization", token);

  const res = await retry(() =>
    downloadService.queue.add(() => fetch(url, { headers, signal: AbortSignal.timeout(config.httpTimeoutMs) })),
  );
  if (!res.ok) {
    logger.error({ status: res.status, statusText: res.statusText, body: await res.text() });
    throw createError({ statusCode: 500, statusMessage: "Failed to fetch summarization from Kagi." });
  }

  /** @type {KagiSummarizationResponse} */
  const data = await res.json();
  if (!data || data.output_data.status !== "completed")
    throw createError({ statusCode: 500, statusMessage: "Failed to get summarization from Kagi." });

  return data.output_data.markdown;
});
