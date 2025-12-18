// @ts-check

import { secondsToMilliseconds } from "date-fns";

export const useSystemSettingsStore = defineStore("systemSettings", () => {
  const { data } = useFetch("/api/system-settings", { timeout: secondsToMilliseconds(30) });
  const canLogin = computed(() => data.value?.canLogin ?? false);
  const canSignup = computed(() => data.value?.canSignup ?? false);
  return { canLogin, canSignup };
});
