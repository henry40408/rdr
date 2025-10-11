import { useLocalStorage } from "@vueuse/core";

export const HIDE_EMPTY = "settings:hide-empty";

export const useLocalSettings = () => {
  const hideEmpty = useLocalStorage(HIDE_EMPTY, false);
  return { hideEmpty };
};
