// @ts-check

export default function () {
  const { loggedIn } = useUserSession();
  const { data, refresh } = useFetch("/api/features", { watch: [loggedIn] });
  return { data, refresh };
}
