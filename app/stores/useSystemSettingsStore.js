// @ts-check

import { secondsToMilliseconds } from "date-fns";

export const useSystemSettingsStore = defineStore("systemSettings", () => {
  const { data, refresh: load } = useFetch("/api/system-settings", { timeout: secondsToMilliseconds(30) });

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
