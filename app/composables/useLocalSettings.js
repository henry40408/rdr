import { useLocalStorage } from "@vueuse/core";

export const CATEGORIES_ORDER = "settings:categories-order";
export const CATEGORIES_DIRECTION = "settings:categories-direction";
export const HIDE_EMPTY = "settings:hide-empty";

export default function () {
  const categoriesDirection = useLocalStorage(CATEGORIES_DIRECTION, "desc");
  const categoriesOrder = useLocalStorage(CATEGORIES_ORDER, "unread_count");
  const hideEmpty = useLocalStorage(HIDE_EMPTY, false);
  return { categoriesDirection, categoriesOrder, hideEmpty };
}
