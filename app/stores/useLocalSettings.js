// @ts-check

import { skipHydrate } from "pinia";

const SHOW_EMPTY = "settings:hide-empty";

export const useLocalSettings = defineStore("localSettings", () => ({
  showEmpty: skipHydrate(useLocalStorage(SHOW_EMPTY, false)),
}));
