from __future__ import annotations


def calculate_score(stats: dict[str, float]) -> float:
    score = 0.0
    score += stats.get('spikes', 0) * 2
    score += stats.get('sets', 0) * 1.5
    score += stats.get('serves', 0) * 1

    if stats.get('errors', 0) > 0:
        score -= stats['errors'] * 1.2

    return round(score, 2)


def rank_athletes(players: list[dict[str, object]]) -> list[dict[str, object]]:
    return sorted(players, key=lambda player: float(player['score']), reverse=True)
