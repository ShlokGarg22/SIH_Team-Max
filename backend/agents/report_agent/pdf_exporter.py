import os
import io
import logging
from typing import Optional, List
from backend.schemas.agent import ReportResult, Evidence

logger = logging.getLogger("PDFExporter")
logger.setLevel(logging.INFO)


def generate_report_html(report: ReportResult) -> str:
    """
    Renders an executive-grade, ISO-compliant HTML document from ReportResult.
    Designed with embedded CSS for perfect print styling and PDF rendering.
    """
    severity_colors = {
        "CRITICAL": {"bg": "#fee2e2", "text": "#991b1b", "border": "#dc2626"},
        "HIGH": {"bg": "#ffedd5", "text": "#9a3412", "border": "#ea580c"},
        "MEDIUM": {"bg": "#fef9c3", "text": "#854d0e", "border": "#ca8a04"},
        "LOW": {"bg": "#ecfdf5", "text": "#065f46", "border": "#059669"},
        "INFO": {"bg": "#eff6ff", "text": "#1e40af", "border": "#2563eb"},
    }

    sev = (report.severity or "MEDIUM").upper()
    color_info = severity_colors.get(sev, severity_colors["MEDIUM"])

    # Root Cause rows
    rc_html = ""
    for idx, rc in enumerate(report.root_cause_analysis, 1):
        clean_rc = rc.replace(f"{idx}.", "").replace(f"{idx}:", "").strip()
        rc_html += f"""
        <div class="why-card">
            <div class="why-badge">Step {idx}</div>
            <div class="why-text">{clean_rc}</div>
        </div>
        """

    # Recommendations rows
    rec_html = ""
    for idx, rec in enumerate(report.recommendations, 1):
        rec_html += f"""
        <li class="rec-item">
            <strong>Action {idx}:</strong> {rec}
        </li>
        """

    # Evidence sources table rows
    src_rows = ""
    if report.sources:
        for idx, src in enumerate(report.sources, 1):
            chunk_txt = src.chunk or "Document reference"
            conf_txt = f"{int((src.confidence or 1.0) * 100)}%"
            src_rows += f"""
            <tr>
                <td style="text-align: center;">{idx}</td>
                <td><strong>{src.source}</strong></td>
                <td>{chunk_txt}</td>
                <td style="text-align: center;"><span class="conf-badge">{conf_txt}</span></td>
            </tr>
            """
    else:
        src_rows = """<tr><td colspan="4" style="text-align:center; color:#6b7280;">No external files attached. Synthesized from direct operator notes.</td></tr>"""

    # Construct complete HTML
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{report.title} - Industrial Diagnostic Report</title>
    <style>
        @page {{
            size: a4 portrait;
            margin: 15mm;
        }}
        body {{

            font-family: Helvetica, Arial, sans-serif;
            color: #1f2937;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 10pt;
            line-height: 1.5;
        }}
        .header-table {{
            width: 100%;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }}
        .logo-title {{
            font-size: 15pt;
            font-weight: bold;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .subtitle {{
            font-size: 8.5pt;
            color: #4b5563;
            margin-top: 2px;
        }}
        .severity-badge {{
            display: inline-block;
            padding: 4px 10px;
            font-size: 9pt;
            font-weight: bold;
            border-radius: 4px;
            background-color: {color_info['bg']};
            color: {color_info['text']};
            border: 1px solid {color_info['border']};
            text-align: center;
        }}
        .meta-box {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin-bottom: 14px;
            padding: 8px 12px;
        }}
        .meta-table {{
            width: 100%;
            border-collapse: collapse;
        }}
        .meta-table td {{
            padding: 3px 6px;
            font-size: 9pt;
        }}
        .meta-label {{
            font-weight: bold;
            color: #4b5563;
            width: 25%;
        }}
        .meta-val {{
            color: #111827;
            width: 25%;
        }}
        h2 {{
            font-size: 11pt;
            color: #1e3a8a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }}
        .callout-box {{
            background-color: #f0f9ff;
            border-left: 4px solid #0284c7;
            padding: 8px 12px;
            border-radius: 0 4px 4px 0;
            margin-bottom: 12px;
            font-size: 9.5pt;
            color: #0369a1;
        }}
        .why-card {{
            background-color: #fafafa;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 5px 8px;
            margin-bottom: 5px;
        }}
        .why-badge {{
            display: inline-block;
            font-weight: bold;
            color: #1e3a8a;
            font-size: 8pt;
            text-transform: uppercase;
            margin-right: 6px;
        }}
        .why-text {{
            display: inline;
            font-size: 9pt;
            color: #374151;
        }}
        .rec-list {{
            margin: 0;
            padding-left: 18px;
        }}
        .rec-item {{
            margin-bottom: 5px;
            font-size: 9pt;
            color: #1f2937;
        }}
        table.data-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 10px;
        }}
        table.data-table th {{
            background-color: #1e3a8a;
            color: #ffffff;
            font-size: 8.5pt;
            text-align: left;
            padding: 5px 8px;
            border: 1px solid #1e3a8a;
        }}
        table.data-table td {{
            font-size: 8.5pt;
            padding: 4px 8px;
            border: 1px solid #e5e7eb;
        }}
        table.data-table tr:nth-child(even) {{
            background-color: #f9fafb;
        }}
        .conf-badge {{
            background-color: #e0f2fe;
            color: #0369a1;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: bold;
        }}
        .signature-table {{
            width: 100%;
            margin-top: 25px;
            border-top: 1px dashed #9ca3af;
            padding-top: 10px;
        }}
        .signature-table td {{
            width: 33.3%;
            text-align: center;
            font-size: 8pt;
            color: #4b5563;
        }}
        .sign-line {{
            margin-top: 30px;
            border-bottom: 1px solid #374151;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        }}
        .footer-note {{
            margin-top: 15px;
            text-align: center;
            font-size: 7.5pt;
            color: #9ca3af;
            font-style: italic;
        }}
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 75%;">
                <div class="logo-title">INDUSTRIAL DIAGNOSTIC & INVESTIGATION REPORT</div>
                <div class="subtitle">Sovereign Multi-Agent AI Workbench — Plant Intelligence System</div>
            </td>
            <td style="width: 25%; text-align: right;">
                <div class="severity-badge">{sev} SEVERITY</div>
            </td>
        </tr>
    </table>

    <!-- Metadata Grid -->
    <div class="meta-box">
        <table class="meta-table">
            <tr>
                <td class="meta-label">Report ID:</td>
                <td class="meta-val"><code>{report.report_id}</code></td>
                <td class="meta-label">Equipment ID:</td>
                <td class="meta-val"><strong>{report.equipment_id or 'General Asset'}</strong></td>
            </tr>
            <tr>
                <td class="meta-label">Plant Unit / Area:</td>
                <td class="meta-val">{report.plant_area or 'Industrial Operations'}</td>
                <td class="meta-label">Report Standard:</td>
                <td class="meta-val">ISO 55001 / OSHA 1910</td>
            </tr>
            <tr>
                <td class="meta-label">Report Type:</td>
                <td class="meta-val">{report.report_type.replace('_', ' ').title()}</td>
                <td class="meta-label">Status:</td>
                <td class="meta-val" style="color: #059669; font-weight: bold;">APPROVED / ACTIVE</td>
            </tr>
        </table>
    </div>

    <!-- 1. Executive Summary -->
    <h2>1. Executive Summary</h2>
    <div class="callout-box">
        {report.executive_summary}
    </div>

    <!-- 2. Problem Statement -->
    <h2>2. Problem Statement & Scope</h2>
    <p style="margin-top: 4px; font-size: 9pt;">
        Investigation and diagnostic synthesis conducted for task: <strong>{report.title}</strong>. 
        Multi-agent cross-referencing was deployed to correlate direct visual indicators, sensor telemetry trends, 
        and documented standard operating procedures (SOPs).
    </p>

    <!-- 3. Root Cause Analysis -->
    <h2>3. Root Cause Analysis (5-Whys Methodology)</h2>
    <div style="margin-top: 4px; margin-bottom: 8px;">
        {rc_html}
    </div>

    <!-- 4. Actionable Recommendations -->
    <h2>4. Actionable Corrective & Preventative Recommendations</h2>
    <ol class="rec-list">
        {rec_html}
    </ol>

    <!-- 5. Traceability & Evidence Appendix -->
    <h2>5. Traceability & Evidence Citations Appendix</h2>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 8%; text-align: center;">#</th>
                <th style="width: 35%;">Source Document / Image</th>
                <th style="width: 45%;">Reference Chunk / Observation</th>
                <th style="width: 12%; text-align: center;">Confidence</th>
            </tr>
        </thead>
        <tbody>
            {src_rows}
        </tbody>
    </table>

    <!-- Sign-off Section -->
    <table class="signature-table">
        <tr>
            <td>
                <div class="sign-line"></div>
                <div style="margin-top: 4px;"><strong>Lead Plant Engineer</strong><br>Inspection Lead</div>
            </td>
            <td>
                <div class="sign-line"></div>
                <div style="margin-top: 4px;"><strong>Operations Superintendent</strong><br>Shift In-Charge</div>
            </td>
            <td>
                <div class="sign-line"></div>
                <div style="margin-top: 4px;"><strong>Safety & Compliance Officer</strong><br>ISO / HSE Auditor</div>
            </td>
        </tr>
    </table>

    <div class="footer-note">
        CONFIDENTIAL & PROPRIETARY — Generated securely by Sovereign On-Premise Multi-Agent AI Workbench.
    </div>

</body>
</html>
"""
    return html


def convert_html_to_pdf(html_content: str, output_path: Optional[str] = None) -> bytes:
    """
    Converts an HTML report string into high-fidelity PDF bytes.
    Tries WeasyPrint first; gracefully falls back to xhtml2pdf if native GTK libraries are absent.
    """
    pdf_bytes: Optional[bytes] = None

    # 1. Try WeasyPrint
    try:
        import weasyprint
        html_obj = weasyprint.HTML(string=html_content)
        pdf_bytes = html_obj.write_pdf()
        logger.info("PDF generated successfully using WeasyPrint engine.")
    except Exception as e:
        logger.warning(f"WeasyPrint unavailable ({e}). Falling back to xhtml2pdf engine.")

    # 2. Fallback to xhtml2pdf
    if pdf_bytes is None:
        try:
            from xhtml2pdf import pisa
            buf = io.BytesIO()
            pisa_status = pisa.CreatePDF(html_content, dest=buf)
            if pisa_status.err:
                raise RuntimeError(f"xhtml2pdf rendering error: {pisa_status.err}")
            pdf_bytes = buf.getvalue()
            logger.info("PDF generated successfully using xhtml2pdf fallback engine.")
        except Exception as fallback_err:
            logger.error(f"xhtml2pdf fallback failed: {fallback_err}")
            raise RuntimeError(f"Failed to generate PDF with both engines: {fallback_err}")

    # 3. Optional Write to File
    if output_path and pdf_bytes:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
        logger.info(f"PDF saved to disk: {output_path}")

    return pdf_bytes
