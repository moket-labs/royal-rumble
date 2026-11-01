// @vitest-environment-options {"url":"https://suffroyale.com/"}
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { StrictMode, type ReactNode } from "react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import sdk from "../test/fixtures/umami-3.4.1.txt?raw";

let usePublicPageview: typeof import("./use_public_pageview").usePublicPageview;
const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ cache: "test-cache" }) });
const strict = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

beforeEach(async () => {
  vi.resetModules();
  vi.restoreAllMocks();
  fetchMock.mockClear();
  window.history.replaceState({}, "", "/");
  localStorage.clear();
  Object.defineProperty(window, "doNotTrack", { get: () => undefined, configurable: true });
  Object.defineProperty(window.navigator, "doNotTrack", { get: () => "0", configurable: true });
  Object.defineProperty(window.navigator, "msDoNotTrack", { get: () => undefined, configurable: true });
  document.title = "PRIVATE participant and lobby title";
  vi.spyOn(document, "referrer", "get").mockReturnValue("https://accounts.example/private/token?code=secret#identity");
  delete (window as unknown as Record<string, unknown>).umami;
  document.querySelectorAll("script[data-website-id]").forEach((s) => s.remove());
  ({ usePublicPageview } = await import("./use_public_pageview"));
});
afterEach(() => vi.unstubAllGlobals());

async function loadSdk() {
  const script = document.querySelector<HTMLScriptElement>("script[data-website-id]");
  expect(script).not.toBeNull();
  vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
  // Execute the real released SDK, with every collection request intercepted.
  new Function("window", "fetch", sdk)(window, fetchMock);
  await act(async () => { script!.dispatchEvent(new Event("load")); });
  return script!;
}

it("sends exactly one fixed pageview with the released SDK across StrictMode and remounts", async () => {
  const { rerender, unmount } = renderHook(() => usePublicPageview(false), { wrapper: strict });
  const script = await loadSdk();
  rerender();
  unmount();
  renderHook(() => usePublicPageview(false), { wrapper: strict });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("https://stats.mogott.sh/api/send");
  expect(options.credentials).toBe("omit");
  expect(options.method).toBe("POST");
  expect(options.headers).toEqual({
    "Content-Type": "application/json",
    "x-umami-website-id": "83cd5bae-bd5f-4689-a865-676d4e954755",
    "x-umami-hostname": "suffroyale.com",
  });
  expect(JSON.parse(options.body)).toEqual({ type: "event", payload: {
    website: "83cd5bae-bd5f-4689-a865-676d4e954755", hostname: "suffroyale.com",
    url: "/", title: "Suff Royale", referrer: "https://accounts.example",
  } });
  expect(script.referrerPolicy).toBe("no-referrer");
  expect(script.crossOrigin).toBe("anonymous");
  expect(script.integrity).toBe("sha384-ZMxgpYfO/phGz4GiYTIZhcauuGKTb2onmOB5gsiigjmBR38DGAmIna5J1Y/dM/13");
  expect(script.dataset.domains).toBe("suffroyale.com");
  expect(script.dataset.doNotTrack).toBe("true");
  expect(script.dataset.autoTrack).toBe("false");
  expect(script.dataset.autoPageview).toBe("false");
  expect(script.dataset.performance).toBe("false");
  expect(script.dataset.excludeSearch).toBe("true");
  expect(script.dataset.excludeHash).toBe("true");
  expect(script.dataset.fetchCredentials).toBe("omit");
});

it.each([
  "/lobbies/create", "/lobbies/SECRET", "/lobbies/SECRET/dashboard",
  "/lobbies/SECRET/assign-entrance-numbers", "/lobbies/SECRET/distribute/99",
  "/invite/SECRET", "/auth/callback", "/account", "/share/SIGNED",
  "/?code=SECRET", "/?frame_id=SECRET", "/#access_token=SECRET", "/unknown",
])("does not even load analytics at sensitive or unknown entry %s", (path) => {
  window.history.replaceState({}, "", path);
  renderHook(() => usePublicPageview(false));
  expect(document.querySelector("script[data-website-id]")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not load for a entered lobby code", () => {
  renderHook(() => usePublicPageview(true));
  expect(document.querySelector("script[data-website-id]")).toBeNull();
});

it("cancels a delayed load when a code is entered, including after clearing it", async () => {
  const { rerender } = renderHook(({ hasCode }) => usePublicPageview(hasCode), { initialProps: { hasCode: false } });
  rerender({ hasCode: true });
  rerender({ hasCode: false });
  await loadSdk();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("cancels delayed SDK completion after unmount and private navigation", async () => {
  const { unmount } = renderHook(() => usePublicPageview(false));
  unmount();
  window.history.pushState({}, "", "/lobbies/SECRET/view-game");
  await loadSdk();
  expect(fetchMock).not.toHaveBeenCalled();
  window.history.pushState({}, "", "/");
  renderHook(() => usePublicPageview(false));
  expect(fetchMock).not.toHaveBeenCalled();
});

it("rejects arbitrary SDK pageviews, events, identify and performance after the one authorized view", async () => {
  renderHook(() => usePublicPageview(false));
  await loadSdk();
  const tracker = (window as unknown as { umami: { track: (payload?: unknown) => Promise<void>; identify: (id: string) => Promise<void> } }).umami;
  await tracker.track();
  await tracker.track("private-event");
  await tracker.identify("private-user");
  await tracker.track({ website: "83cd5bae-bd5f-4689-a865-676d4e954755", url: "/", title: "Suff Royale" });
  window.history.pushState({}, "", "/lobbies/SECRET");
  document.dispatchEvent(new Event("readystatechange"));
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("pagehide"));
  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it.each(["1", "yes"])("honors DNT %s before script load", (value) => {
  vi.spyOn(window.navigator, "doNotTrack", "get").mockReturnValue(value);
  renderHook(() => usePublicPageview(false));
  expect(document.querySelector("script[data-website-id]")).toBeNull();
});

const conflictingDntCases = ["window", "navigator", "ms"].flatMap((field) =>
  [1, "1", "yes", "YeS"].map((value) => ({ field, value })),
);

function setDnt(field: string, value: string | number) {
  Object.defineProperty(field === "window" ? window : window.navigator,
    field === "ms" ? "msDoNotTrack" : "doNotTrack", { value, configurable: true });
}

it.each(conflictingDntCases)("denies conflicting DNT $field=$value before script admission", async ({ field, value }) => {
  // The other supported fields remain truthy "0": none may mask an opt-out.
  ["window", "navigator", "ms"].forEach((source) => setDnt(source, "0"));
  setDnt(field, value);
  vi.resetModules();
  ({ usePublicPageview } = await import("./use_public_pageview"));
  renderHook(() => usePublicPageview(false));
  expect(document.querySelector("script[data-website-id]")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each(conflictingDntCases)("denies conflicting DNT $field=$value at actual SDK dispatch", async ({ field, value }) => {
  renderHook(() => usePublicPageview(false));
  ["window", "navigator", "ms"].forEach((source) => setDnt(source, "0"));
  setDnt(field, value);
  await loadSdk();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("honors a late DNT change without a write", async () => {
  renderHook(() => usePublicPageview(false));
  Object.defineProperty(window.navigator, "doNotTrack", { value: "1", configurable: true });
  await loadSdk();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not load inside an embedded Activity/frame", () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  vi.stubGlobal("window", frame.contentWindow);
  renderHook(() => usePublicPageview(false));
  expect(frame.contentDocument!.querySelector("script[data-website-id]")).toBeNull();
  frame.remove();
});

it.each(["/lobbies/SECRET", "/?invite=SECRET", "/#access_token=SECRET"])("does not track an excluded-entry document redirected to landing: %s", async (entry) => {
  window.history.replaceState({}, "", entry);
  vi.resetModules();
  ({ usePublicPageview } = await import("./use_public_pageview"));
  // This is also the real useLobby error/expired-room redirect destination.
  window.history.replaceState({}, "", "/");
  renderHook(() => usePublicPageview(false));
  expect(document.querySelector("script[data-website-id]")).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("has no asynchronous authorization-to-fetch gap on SDK completion", async () => {
  renderHook(() => usePublicPageview(false));
  const script = document.querySelector<HTMLScriptElement>("script[data-website-id]")!;
  vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
  new Function("window", "fetch", sdk)(window, fetchMock);
  act(() => { script.dispatchEvent(new Event("load")); });
  // The authorized write must already have occurred in the public state,
  // not be waiting in a microtask which can run after private navigation.
  expect(fetchMock).toHaveBeenCalledTimes(1);
  window.history.pushState({}, "", "/lobbies/SECRET/dashboard");
  await act(async () => {});
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("wires the real landing form to the gate and never reads typed room data into analytics", async () => {
  const { default: CreateJoinLobby } = await import("../routes/create_join_lobby");
  const { I18nProvider } = await import("../i18n");
  render(<MemoryRouter><I18nProvider><CreateJoinLobby /></I18nProvider></MemoryRouter>);
  expect(document.querySelector("script[data-website-id]")).not.toBeNull();
  await userEvent.type(screen.getByRole("textbox", { name: /lobby code/i }), "SECRET");
  await loadSdk();
  expect(fetchMock).not.toHaveBeenCalled();
}, 15_000);

it("the real landing form emits one pageview without leaking subsequently typed code", async () => {
  const { default: CreateJoinLobby } = await import("../routes/create_join_lobby");
  const { I18nProvider } = await import("../i18n");
  render(<MemoryRouter><I18nProvider><CreateJoinLobby /></I18nProvider></MemoryRouter>);
  await loadSdk();
  await userEvent.type(screen.getByRole("textbox", { name: /lobby code/i }), "SECRET");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][1].body).not.toContain("SECRET");
});

it.each(["/?invite=SECRET", "/#access_token=SECRET", "/lobbies/SECRET/dashboard"])("rechecks live navigation before delayed SDK completes %s", async (path) => {
  renderHook(() => usePublicPageview(false));
  window.history.pushState({}, "", path);
  await loadSdk();
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each(["http://unsafe.example/path", "https://user:pass@example.com/token", "not a URL", ""])("omits unsafe referrer %s", async (referrer) => {
  vi.spyOn(document, "referrer", "get").mockReturnValue(referrer);
  renderHook(() => usePublicPageview(false));
  await loadSdk();
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).payload.referrer).toBe("");
});
