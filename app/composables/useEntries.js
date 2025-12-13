// @ts-check

export default function () {
  const headers = useRequestHeaders(["cookie"]);
  const {
    cursor,
    entryReads,
    entryStars,
    entryStatus,
    hasMore,
    items,
    limit,
    resetState,
    selectedCategoryId,
    selectedFeedId,
  } = useEntryState();

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
  watch(
    data,
    (newData) => {
      if (newData) {
        for (const item of newData) {
          items.value.push(item);
          entryReads.value[item.entry.id] = item.entry.readAt ? "read" : "unread";
          entryStars.value[item.entry.id] = item.entry.starredAt ? "starred" : "unstarred";
        }
        hasMore.value = newData.length === limit.value;
        triggerRef(items);
      }
    },
    { immediate: true },
  );
  watch([entryStatus, selectedCategoryId, selectedFeedId], () => {
    resetState();
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
