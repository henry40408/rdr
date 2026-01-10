// @ts-check

export const useEntryStore = defineStore("entry", {
  state: () => ({
    // parameters
    status: useRoute().query.status ?? "unread",
    // result
    count: 0,
  }),
  getters: {
    query: (state) => {
      return { status: state.status };
    },
  },
  actions: {
    async loadCount() {
      const headers = useRequestHeaders(["cookie"]);
      const query = this.query;
      const data = await $fetch("/api/entries/count", { headers, query });
      this.count = data.count;
    },
    /**
     * @param {'read'|'unread'|'all'|'starred'} newStatus
     */
    async setStatus(newStatus) {
      this.status = newStatus;
      await navigateTo({ query: { status: newStatus } });
      await this.loadCount();
    },
  },
});
