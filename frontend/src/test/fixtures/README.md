# Released SDK test fixture

`umami-3.4.1.txt` is the unmodified `https://stats.mogott.sh/script.js` response retrieved during source preparation. The existing collector deployment is `ghcr.io/umami-software/umami:3.4.1@sha256:e69d1a7932e9dab0fc523edc7be1f3a53f3c261f57856fc2167ae74a8fc022e8`. Upstream implementation: https://github.com/umami-software/umami/blob/v3.4.1/src/tracker/index.ts (MIT).

SHA256: `654f12c7548be726eba5b71d5ef8bffc2a41a39a0053e2a49a847869ccd7ac3f`

SRI: `sha384-ZMxgpYfO/phGz4GiYTIZhcauuGKTb2onmOB5gsiigjmBR38DGAmIna5J1Y/dM/13`

Tests execute these exact released SDK bytes, intercept all collection fetches and never contact the real collector. The production hook loads the same remote SDK with SRI; drift fails closed until the reviewed fixture and integrity are updated together. This fixture is test-only, not a fork, new tracking framework or self-hosted alternative.
