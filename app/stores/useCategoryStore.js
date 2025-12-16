// @ts-check

export const useCategoryStore = defineStore("category", {
  state: () => ({
    /** @type {Awaited<ReturnType<typeof import('../../server/api/categories/index.get').default>>['categories']} */
    categories: [],
  }),
  actions: {
    async loadCategories() {
      const headers = useRequestHeaders(["cookie"]);
      const { categories } = await $fetch("/api/categories", { headers });
      this.categories = categories;
    },
  },
});
