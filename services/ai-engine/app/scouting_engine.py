from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from .gameplan_engine import generate_game_plan
from .schemas import HeatmapCell, OpponentProfile, PlayEvent, PlayerScoutingSummary
from .tendency_engine import TendencyEngine
from .weakness_engine import detect_weakness

GRID_SIZE = 3
MAX_BIN_INDEX = GRID_SIZE - 1
HIGH_KILL_RATE_THRESHOLD = 0.5
LEFT_LANE_STRENGTH_THRESHOLD = 0.5
LOW_PRESSURE_RATE_THRESHOLD = 0.3


def _heatmap_for_events(events: Iterable[PlayEvent]) -> list[HeatmapCell]:
    bins: dict[tuple[int, int], int] = defaultdict(int)
    for event in events:
        x = min(MAX_BIN_INDEX, max(0, int(event.end_position[0] * GRID_SIZE)))
        y = min(MAX_BIN_INDEX, max(0, int(event.end_position[1] * GRID_SIZE)))
        bins[(x, y)] += 1

    return [
        HeatmapCell(x_bin=x_bin, y_bin=y_bin, count=count)
        for (x_bin, y_bin), count in sorted(bins.items(), key=lambda item: item[1], reverse=True)
    ]


def build_scouting_report(team_name: str, events: list[PlayEvent]) -> tuple[OpponentProfile, list[str], list[str]]:
    tendency_engine = TendencyEngine()
    player_events: dict[int, list[dict[str, object]]] = defaultdict(list)

    for event in events:
        event_dict = event.model_dump()
        tendency_engine.add_event(event_dict)
        player_events[event.player_id].append(event_dict)

    tendencies = tendency_engine.analyze()
    weaknesses = {player_id: detect_weakness(entries) for player_id, entries in player_events.items()}
    game_plan = generate_game_plan(tendencies, weaknesses)

    player_summaries: list[PlayerScoutingSummary] = []
    team_strengths: list[str] = []
    team_weaknesses: list[str] = []

    for player_id, data in tendencies.items():
        entries = [event for event in events if event.player_id == player_id]
        weakness = weaknesses.get(player_id)
        strengths: list[str] = []

        if float(data['kill_rate']) > HIGH_KILL_RATE_THRESHOLD:
            strengths.append('Converts a high share of attack attempts into points')
        if float(data['left_pct']) > LEFT_LANE_STRENGTH_THRESHOLD:
            strengths.append('Creates repeatable value out of the left-side lane')
        if float(data['under_pressure_rate']) < LOW_PRESSURE_RATE_THRESHOLD:
            strengths.append('Stays composed in high-pressure sequences')

        if weakness:
            team_weaknesses.append(f'Player {player_id}: {weakness}')
        if strengths:
            team_strengths.extend([f'Player {player_id}: {strength}' for strength in strengths])

        player_summaries.append(
            PlayerScoutingSummary(
                player_id=player_id,
                player_label=f'Player {player_id}',
                total_events=int(data['total_events']),
                spike_count=int(data['spike_count']),
                preferred_attack_zone=str(data['preferred_attack_zone']),
                left_pct=round(float(data['left_pct']), 2),
                middle_pct=round(float(data['middle_pct']), 2),
                right_pct=round(float(data['right_pct']), 2),
                kill_rate=round(float(data['kill_rate']), 2),
                error_rate=round(float(data['error_rate']), 2),
                under_pressure_rate=round(float(data['under_pressure_rate']), 2),
                strengths=strengths,
                weakness=weakness,
                heatmap=_heatmap_for_events(entries),
            )
        )

    opponent_profile = OpponentProfile(
        id=team_name.lower().replace(' ', '-'),
        team_name=team_name,
        players=[summary.player_label for summary in player_summaries],
        tendencies=player_summaries,
        weaknesses=team_weaknesses,
        strengths=team_strengths,
    )

    live_adjustments = [
        'If the outside hitter keeps attacking left above 60%, shift the outside blocker one step earlier.',
        'When long rallies start, serve aggressively to trigger the opponent’s higher-pressure mistakes.',
        'Use the hottest landing zone on the heatmap as the first defensive deny call.',
    ]

    return opponent_profile, game_plan, live_adjustments
