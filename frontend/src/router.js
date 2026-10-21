export function createRouter(routeDefinitions) {
  const routes = new Map(
    routeDefinitions.map((route) => [route.path, { ...route, element: document.querySelector(route.element) }]),
  );

  let activePath = null;
  let cleanupActiveRoute;

  function navigate(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const targetHash = `#${normalizedPath}`;

    if (window.location.hash === targetHash) {
      renderRoute();
      return;
    }

    window.location.hash = targetHash;
  }

  function renderRoute() {
    const path = window.location.hash.slice(1) || "/home";
    const route = routes.get(path);

    if (!route) {
      navigate("/home");
      return;
    }

    if (activePath === path) return;

    cleanupActiveRoute?.();
    activePath = path;

    for (const { element } of routes.values()) {
      element.hidden = true;
    }

    route.element.hidden = false;
    cleanupActiveRoute = route.mount?.({ navigate });
  }

  function start() {
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
  }

  return { navigate, start };
}
