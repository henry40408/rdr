export default function () {
  const { data: settings } = useAsyncData(() => useRequestFetch()("/api/user-settings"), { deep: true });

  watch(
    settings,
    async (newValue) => {
      if (newValue) {
        await useRequestFetch()("/api/user-settings", {
          method: "POST",
          body: newValue,
        });
      }
    },
    { deep: true },
  );

  return settings;
}
