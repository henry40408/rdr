// @ts-check

export const useCategoryStore = defineStore("category", {
  state: () => ({
    /** @type {Awaited<ReturnType<typeof import('../../server/api/categories/index.get').default>>['categories']} */
    categories: [],
  }),
  getters: {
    sortedCategories: (state) => {
      const localSettings = useLocalSettings();
      switch (localSettings.categoriesSort) {
        case "name_asc":
          return state.categories
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => {
              c.feeds = c.feeds.slice().sort((a, b) => a.title.localeCompare(b.title));
              return c;
            });
        case "name_desc":
          return state.categories
            .slice()
            .sort((a, b) => b.name.localeCompare(a.name))
            .map((c) => {
              c.feeds = c.feeds.slice().sort((a, b) => b.title.localeCompare(a.title));
              return c;
            });
        case "unread_asc":
          return state.categories
            .slice()
            .sort((a, b) => {
              const aCount = a.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
              const bCount = b.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
              return aCount - bCount;
            })
            .map((c) => {
              c.feeds = c.feeds.slice().sort((a, b) => a.unreadCount - b.unreadCount);
              return c;
            });
        case "unread_desc":
        default:
          return state.categories
            .slice()
            .sort((a, b) => {
              const aCount = a.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
              const bCount = b.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
              return bCount - aCount;
            })
            .map((c) => {
              c.feeds = c.feeds.slice().sort((a, b) => b.unreadCount - a.unreadCount);
              return c;
            });
      }
    },
  },
  actions: {
    load: async function () {
      const headers = useRequestHeaders(["cookie"]);
      const data = await $fetch("/api/categories", { headers });
      this.categories = data.categories;
    },
  },
});
