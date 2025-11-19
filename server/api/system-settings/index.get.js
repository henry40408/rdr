// @ts-check

/**
 * @param {UserEntity[]} users
 * @param {boolean} singleUser
 * @param {boolean} disableSignUp
 */
function canSignup(users, singleUser, disableSignUp) {
  if (users.length <= 0) return true;
  if (singleUser) return false;
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
    canSignup: canSignup(users, config.singleUser, config.disableSignUp),
  };
});
