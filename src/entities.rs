use std::{hash::Hasher, io::Cursor};

use bon::Builder;
use chrono::{DateTime, Utc};
use opml::{OPML, Outline};
use xxhash_rust::xxh3::{Xxh3Builder, xxh3_64};

#[derive(Builder, Clone, Debug)]
pub(crate) struct Entry {
    pub(crate) feed: Box<Feed>,
    pub(crate) guid: String,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) link: String,
    pub(crate) published_at: DateTime<Utc>,
}

impl Entry {
    pub(crate) fn from_entry(feed: Box<Feed>, entry: feed_rs::model::Entry) -> Self {
        Self {
            feed,
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
    #[builder(default)]
    pub(crate) entries: Vec<Entry>,
}

impl Feed {
    pub(crate) fn from_outline<S: AsRef<str>>(xml_url: S, outline: &Outline) -> Self {
        let xml_url = xml_url.as_ref().to_string();
        Self::builder()
            .xml_url(xml_url)
            .title(outline.text.clone())
            .build()
    }

    pub(crate) fn generate_id(&self) -> u64 {
        xxh3_64(self.xml_url.as_bytes())
    }

    pub(crate) fn html_url(&self) -> &str {
        self.html_url.as_deref().unwrap_or_default()
    }

    pub(crate) async fn fetch_entries(self: Box<Self>) -> anyhow::Result<Vec<Entry>> {
        let res = reqwest::get(&self.xml_url).await?;
        let reader = Cursor::new(res.text().await?);
        let parsed = feed_rs::parser::parse(reader)?;

        let mut entries = vec![];
        for entry in parsed.entries {
            entries.push(Entry::from_entry(self.clone(), entry));
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

    pub(crate) fn name(&self) -> &str {
        &self.outline.text
    }

    pub(crate) fn feeds_count(&self) -> usize {
        self.feeds.len()
    }
}

#[cfg(test)]
mod tests {
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
        let result = feed.fetch_entries().await.unwrap();
        assert_eq!(30, result.len());

        mock.assert_async().await;
    }
}
