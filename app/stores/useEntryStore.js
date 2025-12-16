// @ts-check

export const useEntryStore = defineStore("entry", {
  state: () => {
    const route = useRoute();
    return {
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
      return {
        limit: state.limit,
        selectedType: this.selectedType,
        selectedId: this.selectedId,
        status: state.status,
      };
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
    },
    /**
     * @param {string|number} [categoryId]
     */
    async selectCategory(categoryId) {
      const route = useRoute();
      const router = useRouter();
      router.replace({ query: { ...route.query, categoryId, feedId: undefined } });

      this.selectedCategoryId = categoryId?.toString();
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
      await this.loadEntries();
    },
  },
});
