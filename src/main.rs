use std::process::ExitCode;

use bon::Builder;
use clap::Parser;
use clio::Input;
use no_color::is_no_color;
use opml::OPML;
use tracing::{Level, debug, enabled};
use tracing_subscriber::{EnvFilter, fmt::format::FmtSpan};

#[derive(Builder, Debug)]
struct AppState {
    #[builder(into)]
    opml: OPML,
}

#[derive(Debug, Parser)]
struct Opts {
    /// The input file to read from
    #[clap(long, value_parser, default_value = "feeds.opml")]
    file: Input,
}

fn try_main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_ansi(!is_no_color())
        .with_env_filter(EnvFilter::from_default_env())
        .with_span_events(FmtSpan::CLOSE)
        .compact()
        .init();

    let mut opts = Opts::parse();
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

    Ok(())
}

fn main() -> ExitCode {
    if let Err(e) = try_main() {
        eprintln!("Error: {}", e);
        return ExitCode::FAILURE;
    }
    ExitCode::SUCCESS
}
