use std::io::Cursor;

use bon::Builder;
use chrono::{DateTime, Utc};
use opml::{OPML, Outline};
use reqwest::{Client, Method, Request, header};
use tracing::{Instrument, debug, debug_span, error};
use xxhash_rust::xxh3::xxh3_64;

#[derive(Builder, Clone, Debug)]
pub(crate) struct Entry {
    pub(crate) feed: Feed,
    pub(crate) guid: String,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) link: String,
    pub(crate) published_at: DateTime<Utc>,
}

impl Entry {
    pub(crate) fn from_entry(feed: &Feed, entry: feed_rs::model::Entry) -> Self {
        Self {
            feed: feed.clone(),
            guid: entry.id.clone(),
            title: entry
                .title
                .as_ref()
                .map(|t| t.content.clone())
                .unwrap_or_default(),
            description: entry
                .content
                .as_ref()
                .and_then(|c| c.body.clone())
                .unwrap_or_default(),
            link: entry
                .links
                .first()
                .map(|l| l.href.clone())
                .unwrap_or_default(),
            published_at: entry.published.unwrap_or_else(Utc::now),
        }
    }
}

#[derive(Builder, Clone, Debug)]
pub(crate) struct Feed {
    #[builder(into)]
    pub(crate) title: String,
    #[builder(into)]
    pub(crate) xml_url: String,
    pub(crate) html_url: Option<String>,
}

impl Feed {
    pub(crate) fn generate_id(&self) -> String {
        format!("{:016x}", xxh3_64(self.xml_url.as_bytes()))
    }

    pub(crate) fn html_url(&self) -> &str {
        self.html_url.as_deref().unwrap_or_default()
    }

    pub(crate) async fn fetch_entries(&self, client: &Client) -> anyhow::Result<Vec<Entry>> {
        let span = debug_span!("fetch_feed_entries", xml_url = %self.xml_url);
        let _ = span.enter();

        let mut req = Request::new(Method::GET, self.xml_url.parse()?);
        req.headers_mut()
            .insert(header::USER_AGENT, "Feedly/1.0".parse()?);

        debug!("Fetching feed from {}", self.xml_url);
        let res = client.execute(req).instrument(span).await?;

        let res = match res.error_for_status() {
            Err(err) => {
                error!("Failed to fetch {}: {:?}", self.xml_url, err);
                return Err(err.into());
            }
            Ok(res) => res,
        };

        let reader = Cursor::new(res.text().await?);
        let parsed = feed_rs::parser::parse(reader)?;

        let mut entries = vec![];
        for entry in parsed.entries {
            entries.push(Entry::from_entry(self, entry));
        }
        Ok(entries)
    }
}

#[derive(Clone, Debug)]
pub(crate) struct Category {
    outline: Outline,
    pub(crate) feeds: Vec<Feed>,
}

impl Category {
    pub(crate) fn from_opml(opml: OPML) -> Vec<Self> {
        let mut categories = vec![];
        for outline in opml.body.outlines {
            if outline.outlines.is_empty() {
                continue;
            }

            let mut feeds = vec![];
            for feed_outline in &outline.outlines {
                if let Some(xml_url) = &feed_outline.xml_url {
                    let feed = Feed::builder()
                        .xml_url(xml_url.clone())
                        .title(feed_outline.text.clone())
                        .maybe_html_url(feed_outline.html_url.clone())
                        .build();
                    feeds.push(feed);
                }
            }

            let category = Category { outline, feeds };
            categories.push(category);
        }

        categories
    }

    pub(crate) fn generate_id(&self) -> String {
        format!("{:016x}", xxh3_64(self.outline.text.as_bytes()))
    }

    pub(crate) fn name(&self) -> &str {
        &self.outline.text
    }

    pub(crate) fn feeds_count(&self) -> usize {
        self.feeds.len()
    }

    pub(crate) async fn fetch_entries(&self, client: &Client) -> anyhow::Result<Vec<Entry>> {
        let span = debug_span!("fetch_category_entries", category = %self.name());
        let _ = span.enter();

        let mut all_entries = vec![];
        let mut tasks = vec![];
        for feed in &self.feeds {
            tasks.push(feed.fetch_entries(client));
        }
        let results = futures::future::join_all(tasks).await;
        for (result, feed) in results.iter().zip(&self.feeds) {
            match result {
                Ok(ls) => {
                    all_entries.extend(ls.clone());
                }
                Err(err) => {
                    error!("Failed to fetch entries from {}: {:?}", feed.xml_url, err);
                }
            }
        }
        Ok(all_entries)
    }
}

#[cfg(test)]
mod tests {
    use reqwest::Client;

    use crate::entities::Feed;

    #[tokio::test]
    async fn test_fetch_entries() {
        let mut server = mockito::Server::new_async().await;
        let url = server.url();

        let feed = Feed::builder()
            .title("Hacker News: Best")
            .xml_url(url)
            .build();

        let mock = server
            .mock("GET", "/")
            .with_status(200)
            .with_header("content-type", "application/rss+xml")
            .with_body(include_str!("./fixtures/hnrss.xml"))
            .create_async()
            .await;

        let feed = Box::new(feed);
        let client = Client::new();
        let result = feed.fetch_entries(&client).await.unwrap();
        assert_eq!(30, result.len());

        mock.assert_async().await;
    }
}
