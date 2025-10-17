import { useLocalStorage } from "@vueuse/core";

export const HIDE_EMPTY = "settings:hide-empty";

export default function () {
  const hideEmpty = useLocalStorage(HIDE_EMPTY, false);
  return { hideEmpty };
}
