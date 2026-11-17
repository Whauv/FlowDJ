"""Health / liveness endpoints.

Note: the README advertises ``GET /health`` and ``GET /version``, but the only
health route currently mounted is ``/analytics/health`` (plus the app version
exposed via the OpenAPI schema). These tests lock the real behavior; the README
mismatch is tracked as a separate docs fix.
"""

from __future__ import annotations


def test_analytics_health(client) -> None:
    response = client.get("/analytics/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "module": "analytics"}


def test_app_version_in_openapi(client) -> None:
    schema = client.get("/openapi.json").json()
    assert schema["info"]["title"] == "FlowDJ API"
    assert schema["info"]["version"] == "0.1.0"
