CREATE INDEX IF NOT EXISTS ix_pageviews_site_created ON pageviews (website_id, created_at);
CREATE INDEX IF NOT EXISTS ix_pageviews_site_label_created ON pageviews (website_id, traffic_label, created_at);
CREATE INDEX IF NOT EXISTS ix_pageviews_visitor ON pageviews (website_id, visitor_id);
CREATE INDEX IF NOT EXISTS ix_pageviews_utm_source ON pageviews (utm_source);
CREATE INDEX IF NOT EXISTS ix_pageviews_utm_medium ON pageviews (utm_medium);
CREATE INDEX IF NOT EXISTS ix_pageviews_utm_campaign ON pageviews (utm_campaign);
CREATE INDEX IF NOT EXISTS ix_pageviews_utm_term ON pageviews (utm_term);
CREATE INDEX IF NOT EXISTS ix_events_site_name_created ON events (website_id, event_name, created_at);
CREATE INDEX IF NOT EXISTS ix_sessions_site_started ON sessions (website_id, started_at);
