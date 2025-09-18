use std::io::Cursor;

use opml::{OPML, Outline};

#[derive(Clone, Debug)]
pub(crate) struct Entry {
    inner: feed_rs::model::Entry,
}

#[derive(Clone, Debug)]
pub(crate) struct Feed {
    outline: Outline,
    xml_url: String,
}

impl Feed {
    pub(crate) fn title(&self) -> &str {
        &self.outline.text
    }

    pub(crate) fn xml_url(&self) -> &str {
        &self.xml_url
    }

    pub(crate) fn html_url(&self) -> &str {
        self.outline.html_url.as_deref().unwrap_or_default()
    }

    pub(crate) async fn fetch_entries(&self) -> anyhow::Result<Vec<Entry>> {
        let res = reqwest::get(&self.xml_url).await?;
        let reader = Cursor::new(res.text().await?);
        let parsed = feed_rs::parser::parse(reader)?;

        let mut entries = vec![];
        for entry in parsed.entries {
            entries.push(Entry { inner: entry });
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
                    let feed = Feed {
                        outline: feed_outline.clone(),
                        xml_url: xml_url.clone(),
                    };
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
    #[tokio::test]
    async fn test_fetch_entries() {
        let mut server = mockito::Server::new_async().await;
        let url = server.url();

        let feed = super::Feed {
            outline: opml::Outline {
                xml_url: Some(url.clone()),
                ..Default::default()
            },
            xml_url: url.clone(),
        };

        let mock = server
            .mock("GET", "/")
            .with_status(200)
            .with_header("content-type", "application/rss+xml")
            .with_body(include_str!("./fixtures/hnrss.xml"))
            .create_async()
            .await;

        let result = feed.fetch_entries().await.unwrap();
        assert_eq!(30, result.len());

        mock.assert_async().await;
    }
}
