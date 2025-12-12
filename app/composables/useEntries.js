// @ts-check

export const DEFAULT_STATUS = { value: "unread", label: "Unread" };
export const STATUS = [
  DEFAULT_STATUS,
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
  { value: "starred", label: "Starred" },
];

export default function () {
  const headers = useRequestHeaders(["cookie"]);
  const route = useRoute();
  const router = useRouter();

  /** @type {Ref<{ date: string, id: number }|undefined>} */
  const cursor = useState("cursor", () => shallowRef(undefined));
  /** @type {Ref<{ entry: EntryEntity, feed: FeedEntity, category: CategoryEntity }[]>} */
  const items = useState("items", () => []);
  const limit = useState("limit", () => 30);

  const entryStatus = computed(() => route.query.status?.toString() || "unread");
  const selectedCategoryId = computed(() => route.query.categoryId?.toString());
  const selectedFeedId = computed(() => route.query.feedId?.toString());

  const selectedType = computed(() => {
    if (selectedFeedId.value) return "feed";
    if (selectedCategoryId.value) return "category";
    return undefined;
  });
  const selectedId = computed(() => {
    if (selectedFeedId.value) return selectedFeedId.value;
    if (selectedCategoryId.value) return selectedCategoryId.value;
    return undefined;
  });

  const cursorKey = computed(() => {
    if (!cursor.value) return "\n";
    return `${cursor.value.id}\n${cursor.value.date}`;
  });
  const key = computed(() => `entries\n${cursorKey.value}`);
  const { data } = useAsyncData(
    key,
    async () => {
      const query = {};
      query.limit = limit.value;
      query.status = entryStatus.value;
      if (cursor.value) {
        query.id = cursor.value.id;
        query.cursor = cursor.value.date;
      }
      if (selectedType.value && selectedId.value) {
        query.selectedType = selectedType.value;
        query.selectedId = selectedId.value;
      }
      const body = await $fetch("/api/entries", { query, headers });
      return body.items;
    },
    { dedupe: "defer" },
  );
  items.value = data.value ?? []; // first load
  // subsequent loads
  watch(data, (newData) => {
    if (newData) {
      for (const item of newData) items.value.push(item);
    }
  });

  function loadMore() {
    const lastItem = items.value[items.value.length - 1];
    if (!lastItem) return;
    const { id, date } = lastItem.entry;
    cursor.value = { id, date };
  }

  /**
   * @param {number|string} [categoryId]
   */
  function setCategoryId(categoryId) {
    router.replace({ query: { ...route.query, categoryId, feedId: undefined } });
  }

  /**
   * @param {number|string} [categoryId]
   * @param {number|string} [feedId]
   */
  function setFeedId(categoryId, feedId) {
    router.replace({ query: { ...route.query, categoryId, feedId } });
  }

  return {
    // refs
    items,
    // computed
    entryStatus,
    selectedCategoryId,
    selectedFeedId,
    selectedId,
    selectedType,
    // setters
    loadMore,
    setCategoryId,
    setFeedId,
  };
}
