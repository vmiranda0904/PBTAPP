from __future__ import annotations


def defensive_scheme(tendencies: dict[int, dict[str, float | int | str]]) -> dict[str, str]:
    scheme: dict[str, str] = {}

    for player_id, tendency in tendencies.items():
        if float(tendency['left_pct']) > 0.7:
            scheme[f'Player {player_id}'] = 'block line, defender cross'
        else:
            scheme[f'Player {player_id}'] = 'balanced defense'

    return scheme
