from __future__ import annotations

from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def generate_report(data: dict[str, object], filename: str) -> str:
    output_path = Path(filename)
    doc = SimpleDocTemplate(str(output_path), pagesize=letter)
    content: list[object] = []
    styles = getSampleStyleSheet()

    content.append(Paragraph('PRIME Athletix Scouting Report', styles['Title']))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Team: {data['team_name']}", styles['BodyText']))
    content.append(Paragraph(f"Summary: {data['summary']}", styles['BodyText']))
    content.append(Spacer(1, 12))

    for player, stats in data['stats'].items():
        content.append(Paragraph(f'{player}: {stats}', styles['BodyText']))

    content.append(Spacer(1, 12))
    for insight in data['insights']:
        content.append(Paragraph(f'- {insight}', styles['BodyText']))

    doc.build(content)
    return str(output_path)
