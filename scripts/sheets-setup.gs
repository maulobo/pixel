// =============================================================
// PIXEL — Google Sheets Setup Script
// Pegar en Extensiones > Apps Script y guardar.
// Corre automático en cada edición y al abrir el Sheet.
// =============================================================

// ─── COLORES ─────────────────────────────────────────────────
var COLOR = {
  headerBg:    '#1e3a5f',   // azul marino
  headerFg:    '#ffffff',   // blanco
  rowAlt:      '#f0f4f8',   // gris azulado muy claro
  rowNormal:   '#ffffff',
  errorBg:     '#fce8e6',   // rojo claro
  errorBorder: '#d93025',   // rojo
  border:      '#c5d0de',
}

// ─── COLUMNAS POR HOJA ───────────────────────────────────────
var HEADERS = {
  modelos:  ['modelo_id','tipo','nombre','descripcion_general','specs','imagen_principal'],
  unidades: ['unidad_id','modelo_id','color','capacidad','bateria','condicion','precio','descripcion_particular','disponible','imagen_url'],
  banners:  ['name','description','subdescription','photo'],
}

var TIPOS_VALIDOS     = ['iPhone','Mac','iPad','Accesorio']
var CONDICION_VALIDA  = ['Nuevo','Excelente','Muy bueno','Bueno']

// =============================================================
// TRIGGERS PRINCIPALES
// =============================================================

function onOpen() {
  formatAllSheets()
  refreshModeloDropdowns()
}

function onEdit(e) {
  var sheet = e.range.getSheet()
  var sheetName = sheet.getName()

  // Si editaron modelos, regenerar dropdowns de modelo_id en unidades
  if (sheetName === 'modelos') {
    refreshModeloDropdowns()
  }

  validateCell(e)
}

// =============================================================
// FORMATO VISUAL
// =============================================================

function formatAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  Object.keys(HEADERS).forEach(function(name) {
    var sheet = ss.getSheetByName(name)
    if (!sheet) return
    formatSheet(sheet, HEADERS[name])
  })
}

function formatSheet(sheet, headers) {
  var lastRow  = Math.max(sheet.getLastRow(), 2)
  var numCols  = headers.length

  // ── Header row ──────────────────────────────────────────
  var headerRange = sheet.getRange(1, 1, 1, numCols)
  headerRange
    .setValues([headers])
    .setBackground(COLOR.headerBg)
    .setFontColor(COLOR.headerFg)
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
  sheet.setRowHeight(1, 36)
  sheet.setFrozenRows(1)

  // ── Filas de datos alternadas ────────────────────────────
  if (lastRow > 1) {
    for (var r = 2; r <= lastRow; r++) {
      var bg = (r % 2 === 0) ? COLOR.rowNormal : COLOR.rowAlt
      sheet.getRange(r, 1, 1, numCols).setBackground(bg)
    }
  }

  // ── Bordes ───────────────────────────────────────────────
  var allRange = sheet.getRange(1, 1, lastRow, numCols)
  allRange.setBorder(
    true, true, true, true, true, true,
    COLOR.border,
    SpreadsheetApp.BorderStyle.SOLID
  )

  // ── Ancho de columnas ────────────────────────────────────
  for (var c = 1; c <= numCols; c++) {
    sheet.setColumnWidth(c, 160)
  }
  // Primera columna (ID) más angosta
  sheet.setColumnWidth(1, 120)
}

// =============================================================
// DROPDOWN DINÁMICO: modelo_id en unidades
// =============================================================

function refreshModeloDropdowns() {
  var ss        = SpreadsheetApp.getActiveSpreadsheet()
  var modSheet  = ss.getSheetByName('modelos')
  var unSheet   = ss.getSheetByName('unidades')
  if (!modSheet || !unSheet) return

  var lastRow = modSheet.getLastRow()
  if (lastRow < 2) return

  // Leer todos los modelo_id (columna 1, desde fila 2)
  var ids = modSheet.getRange(2, 1, lastRow - 1, 1).getValues()
  var modeloIds = ids
    .map(function(row) { return String(row[0]).trim() })
    .filter(function(id) { return id !== '' })

  if (modeloIds.length === 0) return

  // Aplicar dropdown a toda la columna modelo_id en unidades (col 2)
  var unLastRow = Math.max(unSheet.getLastRow(), 2)
  var dropRange = unSheet.getRange(2, 2, unLastRow - 1, 1)
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(modeloIds, true)
    .setAllowInvalid(false)
    .setHelpText('Debe ser un modelo_id existente en la hoja "modelos"')
    .build()
  dropRange.setDataValidation(rule)
}

// =============================================================
// VALIDACIONES
// =============================================================

function validateCell(e) {
  var range     = e.range
  var sheet     = range.getSheet()
  var sheetName = sheet.getName()
  var col       = range.getColumn()
  var row       = range.getRow()
  var value     = range.getValue()

  // Ignorar header
  if (row === 1) return

  var headers = HEADERS[sheetName]
  if (!headers) return

  var colName = headers[col - 1]
  if (!colName) return

  var error = getValidationError(sheetName, colName, col, row, value, sheet)

  if (error) {
    markError(range, error)
  } else {
    clearError(range)
  }
}

function getValidationError(sheetName, colName, col, row, value, sheet) {
  var str = (value === null || value === undefined) ? '' : String(value).trim()

  // ── MODELOS ─────────────────────────────────────────────
  if (sheetName === 'modelos') {
    if (colName === 'modelo_id') {
      if (str === '') return 'modelo_id no puede estar vacío'
      if (hasDuplicate(sheet, col, row, str)) return 'modelo_id duplicado: ' + str
    }
    if (colName === 'tipo') {
      if (TIPOS_VALIDOS.indexOf(str) === -1)
        return 'tipo debe ser: ' + TIPOS_VALIDOS.join(', ')
    }
    if (colName === 'nombre') {
      if (str === '') return 'nombre no puede estar vacío'
    }
    if (colName === 'imagen_principal') {
      if (str !== '' && str.indexOf('http') !== 0)
        return 'imagen_principal debe ser una URL (http...)'
    }
  }

  // ── UNIDADES ─────────────────────────────────────────────
  if (sheetName === 'unidades') {
    if (colName === 'unidad_id') {
      if (str === '') return 'unidad_id no puede estar vacío'
      if (hasDuplicate(sheet, col, row, str)) return 'unidad_id duplicado: ' + str
    }
    if (colName === 'bateria') {
      var bat = Number(value)
      if (isNaN(bat) || bat < 0 || bat > 100)
        return 'bateria debe ser un número entre 0 y 100'
    }
    if (colName === 'precio') {
      var precio = Number(value)
      if (isNaN(precio) || precio <= 0)
        return 'precio debe ser mayor a 0'
    }
    if (colName === 'disponible') {
      if (value !== true && value !== false && str !== 'TRUE' && str !== 'FALSE')
        return 'disponible debe ser TRUE o FALSE'
    }
    if (colName === 'condicion') {
      if (CONDICION_VALIDA.indexOf(str) === -1)
        return 'condicion debe ser: ' + CONDICION_VALIDA.join(', ')
    }
    if (colName === 'imagen_url') {
      if (str !== '' && str.indexOf('http') !== 0)
        return 'imagen_url debe ser una URL (http...)'
    }
  }

  // ── BANNERS ──────────────────────────────────────────────
  if (sheetName === 'banners') {
    if (colName === 'photo') {
      if (str !== '' && str.indexOf('http') !== 0)
        return 'photo debe ser una URL (http...)'
    }
  }

  return null
}

// =============================================================
// HELPERS
// =============================================================

function hasDuplicate(sheet, col, currentRow, value) {
  var lastRow = sheet.getLastRow()
  if (lastRow < 2) return false
  var colValues = sheet.getRange(2, col, lastRow - 1, 1).getValues()
  var count = 0
  colValues.forEach(function(row, idx) {
    if (String(row[0]).trim() === String(value).trim()) {
      count++
    }
  })
  return count > 1
}

function markError(range, message) {
  range
    .setBackground(COLOR.errorBg)
    .setBorder(true, true, true, true, false, false, COLOR.errorBorder, SpreadsheetApp.BorderStyle.SOLID_MEDIUM)
  range.setNote('Error: ' + message)
}

function clearError(range) {
  // Restaurar color alternado según fila
  var row = range.getRow()
  var bg  = (row % 2 === 0) ? COLOR.rowNormal : COLOR.rowAlt
  range.setBackground(bg)
  range.setBorder(false, false, false, false, false, false)
  range.clearNote()
}
