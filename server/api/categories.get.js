export default defineEventHandler(() => {
  const app = useNitroApp();
  return app.opmlService.categories;
});
