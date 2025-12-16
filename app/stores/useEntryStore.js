// @ts-check

export const DEFAULT_STATUS = { label: "Unread", value: "unread" };
export const STATUS = [
  DEFAULT_STATUS,
  { label: "Read", value: "read" },
  { label: "All", value: "all" },
  { label: "Starred", value: "starred" },
];

export const useEntryStore = defineStore("entry", {
  state: () => {
    const route = useRoute();
    return {
      count: 0,
      /** @type { {date:string,id:number} | undefined } */
      cursor: undefined,
      /** @type {Record<number,boolean>} */
      entryReads: {},
      /** @type {Record<number,boolean>} */
      entryStars: {},
      hasMore: true,
      limit: 30,
      /** @type {Awaited<ReturnType<typeof import('../../server/api/entries.get').default>>['items']} */
      items: [],
      selectedFeedId: route.query.feedId?.toString(),
      selectedCategoryId: route.query.categoryId?.toString(),
      status: DEFAULT_STATUS.value,
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
      const [{ items }, { count }] = await Promise.all([
        $fetch("/api/entries", { headers, query }),
        $fetch("/api/entries/count", { headers, query }),
      ]);
      this.$patch((s) => {
        s.count = count;
        s.items = items;
        for (const item of items) {
          s.entryReads[item.entry.id] = !!item.entry.readAt;
          s.entryStars[item.entry.id] = !!item.entry.starredAt;
        }
        s.hasMore = items.length === s.limit;
      });
    },
    async loadMore() {
      const lastItem = this.items[this.items.length - 1];
      if (!lastItem) return;

      this.cursor = { date: lastItem.entry.date, id: lastItem.entry.id };
      const headers = useRequestHeaders(["cookie"]);
      const query = this.query;
      const { items } = await $fetch("/api/entries", { headers, query });

      this.$patch((s) => {
        for (const item of items) {
          s.items.push(item);
          s.entryReads[item.entry.id] = !!item.entry.readAt;
          s.entryStars[item.entry.id] = !!item.entry.starredAt;
        }
        s.hasMore = items.length === s.limit;
      });
    },
    /**
     * @param {string|number} [categoryId]
     */
    async selectCategory(categoryId) {
      const route = useRoute();
      const router = useRouter();
      router.replace({ query: { ...route.query, categoryId, feedId: undefined } });

      this.$patch((s) => {
        s.cursor = undefined;
        s.entryReads = {};
        s.entryStars = {};
        s.selectedCategoryId = categoryId?.toString();
        s.selectedFeedId = undefined;
      });
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

      this.$patch((s) => {
        s.cursor = undefined;
        s.entryReads = {};
        s.entryStars = {};
        s.selectedCategoryId = categoryId?.toString();
        s.selectedFeedId = feedId?.toString();
      });
      await this.loadEntries();
    },
    /**
     * @param {string} status
     */
    async selectStatus(status) {
      this.$patch((s) => {
        s.status = status;
        s.cursor = undefined;
        s.entryReads = {};
        s.entryStars = {};
      });
      await this.loadEntries();
    },
  },
});
