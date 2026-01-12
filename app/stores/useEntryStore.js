// @ts-check

export const useEntryStore = defineStore("entry", {
  state: () => {
    const route = useRoute();
    return {
      // parameters
      /** @type {number[]} */
      readIds: [],
      selectedCategoryId: (route.query.categoryId && String(route.query.categoryId)) ?? undefined,
      selectedFeedId: (route.query.feedId && String(route.query.feedId)) ?? undefined,
      status: (route.query.status && String(route.query.status)) ?? "unread",
      // result
      count: 0,
      /** @type {Awaited<ReturnType<typeof import("../../server/api/entries.get").default>>['items']} */
      items: [],
      pending: false,
    };
  },
  getters: {
    query: (state) => {
      const q = {};
      if (state.selectedCategoryId) {
        q.selectedType = "category";
        q.selectedId = state.selectedCategoryId;
      }
      if (state.selectedFeedId) {
        q.selectedType = "feed";
        q.selectedId = state.selectedFeedId;
      }
      q.status = state.status;
      return q;
    },
    selectedCategory: (state) => {
      if (!state.selectedCategoryId) return undefined;
      const categoryStore = useCategoryStore();
      return categoryStore.categories.find((c) => String(c.id) === state.selectedCategoryId);
    },
    selectedFeed: (state) => {
      if (!state.selectedFeedId) return undefined;
      const categoryStore = useCategoryStore();
      const feeds = categoryStore.categories.flatMap((c) => c.feeds);
      return feeds.find((f) => String(f.id) === state.selectedFeedId);
    },
  },
  actions: {
    async load() {
      const headers = useRequestHeaders(["cookie"]);
      const query = this.query;

      this.pending = true;
      const [data1, data2] = await Promise.all([
        $fetch("/api/entries/count", { headers, query }),
        $fetch("/api/entries", { headers, query }),
      ]);
      this.pending = false;

      this.$patch({
        count: data1.count,
        items: data2.items,
        readIds: data2.items.map((i) => (i.entry.readAt ? i.entry.id : undefined)).filter((i) => !!i),
      });
    },
    /**
     * @param {number|undefined} categoryId
     */
    async setCategory(categoryId) {
      this.selectedCategoryId = categoryId === undefined ? undefined : String(categoryId);
      this.selectedFeedId = undefined;
      await this.updateRoute();
      await this.load();
    },
    /**
     * @param {number|undefined} feedId
     * @param {number|undefined} categoryId
     */
    async setFeed(feedId, categoryId) {
      this.selectedFeedId = feedId === undefined ? undefined : String(feedId);
      this.selectedCategoryId = categoryId === undefined ? undefined : String(categoryId);
      await this.updateRoute();
      await this.load();
    },
    /**
     * @param {'read'|'unread'|'all'|'starred'} status
     */
    async setStatus(status) {
      this.status = status;
      await this.updateRoute();
      await this.load();
    },
    async updateRoute() {
      const categoryId = this.selectedCategoryId;
      const feedId = this.selectedFeedId;
      const status = this.status;
      await navigateTo({ query: { categoryId, feedId, status } });
    },
    /**
     * @param {number} entryId
     * @param {'read'|'unread'|'starred'|'unstarred'} status
     */
    async updateStatus(entryId, status) {
      const { updated } = await $fetch("/api/entries/status", {
        method: "PUT",
        body: { status, entryIds: [entryId] },
      });
      if (updated > 0) {
        if (status === "read") this.readIds.push(entryId);
        if (status !== "unread") this.readIds = this.readIds.filter((id) => id !== entryId);
      }
    },
  },
});
