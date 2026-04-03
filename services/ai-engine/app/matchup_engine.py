from __future__ import annotations

HIGH_LEFT_TENDENCY_THRESHOLD = 0.6
LOW_RIGHT_TENDENCY_THRESHOLD = 0.2


def analyze_matchup(player: dict[str, object], opponent: dict[str, object]) -> list[str]:
    insights: list[str] = []

    player_tendencies = player.get('tendencies', {})
    opponent_tendencies = opponent.get('tendencies', {})
    player_stats = player.get('stats', {})
    opponent_stats = opponent.get('stats', {})
    opponent_weakness = opponent.get('weakness')

    if float(player_tendencies.get('left_pct', 0)) > HIGH_LEFT_TENDENCY_THRESHOLD and opponent_weakness == 'right_defense':
        insights.append('Exploit cross-court — high success probability')

    if opponent_tendencies.get('serve_target') == 'zone_1':
        insights.append('Prepare receive in zone 1')

    if float(player_stats.get('spikes', 0)) > float(opponent_stats.get('blocks', 0)):
        insights.append('Offensive advantage — increase set frequency')

    if float(opponent_tendencies.get('right_pct', 0)) < LOW_RIGHT_TENDENCY_THRESHOLD:
        insights.append('Trend: force right-side attacks and close the line early')

    return insights
