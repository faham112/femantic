/**
 * Femantic Tracker v1.1
 * Usage:
 * <script defer data-site="YOUR_API_KEY" src="https://analytics.globalcareerhub.org/tracker/femantic.js"></script>
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var siteKey = script && script.getAttribute("data-site");
  if (!siteKey) {
    console.warn("[Femantic] Missing data-site attribute");
    return;
  }

  var DEFAULT_ORIGIN = "https://analytics.globalcareerhub.org";
  try {
    if (script && script.src) {
      DEFAULT_ORIGIN = new URL(script.src, window.location.href).origin;
    }
  } catch (e) {}

  var API_BASE = (script.getAttribute("data-api") || DEFAULT_ORIGIN) + "/api/track";
  var SESSION_KEY = "femantic_sid";
  var VISITOR_KEY = "femantic_vid";
  var HEARTBEAT_INTERVAL = 30000;

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
      if (!val) {
        val = generator();
        localStorage.setItem(key, val);
      }
      return val;
    } catch (e) {
      return generator();
    }
  }

  function detectDevice() {
    var ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return "mobile";
    if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
    return "desktop";
  }

  function getUTM(param) {
    try {
      return new URL(window.location.href).searchParams.get(param) || null;
    } catch (e) {
      return null;
    }
  }

  var visitorId = getOrCreate(VISITOR_KEY, uuid);
  var sessionId = getOrCreate(SESSION_KEY, uuid);

  function buildPayload(eventType) {
    return {
      path: window.location.pathname + window.location.search,
      title: document.title || "",
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      language: navigator.language || null,
      screen_width: window.screen ? window.screen.width : null,
      screen_height: window.screen ? window.screen.height : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      device: detectDevice(),
      visitor_id: visitorId,
      session_id: sessionId,
      utm_source: getUTM("utm_source"),
      utm_medium: getUTM("utm_medium"),
      utm_campaign: getUTM("utm_campaign"),
      event_type: eventType || "pageview",
      timestamp: new Date().toISOString()
    };
  }

  function send(payload) {
    var url = API_BASE + "/" + siteKey;
    if (!navigator.sendBeacon) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
      return;
    }
    navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: "application/json" }));
  }

  function trackPageview() { send(buildPayload("pageview")); }

  if (document.readyState === "complete") trackPageview();
  else window.addEventListener("load", trackPageview);

  setInterval(function () { send(buildPayload("heartbeat")); }, HEARTBEAT_INTERVAL);

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
