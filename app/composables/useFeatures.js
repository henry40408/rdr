export default function () {
  const { loggedIn } = useUserSession();
  const { data: features } = useAsyncData(() => useRequestFetch()("/api/features"), { watch: [loggedIn] });
  return features;
}
