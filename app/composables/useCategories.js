// @ts-check

export default function () {
  const { categoryKeyword } = useCategoryState();

  const { data, refresh } = useFetch("/api/categories", {
    key: "categories",
    dedupe: "defer",
    default: () => ({ categories: [] }),
  });
  const categories = computed(() => data.value?.categories ?? []);

  const filteredCategories = computed(() => {
    if (!categoryKeyword.value) return categories.value;

    return categories.value
      .map((c) => {
        const feedsMatched = c.feeds.filter((f) => f.title.toLowerCase().includes(categoryKeyword.value.toLowerCase()));
        if (feedsMatched.length === 0) return null;
        return { ...c, feeds: feedsMatched };
      })
      .filter((c) => c !== null);
  });

  return { categories, filteredCategories, refresh };
}
