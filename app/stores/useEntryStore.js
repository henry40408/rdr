// @ts-check

export const DEFAULT_STATUS = { label: "Unread", value: "unread" };
export const STATUS = [
  DEFAULT_STATUS,
  { label: "Read", value: "read" },
  { label: "All", value: "all" },
  { label: "Starred", value: "starred" },
];

export const useEntryStore = defineStore("entry", () => {
  const route = useRoute();

  const count = ref(0);
  const cursor = ref(/** @type { {date:string,id:number} | undefined } */ (undefined));
  const entryReads = ref(/** @type {Record<number,boolean>} */ ({}));
  const entryStars = ref(/** @type {Record<number,boolean>} */ ({}));
  const hasMore = ref(true);
  const limit = ref(30);
  const items = ref(
    /** @type {Awaited<ReturnType<typeof import('../../server/api/entries.get').default>>['items']} */ ([]),
  );
  const selectedFeedId = ref(route.query.feedId?.toString());
  const selectedCategoryId = ref(route.query.categoryId?.toString());
  const status = ref(DEFAULT_STATUS.value);

  const query = computed(() => {
    /** @type {Record<String,unknown>} */
    const q = {
      limit: limit.value,
      selectedType: selectedType.value,
      selectedId: selectedId.value,
      status: status.value,
    };
    if (cursor.value) {
      q.cursor = cursor.value.date;
      q.id = cursor.value.id;
    }
    return q;
  });

  const selectedId = computed(() => {
    return selectedFeedId.value ?? selectedCategoryId.value;
  });
  const selectedType = computed(() => {
    if (selectedFeedId.value) return "feed";
    if (selectedCategoryId.value) return "category";
    return undefined;
  });

  const headers = useRequestHeaders(["cookie"]);
  const { data: countData, execute: executeCount } = useFetch("/api/entries/count", {
    key: "entries-count",
    headers,
    query,
    dedupe: "defer",
    immediate: false,
    watch: false,
  });
  const { data: entriesData, execute: executeEntries } = useFetch("/api/entries", {
    key: "entries",
    headers,
    query,
    dedupe: "defer",
    immediate: false,
    watch: false,
  });

  async function loadEntries() {
    await executeCount();
    await executeEntries();

    count.value = countData.value?.count ?? 0;
    items.value = entriesData.value?.items ?? [];
    for (const item of items.value) {
      entryReads.value[item.entry.id] = !!item.entry.readAt;
      entryStars.value[item.entry.id] = !!item.entry.starredAt;
    }
    hasMore.value = items.value.length === limit.value;
  }

  async function loadMore() {
    const lastItem = items.value[items.value.length - 1];
    if (!lastItem) return;

    cursor.value = { date: lastItem.entry.date, id: lastItem.entry.id };
    await executeEntries();

    const fetchedItems = entriesData.value?.items ?? [];
    for (const item of fetchedItems) {
      items.value.push(item);
      entryReads.value[item.entry.id] = !!item.entry.readAt;
      entryStars.value[item.entry.id] = !!item.entry.starredAt;
    }
    hasMore.value = fetchedItems.length === limit.value;
  }

  /**
   * @param {number} [categoryId]
   */
  async function selectCategory(categoryId) {
    const route = useRoute();
    const router = useRouter();
    router.replace({ query: { ...route.query, categoryId, feedId: undefined } });

    cursor.value = undefined;
    entryReads.value = {};
    entryStars.value = {};
    selectedCategoryId.value = categoryId?.toString();
    selectedFeedId.value = undefined;

    await loadEntries();
  }

  /**
   * @param {number} [categoryId]
   * @param {number} [feedId]
   */
  async function selectFeed(categoryId, feedId) {
    const route = useRoute();
    const router = useRouter();
    router.replace({ query: { ...route.query, categoryId, feedId } });

    cursor.value = undefined;
    entryReads.value = {};
    entryStars.value = {};
    selectedCategoryId.value = categoryId?.toString();
    selectedFeedId.value = feedId?.toString();

    await loadEntries();
  }

  /**
   * @param {string} newStatus
   */
  async function selectStatus(newStatus) {
    status.value = newStatus;
    cursor.value = undefined;
    entryReads.value = {};
    entryStars.value = {};

    await loadEntries();
  }

  return {
    count,
    cursor,
    entryReads,
    entryStars,
    hasMore,
    limit,
    items,
    selectedFeedId,
    selectedCategoryId,
    status,
    loadEntries,
    loadMore,
    selectCategory,
    selectFeed,
    selectStatus,
  };
});
