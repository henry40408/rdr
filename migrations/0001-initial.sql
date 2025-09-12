CREATE TABLE entries (
    id TEXT PRIMARY KEY NOT NULL,
    feed_id INTEGER NOT NULL,
    title TEXT,
    updated TEXT,
    content TEXT,
    summary TEXT,
    published TEXT,
    source TEXT,
    rights TEXT,
    language TEXT,
    base TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
) STRICT;

CREATE TABLE entry_authors (
    entry_id TEXT NOT NULL,
    name TEXT NOT NULL,
    uri TEXT,
    email TEXT,
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE entry_links (
    entry_id TEXT NOT NULL,
    href TEXT NOT NULL,
    rel TEXT,
    type TEXT,
    hreflang TEXT,
    title TEXT,
    length INTEGER,
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE entry_categories (
    entry_id TEXT NOT NULL,
    term TEXT NOT NULL,
    scheme TEXT,
    label TEXT,
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE entry_contributors (
    entry_id TEXT NOT NULL,
    name TEXT NOT NULL,
    uri TEXT,
    email TEXT,
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE entry_media (
    entry_id TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    title TEXT,
    description TEXT,
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_entries_updated ON entries(updated);
CREATE INDEX idx_entries_published ON entries(published);
CREATE INDEX idx_entry_authors_entry_id ON entry_authors(entry_id);
CREATE INDEX idx_entry_links_entry_id ON entry_links(entry_id);
CREATE INDEX idx_entry_categories_entry_id ON entry_categories(entry_id);
CREATE INDEX idx_entry_contributors_entry_id ON entry_contributors(entry_id);
CREATE INDEX idx_entry_media_entry_id ON entry_media(entry_id);