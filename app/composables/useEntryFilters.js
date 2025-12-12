export default function () {
  const route = useRoute();
  const router = useRouter();

  /** @type {Ref<{ date: string, id: number }|undefined>} */
  const cursor = useState("cursor", () => shallowRef(undefined));
  /** @type {Ref<{ entry: EntryEntity, feed: FeedEntity, category: CategoryEntity }[]>} */
  const items = useState("items", () => shallowRef([]));
  const limit = useState("limit", () => 30);

  const entryStatus = computed(() => route.query.status?.toString() || "unread");
  const selectedCategoryId = computed(() => route.query.categoryId?.toString());
  const selectedFeedId = computed(() => route.query.feedId?.toString());

  /**
   * @param {string} [categoryId]
   */
  function setCategoryId(categoryId) {
    if (selectedCategoryId.value === categoryId) return;
    items.value = [];
    router.replace({ query: { ...route.query, categoryId, feedId: undefined } });
  }

  /**
   * @param {string} [categoryId]
   * @param {string} [feedId]
   */
  function setFeedId(categoryId, feedId) {
    if (categoryId === selectedCategoryId.value && feedId === selectedFeedId.value) return;
    items.value = [];
    router.replace({ query: { ...route.query, categoryId, feedId } });
  }

  return {
    // computed
    cursor,
    items,
    limit,
    entryStatus,
    selectedCategoryId,
    selectedFeedId,
    // setters
    setCategoryId,
    setFeedId,
  };
}
