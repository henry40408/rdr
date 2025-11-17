// @ts-check

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);
  const userId = session.user.id;

  /** @type {FeatureService} */
  const featureService = container.resolve("featureService");

  return await featureService.userFeatures(userId);
});
