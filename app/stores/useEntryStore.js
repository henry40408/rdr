// @ts-check

export const useEntryStore = defineStore("entry", {
  state: () => ({
    // parameters
    status: useRoute().query.status ?? "unread",
    // result
    count: 0,
    /** @type {Awaited<ReturnType<typeof import("../../server/api/entries.get").default>>['items']} */
    items: [],
  }),
  getters: {
    query: (state) => {
      return { status: state.status };
    },
  },
  actions: {
    async load() {
      const headers = useRequestHeaders(["cookie"]);
      const query = this.query;
      const [data1, data2] = await Promise.all([
        $fetch("/api/entries/count", { headers, query }),
        $fetch("/api/entries", { headers, query }),
      ]);
      this.$patch({
        count: data1.count,
        items: data2.items,
      });
    },
    /**
     * @param {'read'|'unread'|'all'|'starred'} newStatus
     */
    async setStatus(newStatus) {
      this.status = newStatus;
      await navigateTo({ query: { status: newStatus } });
      await this.load();
    },
  },
});
