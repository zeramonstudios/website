/**
 * Zeramon — Roblox live stats proxy
 * -----------------------------------------------------------------
 * Roblox's APIs don't allow direct browser calls (no CORS headers),
 * so this Worker fetches them server-side and re-serves the data
 * with CORS enabled. Deploy this on Cloudflare Workers (free tier).
 *
 * Usage:  GET https://<your-worker>.workers.dev/?placeId=123456789
 *
 * Response:
 * {
 *   "name": "Zeramon",
 *   "visits": 12400000,
 *   "playing": 3218,
 *   "likes": 54100,
 *   "dislikes": 320,
 *   "iconUrl": "https://tr.rbxcdn.com/....png"
 * }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const placeId = url.searchParams.get("placeId");

    if (!placeId) {
      return jsonResponse({ error: "Missing ?placeId=... in the request URL." }, 400);
    }

    // Serve from the edge cache when possible (60s) to stay well within
    // Roblox's rate limits even if your site gets a lot of traffic.
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      // 1) place ID -> universe ID
      const universeRes = await fetch(
        `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
      );
      if (!universeRes.ok) throw new Error("Could not resolve universe for this place ID.");
      const universeData = await universeRes.json();
      const universeId = universeData.universeId;
      if (!universeId) throw new Error("No universe found for this place ID.");

      // 2) game info: name, visits, active players
      const gameRes = await fetch(
        `https://games.roblox.com/v1/games?universeIds=${universeId}`
      );
      const gameData = await gameRes.json();
      const game = gameData.data && gameData.data[0];

      // 3) votes: likes / dislikes
      const votesRes = await fetch(
        `https://games.roblox.com/v1/games/votes?universeIds=${universeId}`
      );
      const votesData = await votesRes.json();
      const votes = votesData.data && votesData.data[0];

      // 4) game icon
      const iconRes = await fetch(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`
      );
      const iconData = await iconRes.json();
      const icon = iconData.data && iconData.data[0];

      const payload = {
        name: game?.name ?? null,
        visits: game?.visits ?? null,
        playing: game?.playing ?? null,
        likes: votes?.upVotes ?? null,
        dislikes: votes?.downVotes ?? null,
        iconUrl: icon?.imageUrl ?? null,
      };

      const response = jsonResponse(payload, 200, { "Cache-Control": "public, max-age=60" });
      // Store a copy in the edge cache for 60s.
      await cache.put(cacheKey, response.clone());
      return response;
    } catch (err) {
      return jsonResponse({ error: err.message || "Unknown error" }, 500);
    }
  },
};

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}
