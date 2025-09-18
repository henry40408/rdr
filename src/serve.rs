use std::sync::Arc;

use askama::Template;
use axum::{
    Router,
    extract::State,
    http::{StatusCode, header},
    response::{Html, IntoResponse},
    routing::get,
};
use bon::Builder;
use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer};
use tracing::Level;

use crate::entities::Category;

const WATER_CSS: &str = include_str!("../vendor/water.css");

pub(crate) struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong {}", self.0),
        )
            .into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

#[derive(Builder)]
pub(crate) struct AppState {
    categories: Vec<Category>,
}

#[derive(Template)]
#[template(path = "index.j2")]
struct IndexTemplate;

async fn index_route() -> Result<Html<String>, AppError> {
    Ok(Html(IndexTemplate.render()?))
}

#[derive(Template)]
#[template(path = "feeds.j2")]
struct FeedsTemplate<'a> {
    categories: &'a [Category],
}

async fn feeds_route(State(state): State<Arc<AppState>>) -> Result<Html<String>, AppError> {
    Ok(Html(
        FeedsTemplate {
            categories: &state.categories,
        }
        .render()?,
    ))
}

pub(crate) fn init_route(state: AppState) -> Router {
    let state = Arc::new(state);
    Router::new()
        .route(
            "/water.css",
            get(|| async { ([(header::CONTENT_TYPE, "text/css")], WATER_CSS) }),
        )
        .route("/", get(index_route))
        .route("/feeds", get(feeds_route))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::DEBUG)),
        )
        .with_state(state)
}
