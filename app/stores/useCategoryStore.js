// @ts-check

import { secondsToMilliseconds } from "date-fns";
import { skipHydrate } from "pinia";

export const DEFAULT_SORT = { value: "unread-desc", label: "Unread count (Descending)" };
export const SORT = [
  DEFAULT_SORT,
  { value: "unread-asc", label: "Unread count (Ascending)" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
];

export const CATEGORY_SORT = "settings:category-sort";
export const HIDE_EMPTY = "settings:hide-empty";

export const useCategoryStore = defineStore("category", () => {
  const categorySort = useLocalStorage(CATEGORY_SORT, DEFAULT_SORT.value);
  const hideEmpty = useLocalStorage(HIDE_EMPTY, false);

  const categories = ref(
    /** @type {Awaited<ReturnType<typeof import('../../server/api/categories/index.get').default>>['categories']} */ ([]),
  );
  const keyword = ref("");

  const headers = useRequestHeaders(["cookie"]);
  const { data, refresh } = useFetch("/api/categories", {
    key: "categories",
    headers,
    immediate: false,
    timeout: secondsToMilliseconds(30),
    watch: false,
  });

  const sortedCategories = computed(() =>
    categories.value
      .slice()
      .sort((a, b) => {
        if (["unread-asc", "unread-desc"].includes(categorySort.value)) {
          const aUnreadCount = a.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
          const bUnreadCount = b.feeds.reduce((sum, feed) => sum + feed.unreadCount, 0);
          return categorySort.value === "unread-asc" ? aUnreadCount - bUnreadCount : bUnreadCount - aUnreadCount;
        } else if (["title-asc", "title-desc"].includes(categorySort.value)) {
          const comparison = a.name.localeCompare(b.name);
          return categorySort.value === "title-asc" ? comparison : -comparison;
        } else {
          return 0;
        }
      })
      .map((c) => ({
        ...c,
        feeds: c.feeds.slice().sort((a, b) => {
          if (["unread-asc", "unread-desc"].includes(categorySort.value)) {
            const aUnread = a.unreadCount;
            const bUnread = b.unreadCount;
            return categorySort.value === "unread-asc" ? aUnread - bUnread : bUnread - aUnread;
          } else if (["title-asc", "title-desc"].includes(categorySort.value)) {
            const comparison = a.title.localeCompare(b.title);
            return categorySort.value === "title-asc" ? comparison : -comparison;
          } else {
            return 0;
          }
        }),
      })),
  );

  async function load() {
    await refresh();
    categories.value = data.value?.categories ?? [];
  }

  return {
    categorySort: skipHydrate(categorySort),
    hideEmpty: skipHydrate(hideEmpty),
    categories,
    keyword,
    sortedCategories,
    load,
  };
});
