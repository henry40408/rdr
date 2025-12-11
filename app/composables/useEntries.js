// @ts-check

export default function () {
  const route = useRoute();
  const router = useRouter();

  const selectedCategoryId = computed(() => route.query.categoryId?.toString());
  const selectedFeedId = computed(() => route.query.feedId?.toString());

  const { data } = useFetch("/api/entries", {
    key: "entries",
    dedupe: "defer",
    default: () => ({ entries: [] }),
  });
  const entries = computed(() => data.value?.entries ?? []);

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
    entries,
    selectedCategoryId,
    selectedFeedId,
    // setters
    setCategoryId,
    setFeedId,
  };
}
