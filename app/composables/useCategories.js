// @ts-check

export default function () {
  const { data: categories } = useFetch("/api/categories", {
    key: "categories",
    dedupe: "defer",
    default: () => [],
  });
  return { categories };
}
