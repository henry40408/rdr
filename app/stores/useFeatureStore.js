// @ts-check

export const useFeatureStore = defineStore("feature", () => {
  const headers = useRequestHeaders(["cookie"]);
  const { data } = useFetch("/api/features", { key: "features", headers });

  const saveEnabled = computed(() => data.value?.save ?? false);
  const summarizationEnabled = computed(() => data.value?.summarization ?? false);
  return {
    saveEnabled,
    summarizationEnabled,
  };
});
