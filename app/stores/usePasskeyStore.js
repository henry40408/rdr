// @ts-check

export const usePasskeyStore = defineStore("passkey", () => {
  const passkeys = ref(
    /** @type {Awaited<ReturnType<typeof import('../../server/api/passkeys/index.get').default>>['passkeys']} */ ([]),
  );

  const { user } = useUserSession();
  const { register } = useWebAuthn();

  const headers = useRequestHeaders(["cookie"]);
  const {
    data,
    refresh,
    pending: refreshing,
  } = useFetch("/api/passkeys", {
    key: "passkeys",
    headers,
    immediate: false,
    watch: false,
  });

  /**
   * @param {string} displayName
   */
  async function registerPasskey(displayName) {
    if (!user.value) return;
    await register({ userName: user.value.username, displayName });
    await refresh();
  }

  /**
   * @param {number} id
   */
  async function deletePasskey(id) {
    await $fetch(`/api/passkeys/${id}`, { method: "DELETE", headers });
    await refresh();
  }

  async function load() {
    await refresh();
    passkeys.value = data.value?.passkeys ?? [];
  }

  return {
    passkeys,
    refreshing,
    registerPasskey,
    deletePasskey,
    load,
  };
});
