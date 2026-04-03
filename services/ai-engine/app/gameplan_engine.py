from __future__ import annotations


def generate_game_plan(
    tendencies: dict[int, dict[str, float | int | str]],
    weaknesses: dict[int, str | None],
) -> list[str]:
    plan: list[str] = []

    for player_id, data in tendencies.items():
        if float(data['left_pct']) > 0.6:
            plan.append(f'Player {player_id} favors left attacks — shade the block line early.')
        if float(data['right_pct']) < 0.2:
            plan.append(f'Force Player {player_id} into right-side finishes and make them attack cross-body.')
        if float(data['under_pressure_rate']) > 0.45:
            plan.append(f'Increase serve pressure on Player {player_id}; their choices get predictable in longer rallies.')
        if float(data['kill_rate']) > 0.55:
            plan.append(f'Commit your strongest front-row defender to Player {player_id} on transition balls.')

    for player_id, weakness in weaknesses.items():
        if weakness:
            plan.append(f'Exploit Player {player_id}: {weakness}.')

    return plan
