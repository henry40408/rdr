// @ts-check

const DEFAULT_STATUS = "unread";

const useRouteStore = defineStore("route", {
  getters: {
    search() {
      const route = useRoute();
      return (route.query.search && String(route.query.search)) ?? "";
    },
    selectedCategoryId() {
      const route = useRoute();
      return (route.query.categoryId && String(route.query.categoryId)) ?? undefined;
    },
    selectedFeedId() {
      const route = useRoute();
      return (route.query.feedId && String(route.query.feedId)) ?? undefined;
    },
    status() {
      const route = useRoute();
      return (route.query.status && String(route.query.status)) ?? DEFAULT_STATUS;
    },
  },
});

export const useEntryStore = defineStore("entry", {
  state: () => ({
    // parameters
    limit: 30,
    // result
    count: 0,
    error: "",
    hasMore: true,
    items: /** @type {Awaited<ReturnType<typeof import("../../server/api/entries.get").default>>['items']} */ ([]),
    pending: false,
    readIds: /** @type {number[]} */ ([]),
    starredIds: /** @type {number[]} */ ([]),
  }),
  getters: {
    selectedCategory() {
      const routeStore = useRouteStore();
      if (!routeStore.selectedCategoryId) return undefined;
      const categoryStore = useCategoryStore();
      return categoryStore.categories.find((c) => String(c.id) === routeStore.selectedCategoryId);
    },
    selectedFeed() {
      const routeStore = useRouteStore();
      if (!routeStore.selectedFeedId) return undefined;
      const categoryStore = useCategoryStore();
      const feeds = categoryStore.categories.flatMap((c) => c.feeds);
      return feeds.find((f) => String(f.id) === routeStore.selectedFeedId);
    },
    query(state) {
      const routeStore = useRouteStore();
      /** @type {Record<string, unknown>} */
      const q = {};
      if (routeStore.selectedCategoryId) {
        q.selectedType = "category";
        q.selectedId = routeStore.selectedCategoryId;
      }
      if (routeStore.selectedFeedId) {
        q.selectedType = "feed";
        q.selectedId = routeStore.selectedFeedId;
      }
      q.limit = state.limit;
      if (routeStore.search) q.search = routeStore.search;
      q.status = routeStore.status;
      return q;
    },
  },
  actions: {
    async load({ clearItems = false } = {}) {
      const categoryStore = useCategoryStore();

      const headers = useRequestHeaders(["cookie"]);
      const query = this.query;

      this.$patch({ error: "", pending: true });
      try {
        const [data1, data2] = await Promise.all([
          $fetch("/api/entries/count", { headers, query }),
          $fetch("/api/entries", { headers, query }),
          categoryStore.load(),
        ]);
        this.$patch((state) => {
          if (clearItems) {
            state.items = [];
            state.hasMore = true;
          }

          const newItems = this.items.slice();
          for (const item of data2.items) {
            if (newItems.find((i) => i.entry.id === item.entry.id)) continue;
            newItems.push(item);
          }

          state.count = data1.count;
          state.hasMore = data2.items.length === state.limit;
          state.items = newItems;
          state.readIds = data2.items.filter((i) => i.entry.readAt).map((i) => i.entry.id);
          state.starredIds = data2.items.filter((i) => i.entry.starredAt).map((i) => i.entry.id);
        });
      } catch (err) {
        this.error = String(err);
      } finally {
        this.pending = false;
      }
    },
    async loadMore() {
      if (!this.hasMore) return;

      const lastItem = this.items[this.items.length - 1];
      if (!lastItem) return;

      const headers = useRequestHeaders(["cookie"]);

      const query = this.query;
      query.cursor = lastItem.entry.date;
      query.id = lastItem.entry.id;

      this.$patch({ error: "", pending: true });
      try {
        const data = await $fetch("/api/entries", { headers, query });
        this.$patch((state) => {
          const newItems = state.items.slice();
          for (const item of data.items) {
            if (newItems.find((i) => i.entry.id === item.entry.id)) continue;
            newItems.push(item);
          }
          state.hasMore = data.items.length === state.limit;
          state.items = newItems;
        });
      } catch (err) {
        this.error = String(err);
      } finally {
        this.pending = false;
      }
    },
    /**
     * @param {number|undefined} categoryId
     */
    async setCategory(categoryId) {
      const route = useRoute();
      await navigateTo({ query: { ...route.query, categoryId, feedId: undefined } });
      await this.load({ clearItems: true });
    },
    /**
     * @param {number|undefined} feedId
     * @param {number|undefined} categoryId
     */
    async setFeed(feedId, categoryId) {
      const route = useRoute();
      await navigateTo({ query: { ...route.query, categoryId, feedId } });
      await this.load({ clearItems: true });
    },
    /**
     * @param {string} search
     */
    async setSearch(search) {
      const route = useRoute();
      await navigateTo({ query: { ...route.query, search: search === "" ? undefined : search } });
      await this.load({ clearItems: true });
    },
    /**
     * @param {'read'|'unread'|'all'|'starred'} status
     */
    async setStatus(status) {
      const route = useRoute();
      await navigateTo({ query: { ...route.query, status: status === DEFAULT_STATUS ? undefined : status } });
      await this.load({ clearItems: true });
    },
    /**
     * @param {number} entryId
     * @param {'read'|'unread'|'starred'|'unstarred'} status
     */
    async updateStatus(entryId, status) {
      const categoryStore = useCategoryStore();

      const { updated } = await $fetch("/api/entries/status", {
        method: "PUT",
        body: { status, entryIds: [entryId] },
      });
      if (updated === 0) return;

      const query = this.query;
      const [data] = await Promise.all([$fetch("/api/entries/count", { query }), categoryStore.load()]);
      this.$patch((state) => {
        state.count = data.count;
        if (status === "read" && !state.readIds.includes(entryId)) state.readIds.push(entryId);
        if (status === "unread") state.readIds = state.readIds.filter((id) => id !== entryId);
        if (status === "starred" && !state.starredIds.includes(entryId)) state.starredIds.push(entryId);
        if (status === "unstarred") state.starredIds = state.starredIds.filter((id) => id !== entryId);
      });
    },
  },
});
