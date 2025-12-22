// @ts-check

export default defineEventHandler(async (event) => {
  const { container } = useNitroApp();

  const session = await validateUserNonce(event);

  /** @type {Repository} */
  const repository = container.resolve("repository");

  const username = session.user.username;
  const passkeys = await repository.findPasskeysByUsername(username);
  return { passkeys };
});
