from __future__ import annotations

from .matchup_engine import analyze_matchup


def team_matchup(team_a: list[dict[str, object]], team_b: list[dict[str, object]]) -> list[dict[str, object]]:
    report: list[dict[str, object]] = []

    for player_a in team_a:
        for player_b in team_b:
            insights = analyze_matchup(player_a, player_b)
            if insights:
                report.append(
                    {
                        'matchup': f"{player_a['id']} vs {player_b['id']}",
                        'insights': insights,
                    }
                )

    return report
