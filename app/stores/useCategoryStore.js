// @ts-check

export const HIDE_EMPTY = "settings:hide-empty";

export const useCategoryStore = defineStore("category", {
  state: () => ({
    /** @type {Awaited<ReturnType<typeof import('../../server/api/categories/index.get').default>>['categories']} */
    categories: [],
    hideEmpty: useLocalStorage(HIDE_EMPTY, false),
    keyword: "",
  }),
  hydrate(state) {
    // @ts-expect-error mismatched types
    state.hideEmpty = useLocalStorage(HIDE_EMPTY, false);
  },
  actions: {
    async loadCategories() {
      const headers = useRequestHeaders(["cookie"]);
      const { categories } = await $fetch("/api/categories", { headers });
      this.categories = categories;
    },
  },
});
