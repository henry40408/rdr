export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const body = await readMultipartFormData(event);

  /** @type {OpmlService} */
  const opmlService = container.resolve("opmlService");

  const data = String(body?.find((b) => b.name === "file")?.data);
  if (!data) throw createError({ statusCode: 400, statusMessage: "No file uploaded" });

  await opmlService.importOpml(data);

  return true;
});
