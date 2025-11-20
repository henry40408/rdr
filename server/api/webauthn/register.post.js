// @ts-check

export default defineWebAuthnRegisterEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    const { container } = useNitroApp();

    /** @type {import('lru-cache').LRUCache<string,string>} */
    const challengeCache = container.resolve("challengeCache");

    challengeCache.set(`auth:challenge:${attemptId}`, challenge);
  },
  async getChallenge(event, attemptId) {
    const { container } = useNitroApp();

    /** @type {import('lru-cache').LRUCache<string,string>} */
    const challengeCache = container.resolve("challengeCache");

    const challenge = challengeCache.get(`auth:challenge:${attemptId}`);
    if (!challenge) throw createError({ statusCode: 400, statusMessage: "Challenge not found or expired" });

    challengeCache.delete(`auth:challenge:${attemptId}`);
    return challenge;
  },
  validateUser: (user) => Promise.resolve(!!user.userName),
  onSuccess: async (event, { user, credential }) => {
    const { container } = useNitroApp();

    /** @type {Repository} */
    const repository = container.resolve("repository");

    const found = await repository.findUserByUsername(user.userName);
    if (!found) throw createError({ statusCode: 404, statusMessage: "User not found" });

    const passkey = new PasskeyEntity({
      id: 0,
      userId: found.id,
      credentialId: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports ?? [],
      displayName: user.displayName,
    });
    await repository.createPasskey(passkey);

    await setUserSession(event, {
      user: { id: found.id, username: found.username, nonce: found.nonce },
      loggedInAt: new Date(),
    });
  },
  excludeCredentials: async (event, userName) => {
    const { container } = useNitroApp();

    /** @type {Repository} */
    const repository = container.resolve("repository");

    const passkeys = await repository.findPasskeysByUsername(userName);
    return passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports,
    }));
  },
});
