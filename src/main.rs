use std::process::ExitCode;

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
use opml::{OPML, Outline};
use tracing::{Level, debug, enabled, info};
use tracing_subscriber::{EnvFilter, fmt::format::FmtSpan};

static HTMX: &str = include_str!("../vendor/htmx.min.js");
static PICO_CSS: &str = include_str!("../vendor/pico.min.css");

#[derive(Builder, Clone, Debug)]
struct AppState {
    #[builder(into)]
    opml: OPML,
}

#[derive(Debug, Parser)]
struct Opts {
    /// Bound address and port
    #[clap(long, default_value = "127.0.0.1:3000", env = "BIND")]
    bind: String,
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
    categories: Vec<Outline>,
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
        categories: state.opml.body.outlines.clone(),
    };
    let rendered = t.render()?;
    Ok(Html(rendered))
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

    let parsed = OPML::from_reader(&mut opts.file)?;
    let app_state = AppState::builder().opml(parsed.clone()).build();

    if enabled!(Level::DEBUG) {
        for category in &app_state.opml.body.outlines {
            for feed in &category.outlines {
                let category = &category.text;
                let feed = &feed.text;
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
