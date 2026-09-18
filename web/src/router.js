let currentRoutes = [];
let notFoundHandler = null;
let currentPath = '';

export function getPath() {
  let p = window.location.pathname || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

export function matchRoute(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export async function dispatchRoute(path) {
  currentPath = path;
  for (const r of currentRoutes) {
    const params = matchRoute(r.path, path);
    if (params !== null) {
      await r.handler(params);
      return;
    }
  }
  if (notFoundHandler) {
    await notFoundHandler(path);
  }
}

export function navigate(path, { replace = false, trigger = true } = {}) {
  let target = path || '/';
  if (target.length > 1 && target.endsWith('/')) target = target.slice(0, -1);
  
  if (replace) {
    window.history.replaceState({ path: target }, '', target);
  } else if (window.location.pathname !== target) {
    window.history.pushState({ path: target }, '', target);
  }

  if (trigger) {
    return dispatchRoute(target);
  }
  return Promise.resolve();
}

export function initRouter(routes, onNotFound) {
  currentRoutes = routes;
  notFoundHandler = onNotFound;

  window.addEventListener('popstate', () => {
    dispatchRoute(getPath());
  });
}
