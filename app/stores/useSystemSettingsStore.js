// @ts-check

export const useSystemSettingsStore = defineStore("systemSettings", () => {
  const { data, refresh: load } = useFetch("/api/system-settings", { key: "system-settings" });

  const canLogin = computed(() => data.value?.canLogin ?? false);
  const canSignup = computed(() => data.value?.canSignup ?? false);

  const errorThreshold = computed(() => data.value?.config.errorThreshold);
  const httpTimeoutMs = computed(() => data.value?.config.httpTimeoutMs);
  const userAgent = computed(() => data.value?.config.userAgent);
  return {
    canLogin,
    canSignup,
    config: {
      errorThreshold,
      httpTimeoutMs,
      userAgent,
    },
    load,
  };
});
