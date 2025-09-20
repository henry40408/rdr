use std::{path::PathBuf, sync::Arc};

use bon::bon;
use parking_lot::Mutex;
use rusqlite::{Connection, params};
use tracing::debug;

use crate::entities::{Entry, Feed};

static MIGRATIONS: &[&str] = &[include_str!("migrations/0001-initial.sql")];

#[derive(Clone)]
pub(crate) struct Repository {
    conn: Arc<Mutex<Connection>>,
}

#[bon]
impl Repository {
    #[builder]
    pub(crate) fn new(#[builder(start_fn)] path: Option<PathBuf>) -> anyhow::Result<Self> {
        let path = path.as_ref();
        let mut conn = if let Some(p) = path {
            debug!("Open database at {:?}", p);
            Connection::open(p)?
        } else {
            debug!("Open in-memory database");
            Connection::open_in_memory()?
        };
        Self::migrate(&mut conn)?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    fn migrate(conn: &mut Connection) -> anyhow::Result<()> {
        for migration in MIGRATIONS {
            conn.execute_batch(migration)?;
            debug!("Applied migration: {migration}");
        }
        Ok(())
    }

    pub(crate) fn upsert_entries(&self, entries: &Vec<Entry>) -> anyhow::Result<()> {
        let mut conn = self.conn.lock();
        let tx = conn.transaction()?;
        for entry in entries {
            tx.execute(
                r#"INSERT INTO entries (feed_id, guid, title, description, link, published_at)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                     ON CONFLICT(feed_id, guid) DO UPDATE SET
                        title = excluded.title,
                        description = excluded.description,
                        link = excluded.link,
                        published_at = excluded.published_at"#,
                params![
                    entry.feed.generate_id(),
                    entry.guid,
                    entry.title,
                    entry.description,
                    entry.link,
                    entry.published_at,
                ],
            )?;
        }
        tx.commit()?;
        debug!("Upserted {} entries", entries.len());
        Ok(())
    }

    pub(crate) fn find_entry_by_feed(&self, feed: &Feed) -> anyhow::Result<Vec<Entry>> {
        let conn = self.conn.lock();

        let mut stmt = conn.prepare(
            r#"SELECT feed_id, guid, title, description, link, published_at
               FROM entries
               WHERE feed_id = ?1
               ORDER BY published_at DESC"#,
        )?;
        let feed_id = feed.generate_id();
        let entry_iter = stmt.query_map(params![feed_id], |row| {
            Ok(Entry {
                feed: feed.clone(),
                guid: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                link: row.get(4)?,
                published_at: row.get(5)?,
            })
        })?;

        let mut entries = vec![];
        for entry in entry_iter {
            entries.push(entry?);
        }
        Ok(entries)
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        entities::{Entry, Feed},
        repository::Repository,
    };

    #[test]
    fn test_new_in_memory() {
        Repository::builder(None).build().unwrap();
    }

    #[test]
    fn test_upsert_entries() {
        let repository = Repository::builder(None).build().unwrap();

        let xml_url = "https://hnrss.org/best";

        let feed = Feed::builder()
            .title("Hacker News: Best")
            .xml_url(xml_url)
            .build();

        let parsed: feed_rs::model::Feed =
            feed_rs::parser::parse(&include_bytes!("./fixtures/hnrss.xml")[..]).unwrap();
        let mut entries = vec![];
        for e in &parsed.entries {
            entries.push(Entry::from_entry(&feed, e.clone()));
        }

        repository.upsert_entries(&entries).unwrap();
        repository.upsert_entries(&entries).unwrap(); // upsert again to test idempotency

        let found = repository.find_entry_by_feed(&feed).unwrap();
        assert_eq!(found.len(), entries.len());
    }
}
