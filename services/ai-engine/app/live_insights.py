from __future__ import annotations


def generate_live_insights(
    tendencies: dict[int, dict[str, float | int | str]],
    stats: dict[int, dict[str, float | int | str]],
) -> list[str]:
    insights: list[str] = []

    for player_id, tendency in tendencies.items():
        if float(tendency['left_pct']) > 0.7:
            insights.append(f'Player {player_id} hitting cross-court heavily')
        if float(tendency['right_pct']) < 0.2:
            insights.append(f'Exploit Player {player_id} by forcing right-side finishes')

    for player_id, player_stats in stats.items():
        if float(player_stats.get('spikes', 0)) > 10:
            insights.append(f'Player {player_id} is dominant — adjust defense')
        if float(player_stats.get('errors', 0)) >= 4:
            insights.append(f'Player {player_id} trend: sustained error pressure is working')

    return insights
