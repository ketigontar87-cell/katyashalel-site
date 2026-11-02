(function (root) {
  var sensitiveKeys = {
    access_token: true,
    auth_token: true,
    authorization: true,
    code: true,
    confirmation_token: true,
    cookie: true,
    email: true,
    id_token: true,
    invitation: true,
    invite: true,
    password: true,
    provider_token: true,
    refresh_token: true,
    secret: true,
    session: true,
    token: true,
    token_hash: true
  };

  function normalizePathname(pathname) {
    if (typeof pathname !== "string" || pathname.length === 0) return "";
    if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
    return pathname;
  }

  function parsed(value) {
    try {
      return new URL(value, "https://katyashalel.com");
    } catch (error) {
      return null;
    }
  }

  function pathnameOf(value) {
    var url = parsed(value);
    return url ? url.pathname : "";
  }

  function isExcludedPath(pathname) {
    var path = normalizePathname(pathname).toLowerCase();
    if (!path) return false;
    if (path === "/carousel-studio.html") return true;
    if (path === "/sitemap.xml" || path === "/robots.txt" || path === "/llms.txt" || path === "/llms-core.txt") return true;
    if (path === "/feed.xml" || path === "/rss.xml" || path === "/ru/feed.xml" || path === "/ru/rss.xml") return true;
    if (/(^|\/)(thank-you|thanks)(\/|$)/.test(path)) return true;
    var prefixes = ["/api", "/admin", "/_vercel", "/.well-known"];
    for (var i = 0; i < prefixes.length; i++) {
      if (path === prefixes[i] || path.indexOf(prefixes[i] + "/") === 0) return true;
    }
    return false;
  }

  function stripQueryAndHash(value) {
    if (typeof value !== "string") return value;
    var looksLikeUrl = value.charAt(0) === "/" || /^https?:\/\//i.test(value);
    if (!looksLikeUrl) {
      var query = value.indexOf("?");
      var hash = value.indexOf("#");
      var cut = query >= 0 ? query : -1;
      if (hash >= 0 && (cut < 0 || hash < cut)) cut = hash;
      return cut >= 0 ? value.slice(0, cut) : value;
    }
    var url = parsed(value);
    if (!url) return "";
    url.search = "";
    url.hash = "";
    url.username = "";
    url.password = "";
    if (value.charAt(0) === "/") return url.pathname;
    return url.origin + url.pathname;
  }

  function cleanData(data) {
    if (Array.isArray(data)) return data.map(cleanValue);
    if (!data || typeof data !== "object") return data;
    var cleaned = {};
    Object.keys(data).forEach(function (key) {
      if (sensitiveKeys[String(key).toLowerCase()]) return;
      cleaned[key] = cleanValue(data[key]);
    });
    return cleaned;
  }

  function cleanValue(value) {
    if (Array.isArray(value) || (value && typeof value === "object")) return cleanData(value);
    return value;
  }

  function katyaUmamiBeforeSend(type, payload) {
    if (!payload || typeof payload !== "object") return false;
    var currentLocation = typeof location === "undefined" ? null : location;
    if (currentLocation && typeof currentLocation.pathname === "string" && isExcludedPath(currentLocation.pathname)) return false;
    var next = {};
    Object.keys(payload).forEach(function (key) {
      if (sensitiveKeys[String(key).toLowerCase()]) return;
      next[key] = payload[key];
    });
    var rawUrl = typeof next.url === "string" ? next.url : "";
    if (!rawUrl && currentLocation && typeof currentLocation.pathname === "string") {
      rawUrl = currentLocation.pathname + (currentLocation.search || "") + (currentLocation.hash || "");
    }
    if (rawUrl) {
      if (isExcludedPath(pathnameOf(rawUrl))) return false;
      next.url = stripQueryAndHash(rawUrl);
    }
    if (typeof next.referrer === "string") next.referrer = stripQueryAndHash(next.referrer);
    if (next.data && typeof next.data === "object") next.data = cleanData(next.data);
    return next;
  }

  root.katyaUmamiBeforeSend = katyaUmamiBeforeSend;
})(typeof globalThis !== "undefined" ? globalThis : this);
