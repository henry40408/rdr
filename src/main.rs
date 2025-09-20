use std::{io::Read, net::SocketAddr, path::PathBuf, process::ExitCode};

use clap::Parser;
use clio::Input;
use no_color::is_no_color;
use opml::OPML;
use tokio::net::TcpListener;
use tracing::{Level, debug};
use tracing_subscriber::{EnvFilter, fmt::format::FmtSpan};

use crate::{repository::Repository, serve::AppState};

mod entities;
mod repository;
mod serve;

const VERSION: &str = env!("APP_VERSION");

#[derive(Debug, Parser)]
#[clap(author, version, about, long_about = None)]
struct Opts {
    /// Bind host & port
    #[arg(long, short = 'b', env = "BIND", default_value = "127.0.0.1:3000")]
    bind: String,
    /// Cache path
    #[arg(long, env = "CACHE_PATH", default_value = "cache.sqlite3")]
    cache_path: PathBuf,
    /// Debug mode
    #[arg(long, short = 'd', env = "DEBUG")]
    debug: bool,
    /// Disable colored output
    #[clap(long, env = "NO_COLOR")]
    no_color: bool,
    /// OPML file
    #[clap(long, value_parser, env = "FILE")]
    file: Input,
}

fn parse_opml<R: Read>(reader: &mut R) -> anyhow::Result<OPML> {
    let parsed = OPML::from_reader(reader)?;
    Ok(parsed)
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

    let parsed_opml = parse_opml(&mut opts.file)?;
    debug!("Parsed OPML: {parsed_opml:?}");

    let categories = entities::Category::from_opml(parsed_opml);
    debug!("Extracted categories: {categories:?}");

    let repository = Repository::builder(Some(opts.cache_path)).build()?;
    let state = AppState::builder()
        .categories(categories)
        .repository(repository)
        .build();
    let router = serve::init_route(state);

    let version = VERSION;
    let listener = TcpListener::bind(&opts.bind).await?;
    let local_addr: SocketAddr = listener.local_addr()?;
    debug!(addr = %local_addr, %version, "server started");

    axum::serve(listener, router).await?;

    Ok(())
}

#[tokio::main]
async fn main() -> ExitCode {
    match try_main().await {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => {
            eprintln!("Error: {err}");
            ExitCode::FAILURE
        }
    }
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use crate::parse_opml;

    #[test]
    fn test_parse_opml() {
        let data = r#"<?xml version="1.0" encoding="UTF-8"?>
        <opml version="2.0">
            <head>
                <title>Example OPML</title>
            </head>
            <body>
                <outline text="Category 1">
                <outline text="Feed 1" type="rss" xmlUrl="http://example.com/feed1.xml" htmlUrl="http://example.com"/>
                <outline text="Feed 2" type="rss" xmlUrl="http://example.com/feed2.xml"/>
                </outline>
            </body>
        </opml>"#;
        let mut input = Cursor::new(data);
        parse_opml(&mut input).unwrap();
    }
}
