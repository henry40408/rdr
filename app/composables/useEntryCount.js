export default function () {
  const { entryStatus, selectedType, selectedId } = useEntries();

  const key = computed(() => ["entry-count", entryStatus.value, selectedType.value, selectedId.value].join("\n"));
  const query = computed(() => {
    const q = {};
    q.status = entryStatus.value;
    if (selectedType.value && selectedId.value) {
      q.selectedType = selectedType.value;
      q.selectedId = selectedId.value;
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
