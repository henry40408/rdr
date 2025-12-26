// @ts-check

export const useUserSettingsStore = defineStore("userSettings", () => {
  const headers = useRequestHeaders(["cookie"]);
  const { data: featureData, refresh: loadFeatures } = useFetch("/api/features", {
    key: "features",
    headers,
  });
  const { data: userSettingsData, refresh: loadUserSettings } = useFetch("/api/user-settings", {
    key: "user-settings",
    headers,
  });

  async function load() {
    await Promise.all([loadFeatures(), loadUserSettings()]);
  }

  return { featureData, userSettingsData, load };
});
