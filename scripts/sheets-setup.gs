// =============================================================
// PIXEL — Google Sheets Setup Script
// Credenciales en: Configuración del proyecto > Propiedades de script
//   SUPABASE_URL, SUPABASE_SERVICE_KEY, CLIENT_ID
// Triggers necesarios (instalable, NO simple):
//   1. onEditDebounced → Desde hoja de cálculo → Al editar
// =============================================================

var props = PropertiesService.getScriptProperties();
var SUPABASE_URL = props.getProperty("SUPABASE_URL");
var SUPABASE_KEY = props.getProperty("SUPABASE_SERVICE_KEY");
var CLIENT_ID = props.getProperty("CLIENT_ID");

var SYNCABLE = ["modelos", "unidades", "config", "categorias"];

// =============================================================
// SIDEBAR (Subida de Imágenes)
// =============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Pixel")
    .addItem("📸 Subir Imagen a Supabase", "showSidebar")
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("sidebar")
    .setTitle("Pixel Media Uploader")
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function uploadToSupabase(fileInfo) {
  var activeCell = SpreadsheetApp.getActiveRange();
  if (!activeCell) throw new Error("Seleccioná una celda primero.");

  var fileName =
    new Date().getTime() + "_" + fileInfo.name.replace(/\s+/g, "_");
  var bucketName = "pixel-gallery"; // ⚠️ AVISO: El usuario debe crear este bucket PUBLICO en Supabase

  var uploadUrl =
    SUPABASE_URL + "/storage/v1/object/" + bucketName + "/" + fileName;

  // 1. Subir archivo binario
  var blob = Utilities.newBlob(
    Utilities.base64Decode(fileInfo.base64),
    fileInfo.type,
    fileName,
  );

  var options = {
    method: "post",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": fileInfo.type,
    },
    payload: blob.getBytes(),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(uploadUrl, options);

  if (response.getResponseCode() >= 400) {
    throw new Error("Supabase Error: " + response.getContentText());
  }

  // 2. Construir URL pública
  var publicUrl =
    SUPABASE_URL + "/storage/v1/object/public/" + bucketName + "/" + fileName;

  // 3. Pegar en la celda
  activeCell.setValue(publicUrl);

  return publicUrl;
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
  // Leer y limpiar todos los pending de una vez
  var pending = {};
  SYNCABLE.forEach(function (name) {
    if (props.getProperty("pending_" + name) === "true") {
      props.deleteProperty("pending_" + name);
      pending[name] = true;
    }
  });

  // Si cambiaron modelos o unidades, sincronizar ambas juntas (por la FK)
  if (pending["modelos"] || pending["unidades"]) {
    syncModelosYUnidades();
  }

  if (pending["config"]) syncConfig();
  if (pending["categorias"]) syncCategorias();
}

// =============================================================
// SYNC
// =============================================================

function syncAll() {
  syncModelosYUnidades();
  syncConfig();
  syncCategorias();
}

function syncModelosYUnidades() {
  Logger.log("→ leyendo modelos...");
  var modelosData = buildTableData("modelos", "modelo_id");
  Logger.log("→ leyendo unidades...");
  var unidadesData = buildTableData("unidades", "unidad_id");
  Logger.log("Headers unidades: " + JSON.stringify(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("unidades")
      .getRange(1, 1, 1, SpreadsheetApp.getActiveSpreadsheet().getSheetByName("unidades").getLastColumn())
      .getValues()[0]
  ));

  // Filtrar unidades que referencian modelos inexistentes
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

  // Si hay huérfanas, avisar y abortar — no tocar Supabase
  if (huerfanas.length > 0) {
    try {
      SpreadsheetApp.getUi().alert(
        "⚠️ Sync cancelado\n\n" +
          "Las siguientes unidades referencian modelos inexistentes:\n\n" +
          huerfanas.join("\n") +
          "\n\nCorregí el modelo_id antes de sincronizar.",
      );
    } catch (e) {
      Logger.log(
        "SYNC CANCELADO — unidades huérfanas:\n" + huerfanas.join("\n"),
      );
    }
    return;
  }

  Logger.log("→ borrando unidades...");
  deleteTable("unidades");
  Logger.log("→ borrando modelos...");
  deleteTable("modelos");
  Logger.log("→ insertando modelos (" + modelosData.length + " filas)...");
  insertTable("modelos", modelosData);
  Logger.log("→ insertando unidades (" + unidadesValidas.length + " filas)...");
  insertTable("unidades", unidadesValidas);
  Logger.log("✓ modelos y unidades sincronizados");

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

  // Índice de modelo_id para validar filas de unidades
  var modeloIdIdx = headers.indexOf("modelo_id");

  for (var i = 0; i < rows.length; i++) {
    var id = String(rows[i][idIdx]).trim();
    if (!id || seen[id]) continue;

    // Saltear filas incompletas donde modelo_id es obligatorio pero está vacío
    if (modeloIdIdx !== -1 && String(rows[i][modeloIdIdx]).trim() === "")
      continue;

    seen[id] = true;
    var obj = { client_id: CLIENT_ID };
    headers.forEach(function (h, idx) {
      if (!h) return; // ignorar columnas sin header
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

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var data = [];
  rows.forEach(function (r, i) {
    var nombre = String(r[0]).trim();
    if (!nombre) return;
    var web = String(r[1]).trim().toUpperCase() !== "FALSE";
    data.push({ client_id: CLIENT_ID, nombre: nombre, orden: i, web: web });
  });

  if (data.length === 0) return;

  // Delete + insert para reflejar el orden y eliminaciones
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
