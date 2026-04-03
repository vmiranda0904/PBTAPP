from __future__ import annotations

HIGH_LEFT_TENDENCY_THRESHOLD = 0.6
LOW_RIGHT_TENDENCY_THRESHOLD = 0.2


def generate_playbook(tendencies: dict[int, dict[str, float | int | str]]) -> list[dict[str, str]]:
    plays: list[dict[str, str]] = []

    for player_id, tendency in tendencies.items():
        if float(tendency['left_pct']) > HIGH_LEFT_TENDENCY_THRESHOLD:
            plays.append(
                {
                    'type': 'defense',
                    'instruction': f'Shift block left against Player {player_id}',
                }
            )

        if float(tendency['right_pct']) < LOW_RIGHT_TENDENCY_THRESHOLD:
            plays.append(
                {
                    'type': 'offense',
                    'instruction': f'Force Player {player_id} into right-side attacks',
                }
            )

    return plays
