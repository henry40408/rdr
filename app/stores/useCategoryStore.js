// @ts-check

export const useCategoryStore = defineStore("category", {
  state: () => ({
    /** @type {Awaited<ReturnType<typeof import('../../server/api/categories/index.get').default>>['categories']} */
    categories: [],
  }),
  actions: {
    load: async function () {
      const headers = useRequestHeaders(["cookie"]);
      const data = await $fetch("/api/categories", { headers });
      this.categories = data.categories;
    },
  },
});
