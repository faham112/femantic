ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS utm_term VARCHAR(100);
ALTER TABLE pageviews ADD COLUMN IF NOT EXISTS utm_content VARCHAR(100);
CREATE INDEX IF NOT EXISTS ix_pageviews_utm_source ON pageviews (utm_source);
CREATE INDEX IF NOT EXISTS ix_pageviews_utm_campaign ON pageviews (utm_campaign);
