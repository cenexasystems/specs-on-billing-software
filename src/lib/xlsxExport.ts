import * as XLSX from 'xlsx'

export type XlsxRow = Array<string | number | Date | null | undefined>

/** Download a real XLSX workbook. Text columns are explicitly stored as string cells. */
export function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: XlsxRow[],
  textColumns: number[] = [],
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  for (let rowIndex = 1; rowIndex <= rows.length; rowIndex += 1) {
    for (const columnIndex of textColumns) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
      const cell = worksheet[address]
      if (cell) {
        cell.t = 's'
        cell.v = String(cell.v ?? '')
      }
    }
  }
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
