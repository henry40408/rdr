// @ts-check

import { secondsToMilliseconds } from "date-fns";

export const usePasskeyStore = defineStore("passkey", () => {
  const passkeys = ref(
    /** @type {Awaited<ReturnType<typeof import('../../server/api/passkeys/index.get').default>>['passkeys']} */ ([]),
  );

  const { user } = useUserSession();
  const { register: registerPasskey } = useWebAuthn();

  const headers = useRequestHeaders(["cookie"]);
  const {
    data,
    refresh,
    pending: refreshing,
  } = useFetch("/api/passkeys", {
    key: "passkeys",
    headers,
    immediate: false,
    timeout: secondsToMilliseconds(30),
    watch: false,
  });

  /**
   * @param {string} displayName
   */
  async function addPasskey(displayName) {
    if (!user.value) return;
    await registerPasskey({ userName: user.value.username, displayName });
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
    addPasskey,
    deletePasskey,
    load,
  };
});
