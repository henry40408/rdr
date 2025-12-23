// @ts-check

/**
 * @param {UserEntity[]} users
 * @param {boolean} multiUser
 * @param {boolean} disableSignUp
 */
function canSignup(users, multiUser, disableSignUp) {
  if (users.length <= 0) return true;
  if (!multiUser) return false;
  return !disableSignUp;
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const { container } = useNitroApp();

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const users = await repository.findUsers();
  return {
    canLogin: users.length > 0,
    canSignup: canSignup(users, config.multiUser, config.disableSignUp),
    config: {
      errorThreshold: config.errorThreshold,
      httpTimeoutMs: config.httpTimeoutMs,
      userAgent: config.userAgent,
    },
  };
});
