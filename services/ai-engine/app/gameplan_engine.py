from __future__ import annotations

HIGH_LEFT_PCT = 0.6
LOW_RIGHT_PCT = 0.2
HIGH_PRESSURE_RATE = 0.45
HIGH_KILL_RATE = 0.55


def generate_game_plan(
    tendencies: dict[int, dict[str, float | int | str]],
    weaknesses: dict[int, str | None],
) -> list[str]:
    plan: list[str] = []

    for player_id, data in tendencies.items():
        if float(data['left_pct']) > HIGH_LEFT_PCT:
            plan.append(f'Player {player_id} favors left attacks — shade the block line early.')
        if float(data['right_pct']) < LOW_RIGHT_PCT:
            plan.append(f'Force Player {player_id} into right-side finishes and make them attack cross-body.')
        if float(data['under_pressure_rate']) > HIGH_PRESSURE_RATE:
            plan.append(f'Increase serve pressure on Player {player_id}; their choices get predictable in longer rallies.')
        if float(data['kill_rate']) > HIGH_KILL_RATE:
            plan.append(f'Commit your strongest front-row defender to Player {player_id} on transition balls.')

    for player_id, weakness in weaknesses.items():
        if weakness:
            plan.append(f'Exploit Player {player_id}: {weakness}.')

    return plan
