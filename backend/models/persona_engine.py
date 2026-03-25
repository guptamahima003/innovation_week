"""K-Means persona clustering engine with feature engineering."""

from __future__ import annotations

from typing import Optional

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


# Features used for clustering
FEATURE_KEYS = [
    "tech_affinity",
    "price_sensitivity",
    "deal_seeking_score",
    "research_depth",
    "brand_loyalty_score",
    "avg_order_value",
    "lifetime_spend",
    "total_site_visits_90d",
    "avg_session_duration_min",
    "cart_abandonment_rate",
    "propensity_to_churn",
    "days_since_last_visit",
    "lifetime_order_count",
    "return_rate",
]

PERSONA_LABELS = [
    "tech_enthusiast",
    "value_hunter",
    "considered_researcher",
    "loyalty_power_user",
    "lapsing_customer",
    "business_buyer",
    "impulse_buyer",
    "home_upgrader",
    "gift_shopper",
    "student_budget",
]


class PersonaEngine:
    """Clusters customer profiles into persona archetypes using K-Means."""

    def __init__(self, n_clusters: int = 6):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
        self.cluster_to_persona: dict[int, str] = {}
        self._silhouette: Optional[float] = None

    def _extract_features(self, profiles: list[dict]) -> np.ndarray:
        """Extract numerical feature matrix from profiles."""
        features = []
        for p in profiles:
            row = [float(p.get(k, 0)) for k in FEATURE_KEYS]
            features.append(row)
        return np.array(features)

    def fit(self, profiles: list[dict]) -> None:
        """Train the clustering model on customer profiles."""
        X = self._extract_features(profiles)
        X_scaled = self.scaler.fit_transform(X)
        labels = self.kmeans.fit_predict(X_scaled)

        self._silhouette = silhouette_score(X_scaled, labels)
        self._assign_persona_labels(X, labels)

    def _assign_persona_labels(self, X: np.ndarray, labels: np.ndarray) -> None:
        """Map cluster indices to named personas based on centroid characteristics."""
        centroids = self.kmeans.cluster_centers_
        # Un-scale centroids for interpretability
        centroids_unscaled = self.scaler.inverse_transform(centroids)

        feature_idx = {k: i for i, k in enumerate(FEATURE_KEYS)}
        assigned = set()
        self.cluster_to_persona = {}

        # Assignment rules based on dominant features of each persona
        rules = [
            ("tech_enthusiast", lambda c: c[feature_idx["tech_affinity"]] - c[feature_idx["price_sensitivity"]]),
            ("value_hunter", lambda c: c[feature_idx["price_sensitivity"]] + c[feature_idx["deal_seeking_score"]] + c[feature_idx["cart_abandonment_rate"]]),
            ("considered_researcher", lambda c: c[feature_idx["research_depth"]] + c[feature_idx["avg_session_duration_min"]] / 30.0),
            ("loyalty_power_user", lambda c: c[feature_idx["brand_loyalty_score"]] + c[feature_idx["lifetime_spend"]] / 20000.0 - c[feature_idx["propensity_to_churn"]]),
            ("lapsing_customer", lambda c: c[feature_idx["propensity_to_churn"]] + c[feature_idx["days_since_last_visit"]] / 100.0 - c[feature_idx["total_site_visits_90d"]] / 50.0),
            ("business_buyer", lambda c: c[feature_idx["avg_order_value"]] / 1000.0 + c[feature_idx["lifetime_spend"]] / 20000.0 - c[feature_idx["deal_seeking_score"]]),
            ("impulse_buyer", lambda c: -c[feature_idx["research_depth"]] - c[feature_idx["avg_session_duration_min"]] / 30.0 + c[feature_idx["cart_abandonment_rate"]]),
            ("home_upgrader", lambda c: c[feature_idx["avg_order_value"]] / 1000.0 + 0.5 * c[feature_idx["tech_affinity"]] - c[feature_idx["deal_seeking_score"]]),
            ("gift_shopper", lambda c: c[feature_idx["research_depth"]] * 0.5 + c[feature_idx["price_sensitivity"]] * 0.3 + c[feature_idx["brand_loyalty_score"]] * 0.2),
            ("student_budget", lambda c: c[feature_idx["price_sensitivity"]] - c[feature_idx["lifetime_spend"]] / 20000.0 - c[feature_idx["avg_order_value"]] / 1000.0),
        ]

        for persona_name, score_fn in rules:
            best_cluster = None
            best_score = -float("inf")
            for cluster_idx in range(self.n_clusters):
                if cluster_idx in assigned:
                    continue
                score = score_fn(centroids_unscaled[cluster_idx])
                if score > best_score:
                    best_score = score
                    best_cluster = cluster_idx
            if best_cluster is not None:
                self.cluster_to_persona[best_cluster] = persona_name
                assigned.add(best_cluster)

    def predict(self, profile: dict) -> tuple[str, float]:
        """Predict persona for a single profile. Returns (persona_type, confidence)."""
        X = self._extract_features([profile])
        X_scaled = self.scaler.transform(X)
        cluster = self.kmeans.predict(X_scaled)[0]

        # Compute confidence as inverse distance to assigned centroid vs others
        distances = self.kmeans.transform(X_scaled)[0]
        min_dist = distances[cluster]
        if min_dist == 0:
            confidence = 1.0
        else:
            # Softmax-style confidence
            inv_distances = 1.0 / (distances + 1e-6)
            confidence = float(inv_distances[cluster] / inv_distances.sum())

        persona = self.cluster_to_persona.get(cluster, "tech_enthusiast")
        return persona, round(confidence, 3)

    def predict_batch(self, profiles: list[dict]) -> list[tuple[str, float]]:
        """Predict personas for a batch of profiles."""
        X = self._extract_features(profiles)
        X_scaled = self.scaler.transform(X)
        clusters = self.kmeans.predict(X_scaled)
        all_distances = self.kmeans.transform(X_scaled)

        results = []
        for i, cluster in enumerate(clusters):
            distances = all_distances[i]
            inv_distances = 1.0 / (distances + 1e-6)
            confidence = float(inv_distances[cluster] / inv_distances.sum())
            persona = self.cluster_to_persona.get(cluster, "tech_enthusiast")
            results.append((persona, round(confidence, 3)))
        return results

    def get_distribution(self) -> dict[str, int]:
        """Return cluster sizes mapped to persona names."""
        if not hasattr(self.kmeans, "labels_"):
            return {}
        labels = self.kmeans.labels_
        dist = {}
        for cluster_idx in range(self.n_clusters):
            count = int(np.sum(labels == cluster_idx))
            persona = self.cluster_to_persona.get(cluster_idx, f"cluster_{cluster_idx}")
            dist[persona] = count
        return dist

    @property
    def silhouette(self) -> Optional[float]:
        return self._silhouette
