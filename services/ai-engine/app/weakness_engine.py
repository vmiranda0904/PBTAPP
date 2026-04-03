from __future__ import annotations

LEFT_ZONE_THRESHOLD = 0.33
RIGHT_ZONE_THRESHOLD = 0.66
ZONE_ERROR_THRESHOLD = 0.6
PRESSURE_ERROR_THRESHOLD = 0.5


def detect_weakness(events: list[dict[str, object]]) -> str | None:
    errors = [event for event in events if event['result'] == 'error']
    if not errors:
        return None
    if len(errors) < 3:
        return None

    left_errors = sum(1 for event in errors if float(event['end_position'][0]) < LEFT_ZONE_THRESHOLD)
    right_errors = sum(1 for event in errors if float(event['end_position'][0]) >= RIGHT_ZONE_THRESHOLD)
    pressure_errors = sum(1 for event in errors if event.get('pressure_level') == 'high')

    if left_errors / len(errors) > ZONE_ERROR_THRESHOLD:
        return 'struggles attacking the left side under pressure'
    if right_errors / len(errors) > ZONE_ERROR_THRESHOLD:
        return 'misses a high share of right-side attacks'
    if pressure_errors / len(errors) > PRESSURE_ERROR_THRESHOLD:
        return 'error rate spikes during high-pressure rallies'
    return None
