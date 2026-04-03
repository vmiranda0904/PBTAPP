from __future__ import annotations

from collections import defaultdict
from typing import Any


class TendencyEngine:
    def __init__(self) -> None:
        self.data: dict[int, list[dict[str, Any]]] = defaultdict(list)

    def add_event(self, event: dict[str, Any]) -> None:
        self.data[int(event['player_id'])].append(event)

    def analyze(self) -> dict[int, dict[str, float | int | str]]:
        report: dict[int, dict[str, float | int | str]] = {}

        for player_id, events in self.data.items():
            spikes = [event for event in events if event['play_type'] == 'spike']
            if not spikes:
                continue

            left = sum(1 for event in spikes if event['end_position'][0] < 0.33)
            middle = sum(1 for event in spikes if 0.33 <= event['end_position'][0] < 0.66)
            right = sum(1 for event in spikes if event['end_position'][0] >= 0.66)
            total = len(spikes)
            successful = sum(1 for event in spikes if event['result'] in {'kill', 'ace'})
            errors = sum(1 for event in spikes if event['result'] == 'error')
            high_pressure = sum(1 for event in spikes if event.get('pressure_level') == 'high')

            zone_counts = {'left': left, 'middle': middle, 'right': right}
            preferred_zone = max(zone_counts, key=zone_counts.__getitem__)

            report[player_id] = {
                'left_pct': left / total,
                'middle_pct': middle / total,
                'right_pct': right / total,
                'kill_rate': successful / total,
                'error_rate': errors / total,
                'under_pressure_rate': high_pressure / total,
                'spike_count': total,
                'total_events': len(events),
                'preferred_attack_zone': preferred_zone,
            }

        return report
