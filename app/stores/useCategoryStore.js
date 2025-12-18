// @ts-check

import { secondsToMilliseconds } from "date-fns";
import { skipHydrate } from "pinia";

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
    immediate: false,
    timeout: secondsToMilliseconds(30),
    watch: false,
  });

  async function load() {
    await refresh();
    categories.value = data.value?.categories ?? [];
  }

  return {
    categories,
    hideEmpty: skipHydrate(hideEmpty),
    keyword,
    load,
  };
});
