// =============================================================
// PIXEL — Google Sheets Setup Script
// Credenciales en: Configuración del proyecto > Propiedades de script
//   SUPABASE_URL, SUPABASE_SERVICE_KEY, CLIENT_ID, STORAGE_BUCKET
// Triggers necesarios (instalable, NO simple):
//   1. onEditDebounced → Desde hoja de cálculo → Al editar
// =============================================================

var props = PropertiesService.getScriptProperties();
var SUPABASE_URL = props.getProperty("SUPABASE_URL");
var SUPABASE_KEY = props.getProperty("SUPABASE_SERVICE_KEY");
var CLIENT_ID = props.getProperty("CLIENT_ID");

var SYNCABLE = ["modelos", "unidades", "config", "categorias", "paleta", "cotizador_modelos", "cotizador_ajustes"];

// =============================================================
// MENÚ
// =============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Pixel")
    .addItem("📸 Subir Imagen", "showImageUploader")
    .addItem("🎨 Selector de Color", "showColorPicker")
    .addSeparator()
    .addItem("⚙️ Activar sync automático", "installTriggers")
    .addItem("🔄 Sincronizar todo ahora", "syncAll")
    .addToUi();
}

function editTriggerInstalled() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ScriptApp.getUserTriggers(ss).some(function (t) {
    return t.getHandlerFunction() === "onEditDebounced";
  });
}

function installTriggers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  if (editTriggerInstalled()) {
    ui.alert("Pixel", "✅ El sync automático ya estaba activado.", ui.ButtonSet.OK);
    return;
  }

  ScriptApp.newTrigger("onEditDebounced")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  ui.alert("Pixel", "✅ Sync automático activado.\nCada cambio en el Sheet se sincronizará a Supabase en ~1 minuto.", ui.ButtonSet.OK);
}

// =============================================================
// SUBIDA DE IMÁGENES
// Propiedad de script requerida: STORAGE_BUCKET (ej: "pixel-media")
// El bucket debe existir en Supabase Storage y ser público.
// =============================================================

function showImageUploader() {
  var html = HtmlService.createHtmlOutputFromFile("imageUploader")
    .setTitle("Subir Imagen")
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function uploadToSupabase(fileInfo) {
  var activeCell = SpreadsheetApp.getActiveRange();
  if (!activeCell) throw new Error("Seleccioná una celda primero.");

  var bucketName = props.getProperty("STORAGE_BUCKET") || "media";
  var fileName = new Date().getTime() + "_" + fileInfo.name.replace(/\s+/g, "_");
  var uploadUrl = SUPABASE_URL + "/storage/v1/object/" + bucketName + "/" + fileName;

  var blob = Utilities.newBlob(
    Utilities.base64Decode(fileInfo.base64),
    fileInfo.type,
    fileName,
  );

  var response = UrlFetchApp.fetch(uploadUrl, {
    method: "post",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": fileInfo.type,
    },
    payload: blob.getBytes(),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() >= 400) {
    throw new Error("Supabase Storage error: " + response.getContentText());
  }

  var publicUrl = SUPABASE_URL + "/storage/v1/object/public/" + bucketName + "/" + fileName;
  activeCell.setValue(publicUrl);
  return publicUrl;
}

// =============================================================
// SELECTOR DE COLOR
// =============================================================

function showColorPicker() {
  var html = HtmlService.createHtmlOutputFromFile("sidebar")
    .setTitle("Selector de Color")
    .setWidth(280);
  SpreadsheetApp.getUi().showSidebar(html);
}

function pasteHexInActiveCell(hex) {
  var cell = SpreadsheetApp.getActiveRange();
  if (!cell) throw new Error("Seleccioná una celda primero.");
  cell.setValue(hex);
}

// =============================================================
// TRIGGERS
// =============================================================

// Trigger instalable "Al editar" → apuntar a esta función
function onEditDebounced(e) {
  var sheetName =
    e && e.source ? e.source.getActiveSheet().getName().toLowerCase() : null;
  if (!sheetName || SYNCABLE.indexOf(sheetName) === -1) return;

  // Borrar triggers previos temporales (para reiniciar el minuto de espera)
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "runSync") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Marcar qué pestaña cambió
  props.setProperty("pending_" + sheetName, "true");

  // Crear un timer temporal para dentro de 1 minuto (debounce)
  ScriptApp.newTrigger("runSync")
    .timeBased()
    .after(60 * 1000)
    .create();
}

// Ejecutada por el timer al pasar un minuto sin cambios
function runSync() {
  var pending = {};
  SYNCABLE.forEach(function (name) {
    if (props.getProperty("pending_" + name) === "true") {
      props.deleteProperty("pending_" + name);
      pending[name] = true;
    }
  });

  if (pending["modelos"] || pending["unidades"]) {
    syncModelosYUnidades();
  }

  if (pending["config"]) syncConfig();
  if (pending["categorias"]) syncCategorias();
  if (pending["paleta"]) syncPaleta();
  if (pending["cotizador_modelos"] || pending["cotizador_ajustes"]) syncCotizador();
}

// =============================================================
// SYNC
// =============================================================

function syncAll() {
  syncModelosYUnidades();
  syncConfig();
  syncCategorias();
  syncPaleta();
  syncCotizador();
}

// Columnas estándar de unidades — el resto va al JSONB atributos
var UNIDAD_STANDARD_COLS = ["unidad_id", "modelo_id", "disponible", "imagen_1", "imagen_2", "imagen_3", "imagen_principal", "descripcion", "precio"];

function buildUnidadesData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("unidades");
  if (!sheet || sheet.getLastRow() < 2) return [];

  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) { return String(h).trim().toLowerCase(); });

  var rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();

  var seen = {};
  var data = [];
  var idIdx = headers.indexOf("unidad_id");
  var modeloIdIdx = headers.indexOf("modelo_id");

  for (var i = 0; i < rows.length; i++) {
    var id = String(rows[i][idIdx]).trim();
    if (!id || seen[id]) continue;
    if (String(rows[i][modeloIdIdx]).trim() === "") continue;

    seen[id] = true;
    var obj = { client_id: CLIENT_ID };
    var atributos = {};

    headers.forEach(function (h, idx) {
      if (!h) return;
      var val = rows[i][idx];
      val = val === "" || val === undefined ? null : val;

      if (UNIDAD_STANDARD_COLS.indexOf(h) !== -1) {
        obj[h] = val;
      } else {
        if (val !== null) atributos[h] = String(val);
      }
    });

    obj["atributos"] = atributos;
    data.push(obj);
  }

  return data;
}

function syncModelosYUnidades() {
  var modelosData = buildTableData("modelos", "modelo_id");
  var unidadesData = buildUnidadesData();

  var modeloIds = {};
  modelosData.forEach(function (m) {
    modeloIds[m.modelo_id] = true;
  });
  var huerfanas = [];
  var unidadesValidas = unidadesData.filter(function (u) {
    if (!modeloIds[u.modelo_id]) {
      huerfanas.push(u.unidad_id + " → modelo '" + u.modelo_id + "' no existe");
      return false;
    }
    return true;
  });

  if (huerfanas.length > 0) {
    try {
      SpreadsheetApp.getUi().alert(
        "⚠️ Sync cancelado\n\n" +
          "Las siguientes unidades referencian modelos inexistentes:\n\n" +
          huerfanas.join("\n") +
          "\n\nCorregí el modelo_id antes de sincronizar.",
      );
    } catch (e) {
      Logger.log("SYNC CANCELADO — unidades huérfanas:\n" + huerfanas.join("\n"));
    }
    return;
  }

  deleteTable("unidades");
  deleteTable("modelos");
  insertTable("modelos", modelosData);
  insertTable("unidades", unidadesValidas);
}

function buildTableData(sheetName, idCol) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) {
      return String(h).trim().toLowerCase();
    });
  var rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();

  var seen = {};
  var data = [];
  var idIdx = headers.indexOf(idCol);
  var modeloIdIdx = headers.indexOf("modelo_id");

  for (var i = 0; i < rows.length; i++) {
    var id = String(rows[i][idIdx]).trim();
    if (!id || seen[id]) continue;

    if (modeloIdIdx !== -1 && String(rows[i][modeloIdIdx]).trim() === "")
      continue;

    seen[id] = true;
    var obj = { client_id: CLIENT_ID };
    headers.forEach(function (h, idx) {
      if (!h) return;
      var val = rows[i][idx];
      obj[h] = val === "" || val === undefined ? null : val;
    });
    data.push(obj);
  }
  return data;
}

function deleteTable(sheetName) {
  var resp = UrlFetchApp.fetch(
    SUPABASE_URL + "/rest/v1/" + sheetName + "?client_id=eq." + CLIENT_ID,
    {
      method: "delete",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
      },
      muteHttpExceptions: true,
    },
  );
  if (resp.getResponseCode() >= 400) {
    Logger.log("ERROR delete " + sheetName + ": " + resp.getContentText());
    throw new Error("delete " + sheetName + " failed");
  }
}

function insertTable(sheetName, data) {
  if (!data || data.length === 0) return;
  var resp = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/" + sheetName, {
    method: "post",
    contentType: "application/json",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() >= 400) {
    Logger.log("ERROR insert " + sheetName + ": " + resp.getContentText());
  }
}

function syncTable(sheetName, idCol) {
  var data = buildTableData(sheetName, idCol);
  deleteTable(sheetName);
  insertTable(sheetName, data);
}

function syncConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("config");
  if (!sheet || sheet.getLastRow() < 2) return;

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var data = rows
    .filter(function (row) {
      var key = String(row[0]).trim();
      return key !== "" && key[0] !== "#";
    })
    .map(function (row) {
      return {
        client_id: CLIENT_ID,
        key: String(row[0]).trim(),
        value: String(row[1]),
      };
    });

  if (data.length === 0) return;

  UrlFetchApp.fetch(
    SUPABASE_URL + "/rest/v1/config?on_conflict=key,client_id",
    {
      method: "post",
      contentType: "application/json",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        Prefer: "resolution=merge-duplicates",
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true,
    },
  );
}

function syncCategorias() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("categorias");
  if (!sheet || sheet.getLastRow() < 2) return;

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  var data = [];
  rows.forEach(function (r, i) {
    var nombre = String(r[0]).trim();
    if (!nombre) return;
    var web = String(r[1]).trim().toUpperCase() !== "FALSE";
    var imagen = String(r[2]).trim() || null;
    data.push({ client_id: CLIENT_ID, nombre: nombre, orden: i, web: web, imagen: imagen });
  });

  if (data.length === 0) return;

  var delResp = UrlFetchApp.fetch(
    SUPABASE_URL + "/rest/v1/categorias?client_id=eq." + CLIENT_ID,
    {
      method: "delete",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
      },
      muteHttpExceptions: true,
    },
  );
  if (delResp.getResponseCode() >= 400) {
    Logger.log("ERROR delete categorias: " + delResp.getContentText());
    return;
  }

  var insResp = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/categorias", {
    method: "post",
    contentType: "application/json",
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
    payload: JSON.stringify(data),
    muteHttpExceptions: true,
  });
  if (insResp.getResponseCode() >= 400) {
    Logger.log("ERROR insert categorias: " + insResp.getContentText());
  }
}

function syncPaleta() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("paleta");
  if (!sheet || sheet.getLastRow() < 2) return;

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var data = [];
  rows.forEach(function (r) {
    var nombre = String(r[0]).trim();
    var hex    = String(r[1]).trim();
    if (!nombre || !hex) return;
    data.push({ client_id: CLIENT_ID, nombre: nombre, hex: hex });
  });
  if (data.length === 0) return;

  deleteTable("paleta");
  insertTable("paleta", data);
}

function syncCotizador() {
  // Lee de la hoja "cotizador_modelos" y escribe en la tabla "tradein_modelos"
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetModelos = ss.getSheetByName("cotizador_modelos");
  if (sheetModelos && sheetModelos.getLastRow() >= 2) {
    var modelosData = buildTableData_fromSheet(sheetModelos, "modelo");
    deleteTable("tradein_modelos");
    insertTable("tradein_modelos", modelosData);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("cotizador_ajustes");
  if (!sheet || sheet.getLastRow() < 2) return;

  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) { return String(h).trim().toLowerCase(); });

  var rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();

  var tipoIdx = headers.indexOf("tipo");
  var nombreIdx = headers.indexOf("nombre");
  var seen = {};
  var data = [];

  for (var i = 0; i < rows.length; i++) {
    var tipo = String(rows[i][tipoIdx]).trim();
    var nombre = String(rows[i][nombreIdx]).trim();
    if (!tipo || !nombre) continue;
    var key = tipo + "|" + nombre;
    if (seen[key]) continue;
    seen[key] = true;

    var obj = { client_id: CLIENT_ID, orden: i };
    headers.forEach(function (h, idx) {
      if (!h) return;
      var val = rows[i][idx];
      obj[h] = val === "" || val === undefined ? null : val;
    });
    data.push(obj);
  }

  deleteTable("tradein_ajustes");
  insertTable("tradein_ajustes", data);
}

function buildTableData_fromSheet(sheet, idCol) {
  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (h) { return String(h).trim().toLowerCase(); });
  var rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues();

  var seen = {};
  var data = [];
  var idIdx = headers.indexOf(idCol);

  for (var i = 0; i < rows.length; i++) {
    var id = String(rows[i][idIdx]).trim();
    if (!id || seen[id]) continue;
    seen[id] = true;
    var obj = { client_id: CLIENT_ID };
    headers.forEach(function (h, idx) {
      if (!h) return;
      var val = rows[i][idx];
      obj[h] = val === "" || val === undefined ? null : val;
    });
    data.push(obj);
  }
  return data;
}
