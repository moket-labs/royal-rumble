import { useEffect, useRef } from "react";

const WEBSITE = "83cd5bae-bd5f-4689-a865-676d4e954755";
const INTEGRITY = "sha384-ZMxgpYfO/phGz4GiYTIZhcauuGKTb2onmOB5gsiigjmBR38DGAmIna5J1Y/dM/13";
type Pageview = { website: string; hostname: string; url: string; title: string; referrer: string };
type AnalyticsWindow = Window & {
  doNotTrack?: string | number;
  umami?: { track: (payload: Pageview) => Promise<void>; identify?: () => Promise<void> };
};

// One landing owner per document: StrictMode reuses its ref, real remounts do not.
// Never re-arm analytics after entering a room/form or returning from one.
let owner: symbol | undefined;
let blocked = false;
let sent = false;
let allowed = () => false;
let sdkTrack: ((payload: Pageview) => Promise<void>) | undefined;

function publicEntry() {
  const browser = window as AnalyticsWindow;
  const { protocol, hostname, pathname, search, hash } = browser.location;
  const dnt = [browser.doNotTrack, browser.navigator.doNotTrack,
    (browser.navigator as Navigator & { msDoNotTrack?: string | number }).msDoNotTrack]
    .some((value) => value === 1 || value === "1" || (typeof value === "string" && value.toLowerCase() === "yes"));
  return browser.self === browser.top && protocol === "https:" && hostname === "suffroyale.com" &&
    pathname === "/" && !search && !hash && !dnt;
}

// This eagerly imported module runs before router creation. A private document
// entry must never become eligible through a later redirect to the landing page.
const initialPublicEntry = typeof window !== "undefined" && publicEntry();

function referrerOrigin() {
  try {
    const url = new URL(window.document.referrer);
    return url.protocol === "https:" && !url.username && !url.password ? url.origin : "";
  } catch {
    return "";
  }
}

function sendLanding() {
  if (!sdkTrack || sent) return;
  const payload = { website: WEBSITE, hostname: "suffroyale.com", url: "/", title: "Suff Royale", referrer: referrerOrigin() };
  // With no beforeSend callback, the pinned SDK reaches fetch synchronously.
  // Recheck eligibility immediately before invoking its private transport.
  if (!allowed()) return;
  sent = true;
  void sdkTrack(payload);
}

/** Call ONLY from CreateJoinLobby, never a shared app/lobby layout. */
export function usePublicPageview(hasLobbyCode: boolean) {
  const instance = useRef(Symbol("public-landing"));
  useEffect(() => {
    if (owner && owner !== instance.current) return;
    if (hasLobbyCode) blocked = true;
    if (blocked || !initialPublicEntry || !publicEntry()) return;
    owner = instance.current;
    let active = true;
    allowed = () => active && !blocked && initialPublicEntry && !hasLobbyCode && publicEntry();
    const browser = window as AnalyticsWindow;
    if (!browser.document.querySelector("script[data-suffroyale-analytics]")) {
      const script = browser.document.createElement("script");
      script.src = "https://stats.mogott.sh/script.js";
      script.async = true;
      script.integrity = INTEGRITY;
      script.crossOrigin = "anonymous";
      script.referrerPolicy = "no-referrer";
      Object.assign(script.dataset, {
        suffroyaleAnalytics: "true", websiteId: WEBSITE, domains: "suffroyale.com",
        hostUrl: "https://stats.mogott.sh",
        autoTrack: "false", autoPageview: "false", performance: "false",
        doNotTrack: "true", excludeSearch: "true", excludeHash: "true", fetchCredentials: "omit",
      });
      script.onload = () => {
        sdkTrack = browser.umami?.track;
        // Keep the original SDK method private; all public calls are inert.
        // autoTrack=false prevents SDK event/history/performance initialization.
        browser.umami = { track: () => Promise.resolve(), identify: () => Promise.resolve() };
        sendLanding();
      };
      browser.document.head.append(script);
    }
    sendLanding();
    return () => { active = false; };
  }, [hasLobbyCode]);
}
