// @ts-check

import { skipHydrate } from "pinia";

const SHOW_EMPTY = "settings:hide-empty";
const CATEGORIES_SORT = "settings:categories-sort";

export const useLocalSettings = defineStore("localSettings", () => ({
  showEmpty: skipHydrate(useLocalStorage(SHOW_EMPTY, false)),
  categoriesSort: skipHydrate(useLocalStorage(CATEGORIES_SORT, "unread_desc")),
}));
