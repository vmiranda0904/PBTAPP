from __future__ import annotations


def detect_weakness(events: list[dict[str, object]]) -> str | None:
    errors = [event for event in events if event['result'] == 'error']
    if len(errors) < 3:
        return None

    left_errors = sum(1 for event in errors if float(event['end_position'][0]) < 0.33)
    right_errors = sum(1 for event in errors if float(event['end_position'][0]) >= 0.66)
    pressure_errors = sum(1 for event in errors if event.get('pressure_level') == 'high')

    if left_errors / len(errors) > 0.6:
        return 'struggles attacking the left side under pressure'
    if right_errors / len(errors) > 0.6:
        return 'misses a high share of right-side attacks'
    if pressure_errors / len(errors) > 0.5:
        return 'error rate spikes during high-pressure rallies'
    return None
