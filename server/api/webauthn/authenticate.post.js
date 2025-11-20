// @ts-check

export default defineWebAuthnAuthenticateEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    const { container } = useNitroApp();

    const challengeCache = container.resolve("challengeCache");
    challengeCache.set(`auth:challenge:${attemptId}`, challenge);
  },
  async getChallenge(event, attemptId) {
    const { container } = useNitroApp();

    const challengeCache = container.resolve("challengeCache");
    const challenge = challengeCache.get(`auth:challenge:${attemptId}`);
    if (!challenge) throw createError({ statusCode: 400, statusMessage: "Challenge not found" });

    challengeCache.delete(`auth:challenge:${attemptId}`);
    return challenge;
  },
  async allowCredentials(event, userName) {
    const { container } = useNitroApp();

    /** @type {Repository} */
    const repository = container.resolve("repository");

    const passkeys = await repository.findPasskeysByUsername(userName);
    return passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports,
    }));
  },
  async getCredential(event, credentialId) {
    const { container } = useNitroApp();

    /** @type {Repository} */
    const repository = container.resolve("repository");

    const passkey = await repository.findPasskeyByCredentialId(credentialId);
    if (!passkey) throw createError({ statusCode: 401, statusMessage: "Invalid passkey" });

    return {
      id: passkey.credentialId,
      userId: passkey.userId,
      publicKey: passkey.publicKey,
      counter: passkey.counter,
      backedUp: passkey.backedUp,
      transports: passkey.transports,
    };
  },
  async onSuccess(event, { credential }) {
    const { container } = useNitroApp();

    /** @type {Repository} */
    const repository = container.resolve("repository");

    const passkey = await repository.findPasskeyByCredentialId(credential.id);
    if (!passkey) throw createError({ statusCode: 401, statusMessage: "Invalid passkey" });

    const user = await repository.findUserById(passkey.userId);
    if (!user) throw createError({ statusCode: 401, statusMessage: "Invalid passkey" });

    await setUserSession(event, {
      user: {
        id: user.id,
        username: user.username,
        nonce: user.nonce,
      },
      loggedInAt: new Date(),
    });
  },
});
