// @ts-check

export default function () {
  const { loggedIn } = useUserSession();
  const { data, error, refresh } = useFetch("/api/features", { watch: [loggedIn] });
  return { data, error, refresh };
}
