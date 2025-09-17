use std::process::ExitCode;

use clap::Parser;
use clio::Input;
use no_color::is_no_color;
use opml::OPML;
use tracing::{Level, debug};
use tracing_subscriber::{EnvFilter, fmt::format::FmtSpan};

#[derive(Debug, Parser)]
#[clap(author, version, about, long_about = None)]
struct Opts {
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

fn try_main() -> anyhow::Result<()> {
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

    Ok(())
}

fn main() -> ExitCode {
    match try_main() {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => {
            eprintln!("Error: {err}");
            ExitCode::FAILURE
        }
    }
}
