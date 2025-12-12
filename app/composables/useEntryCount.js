export default function () {
  const { entryStatus, selectedCategoryId, selectedFeedId } = useEntryFilters();

  const key = computed(() => {
    if (selectedFeedId.value) return `entry-count\nfeed\n${selectedFeedId.value}`;
    if (selectedCategoryId.value) return `entry-count\ncategory\n${selectedCategoryId.value}`;
    return `entry-count`;
  });
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
  const { data } = useFetch("/api/entries/count", {
    key,
    query,
    dedupe: "defer",
    default: () => ({ count: 0 }),
  });
  const count = computed(() => data.value?.count ?? 0);

  return { count };
}
