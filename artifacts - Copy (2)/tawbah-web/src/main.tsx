import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./design-system/index.css";
import { initTheme } from "./core/theme";
import { isNativeApp, getApiBase } from "./lib/api-base";

initTheme();

if (isNativeApp()) {
  const apiBase = getApiBase();
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = input.toString();
    }
    if (url.startsWith("/api/") || url === "/api") {
      const resolved = apiBase + url.slice(4);
      if (input instanceof Request) {
        return nativeFetch(new Request(resolved, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          mode: input.mode,
          credentials: input.credentials,
          cache: input.cache,
          redirect: input.redirect,
          referrer: input.referrer,
          integrity: input.integrity,
          ...init,
        }));
      }
      return nativeFetch(resolved, init);
    }
    return nativeFetch(input, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
