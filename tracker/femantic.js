/**
 * Femantic Tracker v1.3
 * Blogger-safe: finds data-site even when currentScript is null.
 */
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
  if (!siteKey) {
    console.warn("[Femantic] Missing data-site");
    return;
  }

  var DEFAULT_ORIGIN = "https://analytics.globalcareerhub.org";
  try {
    if (script && script.src) DEFAULT_ORIGIN = new URL(script.src, window.location.href).origin;
  } catch (e) {}

  var API_BASE = (script.getAttribute("data-api") || DEFAULT_ORIGIN) + "/api/track";
  var SESSION_KEY = "femantic_sid";
  var VISITOR_KEY = "femantic_vid";
  var UTM_KEY = "femantic_utm";

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreate(key, generator) {
    try {
      var val = localStorage.getItem(key);
      if (!val) { val = generator(); localStorage.setItem(key, val); }
      return val;
    } catch (e) { return generator(); }
  }

  function detectDevice() {
    var ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return "mobile";
    if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
    return "desktop";
  }

  function readQuery() {
    try { return new URL(window.location.href).searchParams; } catch (e) { return null; }
  }

  function captureUtm() {
    var q = readQuery();
    var fresh = {
      utm_source: q && q.get("utm_source"),
      utm_medium: q && q.get("utm_medium"),
      utm_campaign: q && q.get("utm_campaign"),
      utm_term: q && q.get("utm_term"),
      utm_content: q && q.get("utm_content")
    };
    if (q && q.get("gclid") && !fresh.utm_source) { fresh.utm_source = "google"; fresh.utm_medium = fresh.utm_medium || "cpc"; }
    if (q && q.get("fbclid") && !fresh.utm_source) { fresh.utm_source = "facebook"; fresh.utm_medium = fresh.utm_medium || "paid"; }
    if (q && q.get("msclkid") && !fresh.utm_source) { fresh.utm_source = "bing"; fresh.utm_medium = fresh.utm_medium || "cpc"; }
    var hasFresh = fresh.utm_source || fresh.utm_medium || fresh.utm_campaign || fresh.utm_term || fresh.utm_content;
    if (hasFresh) {
      try { sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh)); } catch (e) {}
      return fresh;
    }
    try {
      var saved = sessionStorage.getItem(UTM_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return fresh;
  }

  var visitorId = getOrCreate(VISITOR_KEY, uuid);
  var sessionId = getOrCreate(SESSION_KEY, uuid);

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
      hostname: window.location.hostname || null,
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
      if (navigator.sendBeacon) {
        var ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
        if (ok) return;
      }
    } catch (e) {}
    try {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true, mode: "cors" }).catch(function () {});
    } catch (e2) {}
  }

  var sent = false;
  function trackPageview() {
    send(buildPayload("pageview"));
    sent = true;
  }

  trackPageview();
  if (document.readyState !== "complete") {
    window.addEventListener("load", function () { if (!sent) trackPageview(); });
  }

  setInterval(function () { send(buildPayload("heartbeat")); }, 30000);

  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(history, arguments);
    setTimeout(trackPageview, 50);
  };
  window.addEventListener("popstate", function () { setTimeout(trackPageview, 50); });

  window.Femantic = {
    track: function (eventName, data) {
      var payload = buildPayload("event");
      payload.event_name = eventName;
      payload.event_data = data || {};
      send(payload);
    },
    visitorId: visitorId,
    sessionId: sessionId
  };
})();
