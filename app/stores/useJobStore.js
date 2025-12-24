// @ts-check

export const useJobStore = defineStore("job", () => {
  /** @type {Ref<Awaited<ReturnType<typeof import('../../server/api/jobs/index.get').default>>['jobs']>} */
  const jobs = ref([]);

  const headers = useRequestHeaders(["cookie"]);
  const { data, refresh, pending } = useFetch("/api/jobs", {
    key: "jobs",
    headers,
    immediate: false,
    watch: false,
  });

  async function load() {
    await refresh();
    jobs.value = data.value?.jobs ?? [];
  }

  return {
    jobs,
    pending,
    load,
  };
});
