// @ts-check

export const useFeatureStore = defineStore("feature", () => {
  const headers = useRequestHeaders(["cookie"]);
  const { data, refresh } = useFetch("/api/features", { key: "features", headers, immediate: false });

  const saveEnabled = computed(() => data.value?.save ?? false);
  const summarizationEnabled = computed(() => data.value?.summarization ?? false);

  async function load() {
    await refresh();
  }

  return {
    saveEnabled,
    summarizationEnabled,
    load,
  };
});
