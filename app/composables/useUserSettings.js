// @ts-check

export default function () {
  const { data, refresh } = useFetch("/api/user-settings");

  /**
   * @param {Record<string,string>} newSettings
   */
  async function update(newSettings) {
    await $fetch("/api/user-settings", { method: "POST", body: newSettings });
    refresh();
  }

  return { data, refresh, update };
}
