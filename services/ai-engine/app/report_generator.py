from __future__ import annotations

from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def generate_report(data: dict[str, object]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    content: list[object] = []
    styles = getSampleStyleSheet()
    stats = data.get('stats', {})
    if not isinstance(stats, dict):
        stats = {}
    insights = data.get('insights', [])
    if not isinstance(insights, list):
        insights = []

    content.append(Paragraph('PRIME Athletix Scouting Report', styles['Title']))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Team: {data.get('team_name', 'Unknown team')}", styles['BodyText']))
    content.append(Paragraph(f"Summary: {data.get('summary', 'No summary available')}", styles['BodyText']))
    content.append(Spacer(1, 12))

    for player, player_stats in stats.items():
        formatted_stats = ', '.join(f'{key}={value}' for key, value in player_stats.items()) if isinstance(player_stats, dict) else str(player_stats)
        content.append(Paragraph(f'{player}: {formatted_stats}', styles['BodyText']))

    content.append(Spacer(1, 12))
    for insight in insights:
        content.append(Paragraph(f'- {insight}', styles['BodyText']))

    doc.build(content)
    return buffer.getvalue()
