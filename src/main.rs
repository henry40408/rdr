use std::{net::SocketAddr, process::ExitCode};

use clap::Parser;
use clio::Input;
use no_color::is_no_color;
use opml::OPML;
use tokio::net::TcpListener;
use tracing::{Level, debug, info};
use tracing_subscriber::{EnvFilter, fmt::format::FmtSpan};

use crate::serve::AppState;

mod entities;
mod serve;

const VERSION: &str = env!("APP_VERSION");

#[derive(Debug, Parser)]
#[clap(author, version, about, long_about = None)]
struct Opts {
    /// Bind host & port
    #[arg(long, short = 'b', env = "BIND", default_value = "127.0.0.1:3000")]
    bind: String,
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

fn parse_opml(file: &mut Input) -> anyhow::Result<OPML> {
    let parsed = OPML::from_reader(file)?;
    Ok(parsed)
}

async fn try_main() -> anyhow::Result<()> {
    let mut opts = Opts::parse();
    debug!("Parsed options: {opts:?}");

    let default_directive = if opts.debug {
        Level::DEBUG
    } else {
        Level::INFO
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

    let state = AppState::builder().categories(categories).build();
    let router = serve::init_route(state);

    let version = VERSION;
    let listener = TcpListener::bind(&opts.bind).await?;
    let local_addr: SocketAddr = listener.local_addr()?;
    info!(addr = %local_addr, %version, "server started");

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
