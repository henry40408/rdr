// @ts-check

export const DEFAULT_STATUS = { label: "Unread", value: "unread" };
export const STATUS = [
  DEFAULT_STATUS,
  { label: "Read", value: "read" },
  { label: "All", value: "all" },
  { label: "Starred", value: "starred" },
];

export const useEntryStore = defineStore("entry", () => {
  const storeC = useCategoryStore();
  const route = useRoute();

  const count = ref(0);
  const cursor = ref(/** @type { {date:string,id:number} | undefined } */ (undefined));
  const entryReads = ref(/** @type {Record<number,'unread'|'reading'|'read'>} */ ({}));
  const entryStars = ref(/** @type {Record<number,'starred'|'starring'|'unstarred'>} */ ({}));
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
  const {
    data: countData,
    pending: countPending,
    execute: executeCount,
  } = useFetch("/api/entries/count", {
    key: "entries-count",
    headers,
    query,
    immediate: false,
    watch: false,
  });
  const {
    data: entriesData,
    pending: entriesPending,
    execute: executeEntries,
  } = useFetch("/api/entries", {
    key: "entries",
    headers,
    query,
    immediate: false,
    watch: false,
  });

  async function loadEntries() {
    await executeCount();
    await executeEntries();

    count.value = countData.value?.count ?? 0;
    items.value = entriesData.value?.items ?? [];
    for (const item of items.value) {
      entryReads.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
      entryStars.value[item.entry.id] = item.entry.starredAt ? "starred" : "unstarred";
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
      entryReads.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
      entryStars.value[item.entry.id] = item.entry.starredAt ? "starred" : "unstarred";
    }
    hasMore.value = fetchedItems.length === limit.value;
  }

  function resetState() {
    // count.value = 0; // keep count for better UX
    cursor.value = undefined;
    entryReads.value = {};
    entryStars.value = {};
    hasMore.value = true;
    items.value = [];
  }

  /**
   * @param {number|string} [categoryId]
   */
  async function selectCategory(categoryId) {
    const route = useRoute();
    const router = useRouter();
    router.replace({ query: { ...route.query, categoryId, feedId: undefined } });

    resetState();
    selectedCategoryId.value = categoryId?.toString();
    selectedFeedId.value = undefined;

    await loadEntries();
  }

  /**
   * @param {number|string} [categoryId]
   * @param {number|string} [feedId]
   */
  async function selectFeed(categoryId, feedId) {
    const route = useRoute();
    const router = useRouter();
    router.replace({ query: { ...route.query, categoryId, feedId } });

    resetState();
    selectedCategoryId.value = categoryId?.toString();
    selectedFeedId.value = feedId?.toString();

    await loadEntries();
  }

  /**
   * @param {string} newStatus
   */
  async function selectStatus(newStatus) {
    resetState();
    status.value = newStatus;

    await loadEntries();
  }

  /**
   * @param {number} entryId
   */
  async function toggleEntryRead(entryId) {
    const oldVal = entryReads.value[entryId];
    if (!oldVal || oldVal === "reading") return;

    const newVal = oldVal === "unread" ? "read" : "unread";
    entryReads.value[entryId] = "reading";
    try {
      const { updated } = await $fetch("/api/entries/status", {
        method: "PUT",
        body: { entryIds: [entryId], status: newVal },
      });
      entryReads.value[entryId] = updated > 0 ? newVal : oldVal;
      storeC.loadCategories().catch((err) => {
        console.error("Failed to refresh categories after updating entry read status", err);
      });
    } catch (error) {
      entryReads.value[entryId] = oldVal;
      console.error("Failed to update entry read status", error);
    }
  }

  /**
   * @param {number} entryId
   */
  async function toggleEntryStar(entryId) {
    const oldVal = entryStars.value[entryId];
    if (!oldVal || oldVal === "starring") return;

    const newVal = oldVal === "unstarred" ? "starred" : "unstarred";
    entryStars.value[entryId] = "starring";
    try {
      const { updated } = await $fetch("/api/entries/status", {
        method: "PUT",
        body: {
          entryIds: [entryId],
          status: newVal,
        },
      });
      entryStars.value[entryId] = updated > 0 ? newVal : oldVal;
    } catch (error) {
      entryStars.value[entryId] = oldVal;
      console.error("Failed to update entry star status", error);
    }
  }

  return {
    count,
    countPending,
    cursor,
    entriesPending,
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
    toggleEntryRead,
    toggleEntryStar,
  };
});
