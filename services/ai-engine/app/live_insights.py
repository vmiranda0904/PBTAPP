from __future__ import annotations

HEAVY_LEFT_THRESHOLD = 0.7
LOW_RIGHT_THRESHOLD = 0.2
DOMINANT_SPIKE_COUNT = 10
SIGNIFICANT_ERROR_COUNT = 4


def generate_live_insights(
    tendencies: dict[int, dict[str, float | int | str]],
    stats: dict[int, dict[str, float | int | str]],
) -> list[str]:
    insights: list[str] = []

    for player_id, tendency in tendencies.items():
        if float(tendency['left_pct']) > HEAVY_LEFT_THRESHOLD:
            insights.append(f'Player {player_id} hitting cross-court heavily')
        if float(tendency['right_pct']) < LOW_RIGHT_THRESHOLD:
            insights.append(f'Exploit Player {player_id} by forcing right-side finishes')

    for player_id, player_stats in stats.items():
        if float(player_stats.get('spikes', 0)) > DOMINANT_SPIKE_COUNT:
            insights.append(f'Player {player_id} is dominant — adjust defense')
        if float(player_stats.get('errors', 0)) >= SIGNIFICANT_ERROR_COUNT:
            insights.append(f'Player {player_id} trend: sustained error pressure is working')

    return insights
