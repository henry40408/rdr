// @ts-check

export const HIDE_EMPTY = "settings:hide-empty";

export const useCategoryStore = defineStore("category", () => {
  const categories = ref(
    /** @type {Awaited<ReturnType<typeof import('../../server/api/categories/index.get').default>>['categories']} */ ([]),
  );
  const hideEmpty = useLocalStorage(HIDE_EMPTY, false);
  const keyword = ref("");

  const headers = useRequestHeaders(["cookie"]);
  const { data, refresh } = useFetch("/api/categories", {
    key: "categories",
    headers,
    dedupe: "defer",
    immediate: false,
    watch: false,
  });

  async function loadCategories() {
    await refresh();
    categories.value = data.value?.categories ?? [];
  }

  return {
    categories,
    hideEmpty,
    keyword,
    loadCategories,
  };
});
