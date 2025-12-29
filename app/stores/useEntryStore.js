// @ts-check

import { sub } from "date-fns";

export const DEFAULT_STATUS = { label: "Unread", value: "unread" };
export const STATUS = [
  DEFAULT_STATUS,
  { label: "Read", value: "read" },
  { label: "All", value: "all" },
  { label: "Starred", value: "starred" },
];

export const useEntryStore = defineStore("entry", () => {
  const headers = useRequestHeaders(["cookie"]);

  const categoryStore = useCategoryStore();
  const route = useRoute();

  /** @type {Ref<{date:string,id:number}|undefined>} */
  const cursor = ref(undefined);
  /** @type {Ref<Record<number,'unread'|'reading'|'read'>>} */
  const entryReads = ref({});
  /** @type {Ref<Record<number,'starred'|'starring'|'unstarred'>>} */
  const entryStars = ref({});
  /** @type {Ref<Record<number,boolean>>} */
  const expands = ref({});
  const hasMore = ref(true);
  const limit = ref(30);
  /** @type {Ref<Awaited<ReturnType<typeof import('../../server/api/entries.get').default>>['items']>} */
  const items = ref([]);
  const search = ref(route.query.search?.toString());
  const selectedFeedId = ref(route.query.feedId?.toString());
  const selectedCategoryId = ref(route.query.categoryId?.toString());
  const status = ref(route.query.status?.toString() ?? DEFAULT_STATUS.value);

  const expandedEntryId = computed(() => {
    for (const [entryId, isExpanded] of Object.entries(expands.value)) if (isExpanded) return Number(entryId);
    return undefined;
  });
  const expandedStarred = computed(() => {
    const entryId = expandedEntryId.value;
    if (entryId === undefined) return "unstarred";
    return entryStars.value[entryId];
  });
  const expandedRead = computed(() => {
    const entryId = expandedEntryId.value;
    if (entryId === undefined) return "unread";
    return entryReads.value[entryId];
  });
  const filtered = computed(() => !!selectedFeedId.value || !!selectedCategoryId.value);
  const latestItem = computed(() => {
    if (items.value.length === 0) return undefined;
    const orderByDateDesc = items.value.slice().sort((a, b) => {
      const aDate = new Date(a.entry.date);
      const bDate = new Date(b.entry.date);
      return bDate.valueOf() - aDate.valueOf();
    });
    return orderByDateDesc[0];
  });
  const query = computed(() => {
    /** @type {Record<String,unknown>} */
    const q = {
      limit: limit.value,
      search: search.value,
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
  const count = computed(() => countData.value?.count ?? 0);

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

  function closeExpanded() {
    expands.value = {};
  }

  async function refreshCategoryAndCount() {
    await categoryStore.load();
    await executeCount();
  }

  /**
   * @param {'init'} [signal]
   */
  async function load(signal) {
    await executeEntries();

    items.value = entriesData.value?.items ?? [];
    for (const item of items.value) {
      entryReads.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
      entryStars.value[item.entry.id] = item.entry.starredAt ? "starred" : "unstarred";
    }
    hasMore.value = items.value.length === limit.value;

    if (signal !== "init") await refreshCategoryAndCount();
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

  /**
   * @param {object} params
   * @param {string} [params.before]
   * @param {'day'|'week'|'month'|'year'} [params.olderThan]
   */
  async function markAllAsRead({ before, olderThan }) {
    if (!before && !olderThan) throw new Error("Either before or olderThan must be provided");

    const { updated } = await $fetch("/api/entries/mark-as-read", {
      method: "POST",
      body: {
        before,
        olderThan,
        selectedType: selectedType.value,
        selectedId: selectedId.value,
      },
    });
    if (updated === 0) return 0;

    const now = new Date();
    for (const item of items.value) {
      if (shouldMarkAsRead(now, item, { before, olderThan })) {
        entryReads.value[item.entry.id] = "read";
      }
    }

    refreshCategoryAndCount();

    return updated;
  }

  /**
   * @param {Date} now
   * @param {Awaited<ReturnType<typeof import('../../server/api/entries.get').default>>['items'][number]} item
   * @param {object} params
   * @param {string} [params.before]
   * @param {'day'|'week'|'month'|'year'} [params.olderThan]
   */
  function shouldMarkAsRead(now, item, { before, olderThan }) {
    const itemDate = new Date(item.entry.date);
    if (before) {
      const beforeDate = new Date(before);
      return itemDate <= beforeDate;
    }
    if (olderThan) {
      let compareDate;
      switch (olderThan) {
        case "day":
          compareDate = sub(now, { days: 1 });
          break;
        case "week":
          compareDate = sub(now, { weeks: 1 });
          break;
        case "month":
          compareDate = sub(now, { months: 1 });
          break;
        case "year":
          compareDate = sub(now, { years: 1 });
          break;
      }
      if (!compareDate) return false;
      return itemDate <= compareDate;
    }
    return false;
  }

  function reset() {
    cursor.value = undefined;
    entryReads.value = {};
    entryStars.value = {};
    expands.value = {};
    hasMore.value = true;
    items.value = [];
  }

  watch(
    () => search.value,
    async () => {
      const route = useRoute();
      const router = useRouter();
      router.replace({ query: { ...route.query, search: search.value || undefined } });
      reset();
      await load();
    },
  );

  /**
   * @param {number|string} [categoryId]
   */
  async function setCategoryId(categoryId) {
    const route = useRoute();
    const router = useRouter();
    router.replace({ query: { ...route.query, categoryId, feedId: undefined } });

    reset();
    selectedCategoryId.value = categoryId?.toString();
    selectedFeedId.value = undefined;

    await load();
  }

  /**
   * @param {number} entryId
   * @param {'unread'|'read'|'toggle'} value
   */
  async function setEntryRead(entryId, value) {
    if (entryReads.value[entryId] === value) return;

    const oldVal = entryReads.value[entryId];
    if (!oldVal || oldVal === "reading") return;

    const newVal = value === "toggle" ? (entryReads.value[entryId] === "unread" ? "read" : "unread") : value;
    entryReads.value[entryId] = "reading";
    try {
      const { updated } = await $fetch("/api/entries/status", {
        method: "PUT",
        body: { entryIds: [entryId], status: newVal },
      });
      entryReads.value[entryId] = updated > 0 ? newVal : oldVal;

      if (newVal === "read" && expands.value[entryId]) expands.value[entryId] = false;

      refreshCategoryAndCount();
    } catch (error) {
      entryReads.value[entryId] = oldVal;
      console.error("Failed to update entry read status", error);
    }
  }

  /**
   * @param {number} entryId
   * @param {'unstarred'|'starred'|'toggle'} value
   */
  async function setEntryStar(entryId, value) {
    if (entryStars.value[entryId] === value) return;

    const oldVal = entryStars.value[entryId];
    if (!oldVal || oldVal === "starring") return;

    const newVal = value === "toggle" ? (entryStars.value[entryId] === "unstarred" ? "starred" : "unstarred") : value;
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

  /**
   * @param {number} entryId
   * @param {boolean|'toggle'} value
   */
  function setExpand(entryId, value) {
    if (expands.value[entryId] === value) return;
    const newVal = value === "toggle" ? !expands.value[entryId] : value;
    expands.value[entryId] = newVal;
  }

  /**
   * @param {'unread'|'read'|'toggle'} value
   */
  function setExpandedRead(value) {
    const entryId = expandedEntryId.value;
    if (entryId === undefined) return;
    setEntryRead(entryId, value);
  }

  /**
   * @param {'unstarred'|'starred'|'toggle'} value
   */
  function setExpandedStar(value) {
    const entryId = expandedEntryId.value;
    if (entryId === undefined) return;
    setEntryStar(entryId, value);
  }

  /**
   * @param {number|string} [categoryId]
   * @param {number|string} [feedId]
   */
  async function setFeedId(categoryId, feedId) {
    const route = useRoute();
    const router = useRouter();
    router.replace({ query: { ...route.query, categoryId, feedId } });

    reset();
    selectedCategoryId.value = categoryId?.toString();
    selectedFeedId.value = feedId?.toString();

    await load();
  }

  /**
   * @param {string} newStatus
   */
  async function setStatus(newStatus) {
    const route = useRoute();
    const router = useRouter();
    router.replace({ query: { ...route.query, status: newStatus === DEFAULT_STATUS.value ? undefined : newStatus } });

    reset();
    status.value = newStatus;

    await load();
  }

  return {
    count,
    countPending,
    cursor,
    entriesPending,
    entryReads,
    entryStars,
    expands,
    expandedEntryId,
    expandedRead,
    expandedStarred,
    filtered,
    hasMore,
    items,
    latestItem,
    limit,
    search,
    selectedFeedId,
    selectedCategoryId,
    status,
    closeExpanded,
    load,
    loadMore,
    markAllAsRead,
    reset,
    setCategoryId,
    setEntryRead,
    setEntryStar,
    setExpand,
    setExpandedRead,
    setExpandedStar,
    setFeedId,
    setStatus,
  };
});
