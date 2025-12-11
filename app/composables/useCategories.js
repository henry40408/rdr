// @ts-check

export default function () {
  const { data } = useFetch("/api/categories", {
    key: "categories",
    dedupe: "defer",
    default: () => ({ categories: [] }),
  });
  const categories = computed(() => data.value?.categories ?? []);
  return { categories };
}
