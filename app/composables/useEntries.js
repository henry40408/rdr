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
  const { cursor, entryStatus, items, limit, selectedCategoryId, selectedFeedId } = useEntryFilters();

  const key = computed(() =>
    [
      "entries",
      entryStatus.value ?? "\n",
      selectedCategoryId.value ?? "\n",
      selectedFeedId.value ?? "\n",
      cursor.value ? `${cursor.value.id}-${cursor.value.date}` : "\n",
      limit.value,
    ].join("\n"),
  );
  const { data, pending, error } = useAsyncData(
    key,
    async () => {
      const query = {};
      query.limit = limit.value;
      query.status = entryStatus.value;
      if (cursor.value) {
        query.id = cursor.value.id;
        query.cursor = cursor.value.date;
      }
      if (selectedFeedId.value) {
        query.selectedType = "feed";
        query.selectedId = selectedFeedId.value;
      } else if (selectedCategoryId.value) {
        query.selectedType = "category";
        query.selectedId = selectedCategoryId.value;
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
      triggerRef(items);
    }
  });

  function loadMore() {
    const lastItem = items.value[items.value.length - 1];
    if (!lastItem) return;
    const { id, date } = lastItem.entry;
    cursor.value = { id, date };
  }

  return {
    // refs
    items,
    // computed
    error,
    pending,
    // setters
    loadMore,
  };
}
