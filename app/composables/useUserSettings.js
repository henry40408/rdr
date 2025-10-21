export default function () {
  const requestFetch = useRequestFetch();
  const { data, refresh } = useAsyncData(() => requestFetch("/api/user-settings"));
  async function update(newSettings) {
    await requestFetch("/api/user-settings", { method: "POST", body: newSettings });
    refresh();
  }
  return { data, refresh, update };
}
