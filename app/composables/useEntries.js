// @ts-check

export default function () {
  const route = useRoute();
  const router = useRouter();

  const selectedCategoryId = computed(() => route.query.categoryId);
  const selectedFeedId = computed(() => route.query.feedId);

  const { data } = useFetch("/api/entries", {
    key: "entries",
    dedupe: "defer",
    default: () => ({ entries: [] }),
  });
  const entries = computed(() => data.value?.entries ?? []);

  /**
   * @param {number} categoryId
   */
  function setCategoryId(categoryId) {
    router.replace({ query: { ...route.query, categoryId, feedId: undefined } });
  }

  /**
   * @param {number} categoryId
   * @param {number} feedId
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
