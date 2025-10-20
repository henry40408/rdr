export default function () {
  const requestFetch = useRequestFetch();
  const { data: settings } = useAsyncData(() => requestFetch("/api/user-settings"), { deep: true });

  watch(
    settings,
    async (newValue) => {
      if (newValue) await requestFetch("/api/user-settings", { method: "POST", body: newValue });
    },
    { deep: true },
  );

  return settings;
}
