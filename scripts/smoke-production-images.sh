#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUFFIX="${PROD_SMOKE_SUFFIX:-$$}"
NETWORK="royal-rumble-prod-smoke-${SUFFIX}"
DB="royal-rumble-prod-db-${SUFFIX}"
API="royal-rumble-prod-api-${SUFFIX}"
FRONTEND="royal-rumble-prod-frontend-${SUFFIX}"
API_IMAGE="royal-rumble-api:prod-smoke-${SUFFIX}"
FRONTEND_IMAGE="royal-rumble-frontend:prod-smoke-${SUFFIX}"
API_PORT="${PROD_SMOKE_API_PORT:-28080}"
FRONTEND_PORT="${PROD_SMOKE_FRONTEND_PORT:-28081}"
APP_KEY="base64:skC6515ruMK0nTrlg5sy6w8SLjOmBjaZRiXUL/uDWr0="

cleanup() {
  docker rm -f "$FRONTEND" "$API" "$DB" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
  docker image rm -f "$API_IMAGE" "$FRONTEND_IMAGE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cd "$ROOT"
docker build -f backend/laravel/docker/prod/Dockerfile -t "$API_IMAGE" .
# Check the final image's CLI and embedded PHP, not just its version label.
docker run --rm --entrypoint php "$API_IMAGE" /usr/local/lib/check-php-runtime.php
docker run --rm --entrypoint frankenphp "$API_IMAGE" php-cli /usr/local/lib/check-php-runtime.php
docker build -f frontend/Dockerfile -t "$FRONTEND_IMAGE" \
  --build-arg VITE_BACKEND_URL=http://localhost:${API_PORT} \
  --build-arg VITE_PUSHER_HOST=localhost \
  --build-arg VITE_PUSHER_PORT=16001 \
  --build-arg VITE_PUSHER_SCHEME=http \
  --build-arg VITE_PUSHER_PUBLIC_ID=app-key .

docker network create "$NETWORK" >/dev/null
docker run -d --name "$DB" --network "$NETWORK" \
  -e POSTGRES_USER=royal -e POSTGRES_PASSWORD=royal -e POSTGRES_DB=royal \
  --health-cmd='pg_isready -U royal -d royal' --health-interval=2s --health-timeout=3s --health-retries=30 \
  postgres:17-alpine >/dev/null

for _ in {1..60}; do
  [[ "$(docker inspect -f '{{.State.Health.Status}}' "$DB")" == healthy ]] && break
  sleep 1
done
[[ "$(docker inspect -f '{{.State.Health.Status}}' "$DB")" == healthy ]]

runtime_env=(
  -e APP_ENV=production -e APP_DEBUG=false -e APP_KEY="$APP_KEY"
  -e APP_URL="http://localhost:${API_PORT}" -e LOG_CHANNEL=stderr
  -e DB_CONNECTION=pgsql -e DB_HOST="$DB" -e DB_PORT=5432
  -e DB_DATABASE=royal -e DB_USERNAME=royal -e DB_PASSWORD=royal
  -e BROADCAST_DRIVER=null -e CACHE_DRIVER=array -e QUEUE_CONNECTION=sync
  -e SESSION_DRIVER=array -e FILESYSTEM_DISK=public
)

docker run --rm --network "$NETWORK" "${runtime_env[@]}" --entrypoint sh "$API_IMAGE" \
  -c 'php artisan migrate --force && php artisan db:seed --class=ProductiveSeeder --force'

docker run -d --name "$API" --network "$NETWORK" -p "127.0.0.1:${API_PORT}:8080" \
  "${runtime_env[@]}" "$API_IMAGE" >/dev/null
docker run -d --name "$FRONTEND" -p "127.0.0.1:${FRONTEND_PORT}:8080" "$FRONTEND_IMAGE" >/dev/null

[[ "$(docker exec "$API" id -u)" != "0" ]]
[[ "$(docker exec "$FRONTEND" id -u)" != "0" ]]
docker exec "$API" sh -c 'test ! -x /usr/local/bin/composer && test ! -x /usr/bin/composer'

for _ in {1..60}; do
  curl -fsS "http://localhost:${API_PORT}/api/health" >/dev/null 2>&1 && \
  curl -fsS "http://localhost:${API_PORT}/api/readiness" >/dev/null 2>&1 && \
  curl -fsS "http://localhost:${FRONTEND_PORT}/health" >/dev/null 2>&1 && break
  sleep 1
done

curl -fsS "http://localhost:${API_PORT}/api/health" | grep -q '"ok"'
curl -fsS "http://localhost:${API_PORT}/api/readiness" | grep -q '"ready"'
curl -fsS "http://localhost:${FRONTEND_PORT}/lobbies/SMOKE/dashboard" | grep -q '<div id="root"></div>'
curl -fsSI "http://localhost:${FRONTEND_PORT}/" | grep -qi 'content-security-policy:'

search_json="$(curl -fsS "http://localhost:${API_PORT}/api/wrestlers/search?search=John%20Cena")"
wrestler_id="$(python3 -c 'import json,sys; data=json.load(sys.stdin)["data"]; print(next(item["id"] for item in data if item["name"] == "John Cena"))' <<<"$search_json")"
curl -fsS "http://localhost:${API_PORT}/storage/wrestlers/${wrestler_id}" -o /tmp/royal-rumble-smoke-image
curl -fsS "http://localhost:${API_PORT}/storage/wrestlers/${wrestler_id}/thumbnail.webp" -o /tmp/royal-rumble-smoke-thumbnail
[[ "$(wc -c </tmp/royal-rumble-smoke-image)" -gt 1000 ]]
[[ "$(wc -c </tmp/royal-rumble-smoke-thumbnail)" -gt 1000 ]]
rm -f /tmp/royal-rumble-smoke-image /tmp/royal-rumble-smoke-thumbnail

smoke_lobby="$(curl -fsS -H 'content-type: application/json' -H 'accept: application/json' \
  -d '{"participants":["Smoke One","Smoke Two"],"rumble_size":4}' \
  "http://localhost:${API_PORT}/api/lobbies")"
lobby_code="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["lobby"]["code"])' <<<"$smoke_lobby")"
participant_ids="$(python3 -c 'import json,sys; print(" ".join(str(p["id"]) for p in json.load(sys.stdin)["data"]["lobby"]["participants"]))' <<<"$smoke_lobby")"
read -r participant_one participant_two <<<"$participant_ids"
curl -fsS -o /dev/null -H 'content-type: application/json' -H 'accept: application/json' \
  -d "{\"participantEntranceNumbers\":{\"${participant_one}\":1,\"${participant_two}\":2}}" \
  "http://localhost:${API_PORT}/api/lobbies/${lobby_code}/entrance-numbers"
randy_id="$(curl -fsS "http://localhost:${API_PORT}/api/wrestlers/search?search=Randy%20Orton" | python3 -c 'import json,sys; print(next(item["id"] for item in json.load(sys.stdin)["data"] if item["name"] == "Randy Orton"))')"
status_one="$(mktemp)"
status_two="$(mktemp)"
curl -sS -o /dev/null -w '%{http_code}' -H 'content-type: application/json' -H 'accept: application/json' \
  -d "{\"wrestler_id\":${wrestler_id}}" "http://localhost:${API_PORT}/api/lobbies/${lobby_code}/entrance" >"$status_one" &
pid_one=$!
curl -sS -o /dev/null -w '%{http_code}' -H 'content-type: application/json' -H 'accept: application/json' \
  -d "{\"wrestler_id\":${randy_id}}" "http://localhost:${API_PORT}/api/lobbies/${lobby_code}/entrance" >"$status_two" &
pid_two=$!
wait "$pid_one" "$pid_two"
[[ "$(cat "$status_one")" == "201" && "$(cat "$status_two")" == "201" ]]
rm -f "$status_one" "$status_two"
curl -fsS "http://localhost:${API_PORT}/api/lobbies/${lobby_code}" | python3 -c 'import json,sys; lobby=json.load(sys.stdin)["data"]["lobby"]; assert sorted(r["entrance_number"] for r in lobby["rumblers"]) == [1,2]; assert [a["id"] for a in lobby["actions"]] and len(lobby["actions"]) == 2'

if [[ -x "$ROOT/frontend/node_modules/.bin/playwright" ]]; then
  (
    cd "$ROOT/frontend"
    PROD_SMOKE_FRONTEND_URL="http://localhost:${FRONTEND_PORT}" \
    PROD_SMOKE_API_URL="http://localhost:${API_PORT}" \
      yarn playwright test e2e/production-image.spec.ts
  )
fi

docker stop --time 10 "$API" >/dev/null
api_exit_code="$(docker inspect -f '{{.State.ExitCode}}' "$API")"
[[ "$api_exit_code" == "0" || "$api_exit_code" == "143" ]]

echo "Production API/frontend image smoke passed."
