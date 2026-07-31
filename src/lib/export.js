/* =====================================================================
   Export helpers — CSV and PDF, shared by every screen that exports.

   Before: PDF export logic was pasted three times in js/app.js
   (`saveBusinessPDF` was defined at lines 3233, 3354 and 3706, and the last
   definition silently won — it also forgot to hide the back button, so every
   exported P&L had a "← Back" button printed on it). There was no CSV export
   anywhere, so data could not leave the app.

   These functions are deliberately dependency-light. `jspdf` is already a
   project dependency and is loaded lazily so it never enters the main bundle.
   ===================================================================== */

import { slug } from './format'

/* ------------------------------------------------------------------ */
/* CSV                                                                */
/* ------------------------------------------------------------------ */

/** RFC 4180 escaping. A field with a comma, quote or newline gets quoted. */
function csvCell(value) {
  if (value == null) return ''
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Guard against formula injection in Excel/Sheets.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * @param filename base name, no extension
 * @param rows     array of objects
 * @param columns  optional [{ key, label }] to control order and headers
 */
export function downloadCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) return false

  const cols =
    columns ??
    Object.keys(rows[0]).map((key) => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }))

  const lines = [
    cols.map((c) => csvCell(c.label)).join(','),
    ...rows.map((row) => cols.map((c) => csvCell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')),
  ]

  // BOM so Excel opens UTF-8 (₹ and Hindi text) correctly.
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${slug(filename)}_${new Date().toISOString().slice(0, 10)}.csv`)
  return true
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ------------------------------------------------------------------ */
/* PDF                                                                */
/* ------------------------------------------------------------------ */

const COMPANY = {
  name: 'The X Company',
  address: 'Kailash Nagar, Narnaul',
  product: 'ExFlow',
}

/** Lazy so jsPDF stays out of the initial bundle. */
async function loadPdf(orientation = 'portrait') {
  const { jsPDF } = await import('jspdf')
  return new jsPDF({ orientation, unit: 'pt', format: 'a4' })
}

/**
 * Document-style PDF: company header, title, optional summary rows, one table.
 * One renderer for P&L, statements, ledgers and payslips, so every export
 * looks like it came from the same company.
 *
 * @param title    e.g. "Profit & Loss"
 * @param subtitle e.g. "Scrapco · Apr 2026"
 * @param summary  [{ label, value }] rendered as a two-column block
 * @param columns  [{ label, width?, align? }]
 * @param rows     array of arrays, matching `columns`
 * @param filename base name, no extension
 */
export async function downloadTablePdf({
  title,
  subtitle,
  summary = [],
  columns,
  rows,
  filename,
  orientation = 'portrait',
  note,
}) {
  const doc = await loadPdf(orientation)
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const M = 40
  let y = M

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(17, 24, 39)
    doc.text(COMPANY.name, M, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(107, 114, 128)
    doc.text(COMPANY.address, M, y + 13)
    doc.text(
      `Generated ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
      pageW - M,
      y + 13,
      { align: 'right' }
    )
    doc.text(COMPANY.product, pageW - M, y, { align: 'right' })

    y += 26
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.8)
    doc.line(M, y, pageW - M, y)
    y += 22
  }

  drawHeader()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(17, 24, 39)
  doc.text(title, M, y)
  y += subtitle ? 14 : 8
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(107, 114, 128)
    doc.text(subtitle, M, y)
    y += 12
  }
  y += 10

  if (summary.length > 0) {
    const colW = (pageW - M * 2) / Math.min(summary.length, 4)
    summary.forEach((item, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = M + col * colW
      const yy = y + row * 34
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text(String(item.label).toUpperCase(), x, yy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(17, 24, 39)
      doc.text(String(item.value), x, yy + 14)
    })
    y += Math.ceil(summary.length / 4) * 34 + 12
  }

  // Column geometry: explicit widths, remainder split evenly.
  const usable = pageW - M * 2
  const fixed = columns.reduce((s, c) => s + (c.width ?? 0), 0)
  const flexCount = columns.filter((c) => !c.width).length
  const flexW = flexCount > 0 ? (usable - fixed) / flexCount : 0
  const widths = columns.map((c) => c.width ?? flexW)
  const xs = widths.reduce((acc, w, i) => [...acc, (acc[i - 1] ?? M) + (widths[i - 1] ?? 0)], [M])

  const drawTableHeader = () => {
    doc.setFillColor(249, 250, 251)
    doc.rect(M, y - 11, usable, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    columns.forEach((c, i) => {
      const align = c.align ?? 'left'
      const x = align === 'right' ? xs[i] + widths[i] - 4 : xs[i] + 2
      doc.text(String(c.label).toUpperCase(), x, y, { align: align === 'right' ? 'right' : 'left' })
    })
    y += 14
  }

  drawTableHeader()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)

  for (const row of rows) {
    if (y > pageH - M - 40) {
      doc.addPage()
      y = M
      drawHeader()
      drawTableHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
    }
    doc.setTextColor(31, 41, 55)
    row.forEach((cell, i) => {
      const col = columns[i]
      const align = col.align ?? 'left'
      const text = doc.splitTextToSize(String(cell ?? ''), widths[i] - 6)[0] ?? ''
      const x = align === 'right' ? xs[i] + widths[i] - 4 : xs[i] + 2
      doc.text(text, x, y, { align: align === 'right' ? 'right' : 'left' })
    })
    y += 15
    doc.setDrawColor(243, 244, 246)
    doc.setLineWidth(0.5)
    doc.line(M, y - 10, pageW - M, y - 10)
  }

  if (note) {
    y += 10
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(156, 163, 175)
    doc.text(note, M, y)
  }

  // Page numbers.
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(156, 163, 175)
    doc.text(`Page ${p} of ${pages}`, pageW / 2, pageH - 20, { align: 'center' })
  }

  doc.save(`${slug(filename)}.pdf`)
  return true
}

/**
 * Payslip PDF — earnings/deductions layout.
 * Ported from saveEmployeePayslipPDF, same fields and the same
 * "system generated" footer, rebuilt on the shared header.
 */
export async function downloadPayslipPdf({ employee, period, joiningDate, workedDays, earnings, deductions = [], netPay }) {
  const doc = await loadPdf('portrait')
  const pageW = doc.internal.pageSize.getWidth()
  const M = 44
  let y = M

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text('Payslip', pageW / 2, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(COMPANY.name, pageW / 2, y + 15, { align: 'center' })
  doc.setFontSize(8.5)
  doc.text(COMPANY.address, pageW / 2, y + 28, { align: 'center' })
  y += 48

  doc.setDrawColor(229, 231, 235)
  doc.line(M, y, pageW - M, y)
  y += 20

  const meta = [
    ['Employee', employee.name],
    ['Designation', employee.role ?? '—'],
    ['Department', employee.department ?? employee.role ?? '—'],
    ['Date of joining', joiningDate],
    ['Pay period', period],
    ['Worked days', String(workedDays)],
  ]
  doc.setFontSize(9)
  meta.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? M : pageW / 2
    const yy = y + Math.floor(i / 2) * 18
    doc.setTextColor(107, 114, 128)
    doc.text(`${label}`, x, yy)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value), x + 110, yy)
    doc.setFont('helvetica', 'normal')
  })
  y += Math.ceil(meta.length / 2) * 18 + 16

  const block = (heading, items, startY) => {
    let yy = startY
    doc.setFillColor(249, 250, 251)
    doc.rect(M, yy - 11, pageW - M * 2, 18, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(75, 85, 99)
    doc.text(heading.toUpperCase(), M + 4, yy)
    doc.text('AMOUNT', pageW - M - 4, yy, { align: 'right' })
    yy += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(31, 41, 55)
    for (const item of items) {
      doc.text(item.label, M + 4, yy)
      doc.text(item.value, pageW - M - 4, yy, { align: 'right' })
      yy += 15
    }
    return yy + 6
  }

  y = block('Earnings', earnings, y)
  if (deductions.length > 0) y = block('Deductions', deductions, y)

  doc.setDrawColor(17, 24, 39)
  doc.setLineWidth(1)
  doc.line(M, y, pageW - M, y)
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(17, 24, 39)
  doc.text('Net pay', M + 4, y)
  doc.text(netPay, pageW - M - 4, y, { align: 'right' })

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  doc.text('This is a system generated payslip.', pageW / 2, y + 40, { align: 'center' })

  doc.save(`${slug(employee.name)}_Payslip_${slug(period)}.pdf`)
  return true
}
