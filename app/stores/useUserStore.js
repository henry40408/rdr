// @ts-check

export const useUserStore = defineStore("user", () => {
  /** @type {Ref<Awaited<ReturnType<typeof import('../../server/api/users/index.get').default>>['users']>} */
  const users = ref([]);

  const { data, execute } = useFetch("/api/users", { immediate: false });
  async function load() {
    await execute();
    users.value = data.value?.users ?? [];
  }

  return {
    users,
    load,
  };
});
