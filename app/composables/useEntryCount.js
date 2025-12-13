export default function () {
  const { entryStatus, selectedCategoryId, selectedFeedId } = useEntryState();

  const key = computed(() =>
    ["entry-count", entryStatus.value, selectedCategoryId.value ?? "\n", selectedFeedId.value ?? "\n"].join("\n"),
  );
  const query = computed(() => {
    const q = {};
    q.status = entryStatus.value;
    if (selectedFeedId.value) {
      q.selectedType = "feed";
      q.selectedId = selectedFeedId.value;
    } else if (selectedCategoryId.value) {
      q.selectedType = "category";
      q.selectedId = selectedCategoryId.value;
    }
    return q;
  });
  const { data, refresh } = useFetch("/api/entries/count", {
    key,
    query,
    dedupe: "defer",
    default: () => ({ count: 0 }),
  });
  const count = computed(() => data.value?.count ?? 0);

  return { count, refresh };
}
