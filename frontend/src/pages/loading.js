export function mountLoadingPage({ navigate }) {
  const timeout = window.setTimeout(() => navigate("/closet"), 1250);

  return () => window.clearTimeout(timeout);
}
