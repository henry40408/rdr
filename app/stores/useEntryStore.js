// @ts-check

export const useEntryStore = defineStore("entry", {
  state: () => ({
    items: [],
  }),
  getters: {
    selectedCategoryId() {
      const route = useRoute();
      return route.query.categoryId?.toString() ?? "";
    },
    selectedFeedId() {
      const route = useRoute();
      return route.query.feedId?.toString() ?? "";
    },
  },
  actions: {
    /**
     * @param {string|number} [categoryId]
     */
    selectCategory(categoryId) {
      const route = useRoute();
      const router = useRouter();
      router.replace({ query: { ...route.query, categoryId, feedId: undefined } });
    },
    /**
     * @param {string|number} [categoryId]
     * @param {string|number} [feedId]
     */
    selectFeed(categoryId, feedId) {
      const route = useRoute();
      const router = useRouter();
      router.replace({ query: { ...route.query, categoryId, feedId } });
    },
  },
});
