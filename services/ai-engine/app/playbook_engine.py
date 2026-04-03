from __future__ import annotations


def generate_playbook(tendencies: dict[int, dict[str, float | int | str]]) -> list[dict[str, str]]:
    plays: list[dict[str, str]] = []

    for player_id, tendency in tendencies.items():
        if float(tendency['left_pct']) > 0.6:
            plays.append(
                {
                    'type': 'defense',
                    'instruction': f'Shift block left against Player {player_id}',
                }
            )

        if float(tendency['right_pct']) < 0.2:
            plays.append(
                {
                    'type': 'offense',
                    'instruction': f'Force Player {player_id} into right-side attacks',
                }
            )

    return plays
