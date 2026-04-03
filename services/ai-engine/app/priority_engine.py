from __future__ import annotations


def prioritize_insights(insights: list[str]) -> list[dict[str, str]]:
    prioritized: list[dict[str, str]] = []

    for insight in insights:
        lowered = insight.lower()
        if 'dominant' in lowered or 'exploit' in lowered:
            prioritized.append({'text': insight, 'level': 'high'})
        elif 'trend' in lowered:
            prioritized.append({'text': insight, 'level': 'medium'})
        else:
            prioritized.append({'text': insight, 'level': 'low'})

    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    return sorted(prioritized, key=lambda item: priority_order[item['level']])
