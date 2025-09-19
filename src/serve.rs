use std::sync::Arc;

use askama::Template;
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::{get, post},
};
use bon::Builder;
use serde_json::json;
use tower_http::services::ServeDir;
use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer};
use tracing::{Level, error};

use crate::entities::Category;

pub(crate) struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        error!("{:?}", self.0);
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

async fn refresh_feed_route(
    State(state): State<Arc<AppState>>,
    Path(feed_id): Path<u64>,
) -> Result<Json<serde_json::Value>, AppError> {
    let feed = state
        .categories
        .iter()
        .flat_map(|c| &c.feeds)
        .find(|f| f.generate_id() == feed_id);
    if let Some(feed) = feed {
        let feed = Box::new(feed.clone());
        let entries = feed.fetch_entries().await?;
        Ok(Json(json!({
           "status": "ok",
           "feed_id": feed_id,
           "count": entries.len()
        })))
    } else {
        Err(AppError(anyhow::anyhow!("Feed not found")))
    }
}

pub(crate) fn init_route(state: AppState) -> Router {
    let state = Arc::new(state);
    Router::new()
        .nest_service("/assets", ServeDir::new("vendor"))
        .route("/", get(index_route))
        .route("/feeds", get(feeds_route))
        .route("/api/feeds/{feed_id}/refresh", post(refresh_feed_route))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::DEBUG)),
        )
        .with_state(state)
}
