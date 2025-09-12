use std::{path::PathBuf, process::ExitCode};

use askama::Template;
use axum::{
    Router,
    extract::State,
    http::header,
    response::{Html, IntoResponse},
    routing::get,
};
use bon::Builder;
use clap::Parser;
use clio::Input;
use no_color::is_no_color;
use opml::OPML;
use rusqlite::Connection;
use tracing::{Level, debug, enabled, info, warn};
use tracing_subscriber::{EnvFilter, fmt::format::FmtSpan};

static MIGRATIONS: &[&str] = &[include_str!("../migrations/0001-initial.sql")];

static HTMX: &str = include_str!("../vendor/htmx.min.js");
static PICO_CSS: &str = include_str!("../vendor/pico.min.css");

#[derive(Builder, Clone, Debug)]
struct AppState {
    categories: Vec<Category>,
}

#[derive(Debug, Parser)]
struct Opts {
    /// Bound address and port
    #[clap(long, default_value = "127.0.0.1:3000", env = "BIND")]
    bind: String,
    /// Path to cache file
    #[clap(long, value_parser, env = "CACHE_PATH")]
    cache_path: Option<PathBuf>,
    /// Enable debug mode
    #[clap(long, short = 'd', env = "DEBUG")]
    debug: bool,
    /// The input file to read from
    #[clap(long, value_parser, default_value = "feeds.opml")]
    file: Input,
    /// Disable colored output
    #[clap(long, env = "NO_COLOR")]
    no_color: bool,
}

#[derive(Template)]
#[template(path = "index.j2")]
struct IndexTemplate {}

#[derive(Template)]
#[template(path = "feeds.j2")]
struct FeedsTemplate {
    categories: Vec<Category>,
}

struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("Internal server error: {}", self.0),
        )
            .into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        AppError(err.into())
    }
}

async fn index_route() -> anyhow::Result<Html<String>, AppError> {
    let t = IndexTemplate {};
    let rendered = t.render()?;
    Ok(Html(rendered))
}

async fn feeds_route(State(state): State<AppState>) -> anyhow::Result<Html<String>, AppError> {
    let t = FeedsTemplate {
        categories: state.categories,
    };
    let rendered = t.render()?;
    Ok(Html(rendered))
}

fn migrate(conn: &mut Connection) -> anyhow::Result<()> {
    conn.execute("PRAGMA foreign_keys=ON", [])?;
    for migration in MIGRATIONS {
        conn.execute_batch(migration)?;
        debug!("Applied migration: {migration:?}",);
    }
    Ok(())
}

#[derive(Clone, Debug)]
struct Feed {
    title: String,
    html_url: String,
}

#[derive(Clone, Debug)]
struct Category {
    name: String,
    feeds: Vec<Feed>,
}

fn parse_opml(opml: OPML) -> Vec<Category> {
    let mut categories = Vec::new();

    for outline in opml.body.outlines {
        let category_name = outline.text.clone();
        let mut feeds = Vec::new();

        for feed_outline in outline.outlines {
            let feed = Feed {
                title: feed_outline.text.clone(),
                html_url: feed_outline.html_url.clone().unwrap_or_default(),
            };
            feeds.push(feed);
        }

        let category = Category {
            name: category_name,
            feeds,
        };
        categories.push(category);
    }

    categories
}

async fn try_main() -> anyhow::Result<()> {
    let mut opts = Opts::parse();
    debug!("Parsed options: {opts:?}");

    let default_directive = if opts.debug {
        Level::DEBUG
    } else {
        Level::WARN
    };
    let env_filter = EnvFilter::builder()
        .with_default_directive(default_directive.into())
        .from_env_lossy();
    let no_color = opts.no_color || is_no_color();
    tracing_subscriber::fmt()
        .with_ansi(!no_color)
        .with_env_filter(env_filter)
        .with_span_events(FmtSpan::CLOSE)
        .compact()
        .init();

    let mut db = match &opts.cache_path {
        Some(path) => {
            debug!("Using cache path: {:?}", path);
            Connection::open(path)?
        }
        None => {
            warn!("No cache path specified, using in-memory database");
            Connection::open_in_memory()?
        }
    };
    migrate(&mut db)?;

    let parsed = OPML::from_reader(&mut opts.file)?;
    let categories = parse_opml(parsed);
    let app_state = AppState::builder().categories(categories).build();

    if enabled!(Level::DEBUG) {
        for category in &app_state.categories {
            for feed in &category.feeds {
                let category = &category.name;
                let feed = &feed.title;
                debug!("Feed: {:?} (Category: {:?})", feed, category);
            }
        }
    }

    let listener = tokio::net::TcpListener::bind(&opts.bind).await?;
    let router = Router::new()
        .route(
            "/pico.min.css",
            get(|| async { ([(header::CONTENT_TYPE, "text/css")], PICO_CSS) }),
        )
        .route(
            "/htmx.js",
            get(|| async { ([(header::CONTENT_TYPE, "text/javascript")], HTMX) }),
        )
        .route("/feeds", get(feeds_route))
        .route("/", get(index_route))
        .with_state(app_state);
    info!("Listening on {}", listener.local_addr()?);

    axum::serve(listener, router).await?;

    Ok(())
}

#[tokio::main]
async fn main() -> ExitCode {
    if let Err(e) = try_main().await {
        eprintln!("Error: {}", e);
        return ExitCode::FAILURE;
    }
    ExitCode::SUCCESS
}
