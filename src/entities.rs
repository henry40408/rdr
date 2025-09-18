use opml::{OPML, Outline};

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
