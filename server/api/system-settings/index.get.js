export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const { container } = useNitroApp();

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const users = await repository.findUsers();
  const noUsers = users.length <= 0;
  const canSignup = noUsers && !config.singleUser && !config.disableSignUp;
  return {
    canLogin: !noUsers,
    canSignup,
  };
});
