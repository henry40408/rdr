const DEFAULT_STATUS = { value: "unread", label: "Unread" };
const STATUS = [
  DEFAULT_STATUS,
  { value: "all", label: "All" },
  { value: "read", label: "Read" },
  { value: "starred", label: "Starred" },
];

export default function () {
  const route = useRoute();
  const router = useRouter();

  /** @type {Ref<{ date: string, id: number }|undefined>} */
  const cursor = useState("cursor", () => shallowRef(undefined));
  const hasMore = useState("has-more", () => true);
  /** @type {Ref<{ entry: EntryEntity, feed: FeedEntity, category: CategoryEntity }[]>} */
  const items = useState("items", () => shallowRef([]));
  const limit = useState("limit", () => 30);

  const entryStatus = computed(() => route.query.status?.toString() || DEFAULT_STATUS.value);
  const selectedCategoryId = computed(() => route.query.categoryId?.toString());
  const selectedFeedId = computed(() => route.query.feedId?.toString());

  /**
   * @param {string} [categoryId]
   */
  function setCategoryId(categoryId) {
    router.replace({ query: { ...route.query, categoryId, feedId: undefined } });
  }

  /**
   * @param {string} [categoryId]
   * @param {string} [feedId]
   */
  function setFeedId(categoryId, feedId) {
    router.replace({ query: { ...route.query, categoryId, feedId } });
  }

  /**
   * @param {'all'|'unread'|'read'|'starred'} status
   */
  function setStatus(status) {
    router.replace({ query: { ...route.query, status } });
  }

  return {
    // constants
    DEFAULT_STATUS,
    STATUS,
    // computed
    entryStatus,
    selectedCategoryId,
    selectedFeedId,
    // refs
    cursor,
    hasMore,
    items,
    limit,
    // setters
    setCategoryId,
    setFeedId,
    setStatus,
  };
}
