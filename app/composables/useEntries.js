// @ts-check

export const DEFAULT_STATUS = { value: "unread", label: "Unread" };
export const STATUS = [
  DEFAULT_STATUS,
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
  { value: "starred", label: "Starred" },
];

export default function () {
  const route = useRoute();
  const router = useRouter();

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

  const query = computed(() => {
    const q = {};
    q.limit = limit.value;
    q.status = entryStatus.value;
    if (selectedType.value && selectedId.value) {
      q.selectedType = selectedType.value;
      q.selectedId = selectedId.value;
    }
    return q;
  });
  const { data } = useFetch("/api/entries", {
    key: "entries",
    query,
    dedupe: "defer",
    default: () => ({ items: [] }),
  });
  const items = computed(() => data.value?.items ?? []);

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
    // getters
    entryStatus,
    items,
    selectedCategoryId,
    selectedFeedId,
    selectedId,
    selectedType,
    // setters
    setCategoryId,
    setFeedId,
  };
}
