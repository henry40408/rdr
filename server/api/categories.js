export default defineEventHandler(() => {
  const app = useNitroApp();
  return app.categories;
});
