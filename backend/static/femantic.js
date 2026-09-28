/** Femantic Tracker v1.4 — CORS-safe for Blogger */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) {
    var nodes = document.getElementsByTagName("script");
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].getAttribute("data-site")) { script = nodes[i]; break; }
    }
  }
  var siteKey = script && script.getAttribute("data-site");
  if (!siteKey) { console.warn("[Femantic] Missing data-site"); return; }
  var DEFAULT_ORIGIN = "https://analytics.globalcareerhub.org";
  try { if (script && script.src) DEFAULT_ORIGIN = new URL(script.src, window.location.href).origin; } catch (e) {}
  var API_BASE = (script.getAttribute("data-api") || DEFAULT_ORIGIN) + "/api/track";
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function getOrCreate(key, generator) {
    try { var val = localStorage.getItem(key); if (!val) { val = generator(); localStorage.setItem(key, val); } return val; }
    catch (e) { return generator(); }
  }
  function detectDevice() {
    var ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return "mobile";
    if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
    return "desktop";
  }
  function readQuery() { try { return new URL(window.location.href).searchParams; } catch (e) { return null; } }
  function captureUtm() {
    var q = readQuery();
    var fresh = { utm_source: q && q.get("utm_source"), utm_medium: q && q.get("utm_medium"), utm_campaign: q && q.get("utm_campaign"), utm_term: q && q.get("utm_term"), utm_content: q && q.get("utm_content") };
    if (q && q.get("gclid") && !fresh.utm_source) { fresh.utm_source = "google"; fresh.utm_medium = fresh.utm_medium || "cpc"; }
    if (q && q.get("fbclid") && !fresh.utm_source) { fresh.utm_source = "facebook"; fresh.utm_medium = fresh.utm_medium || "paid"; }
    var hasFresh = fresh.utm_source || fresh.utm_medium || fresh.utm_campaign;
    if (hasFresh) { try { sessionStorage.setItem("femantic_utm", JSON.stringify(fresh)); } catch (e) {} return fresh; }
    try { var saved = sessionStorage.getItem("femantic_utm"); if (saved) return JSON.parse(saved); } catch (e) {}
    return fresh;
  }
  var visitorId = getOrCreate("femantic_vid", uuid);
  var sessionId = getOrCreate("femantic_sid", uuid);
  function buildPayload(eventType) {
    var utm = captureUtm();
    return {
      path: (window.location.pathname || "/") + (window.location.search || ""),
      title: document.title || "",
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      language: navigator.language || null,
      screen_width: window.screen ? window.screen.width : null,
      screen_height: window.screen ? window.screen.height : null,
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || null,
      device: detectDevice(),
      visitor_id: visitorId,
      session_id: sessionId,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_term: utm.utm_term || null,
      utm_content: utm.utm_content || null,
      event_type: eventType || "pageview",
      timestamp: new Date().toISOString()
    };
  }
  function send(payload) {
    var url = API_BASE + "/" + siteKey;
    var body = JSON.stringify(payload);
    try {
      fetch(url, {
        method: "POST",
        body: body,
        mode: "cors",
        credentials: "omit",
        keepalive: true
      }).catch(function () {});
    } catch (e) {
      try { navigator.sendBeacon(url, body); } catch (e2) {}
    }
  }
  send(buildPayload("pageview"));
  setInterval(function () { send(buildPayload("heartbeat")); }, 30000);
  window.Femantic = { track: function (n, d) { var p = buildPayload("event"); p.event_name = n; p.event_data = d || {}; send(p); } };
})();
