// @ts-check

export const useEntryStore = defineStore("entry", {
  state: () => {
    const route = useRoute();
    return {
      /** @type { {date:string,id:number} | undefined } */
      cursor: undefined,
      hasMore: true,
      limit: 30,
      /** @type {Awaited<ReturnType<typeof import('../../server/api/entries.get').default>>['items']} */
      items: [],
      selectedFeedId: route.query.feedId?.toString(),
      selectedCategoryId: route.query.categoryId?.toString(),
      status: "unread",
    };
  },
  getters: {
    /**
     * @returns {Record<string, unknown>}
     */
    query(state) {
      /** @type {Record<String,unknown>} */
      const q = {
        limit: state.limit,
        selectedType: this.selectedType,
        selectedId: this.selectedId,
        status: state.status,
      };
      if (state.cursor) {
        q.cursor = state.cursor.date;
        q.id = state.cursor.id;
      }
      return q;
    },
    /**
     * @returns {string|undefined}
     */
    selectedId(state) {
      return state.selectedFeedId ?? state.selectedCategoryId;
    },
    /**
     * @returns {"category"|"feed"|undefined}
     */
    selectedType() {
      if (this.selectedFeedId) return "feed";
      if (this.selectedCategoryId) return "category";
      return undefined;
    },
  },
  actions: {
    async loadEntries() {
      const headers = useRequestHeaders(["cookie"]);
      const query = this.query;
      const { items } = await $fetch("/api/entries", { headers, query });
      this.items = items;
      this.hasMore = items.length === this.limit;
    },
    async loadMore() {
      const lastItem = this.items[this.items.length - 1];
      if (!lastItem) return;

      this.cursor = { date: lastItem.entry.date, id: lastItem.entry.id };
      const headers = useRequestHeaders(["cookie"]);
      const query = this.query;
      const { items } = await $fetch("/api/entries", { headers, query });

      for (const item of items) this.items.push(item);
      this.hasMore = items.length === this.limit;
    },
    /**
     * @param {string|number} [categoryId]
     */
    async selectCategory(categoryId) {
      const route = useRoute();
      const router = useRouter();
      router.replace({ query: { ...route.query, categoryId, feedId: undefined } });

      this.selectedCategoryId = categoryId?.toString();
      this.selectedFeedId = undefined;
      this.cursor = undefined;
      await this.loadEntries();
    },
    /**
     * @param {string|number} [categoryId]
     * @param {string|number} [feedId]
     */
    async selectFeed(categoryId, feedId) {
      const route = useRoute();
      const router = useRouter();
      router.replace({ query: { ...route.query, categoryId, feedId } });

      this.selectedCategoryId = categoryId?.toString();
      this.selectedFeedId = feedId?.toString();
      this.cursor = undefined;
      await this.loadEntries();
    },
  },
});
