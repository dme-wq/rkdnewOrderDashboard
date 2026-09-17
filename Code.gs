// ============================================
// KARIGAR PRODUCTION DASHBOARD - BACKEND API
// ============================================
// Deploy karein: Extensions → Apps Script → Deploy → New deployment
// Execute as: Me | Who has access: Anyone
// ============================================

const DATA_ENTRY_TAB = "Data Entry";
const PRODUCTION_MASTER_TAB = "Production Master";

function doGet(e) {
  try {
    // Try getActiveSpreadsheet first (works when script is bound to the sheet)
    // Falls back to openById if SHEET_ID is set
    const SHEET_ID = "1CnKwG2L_nslYXThzRxtiWaD3ixIIPvi0sMR3mQnQscA";
    
    let ss;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
      if (!ss) throw new Error("No active spreadsheet");
    } catch (e1) {
      ss = SpreadsheetApp.openById(SHEET_ID);
    }

    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "all";
    let result;

    if (action === "dataEntry") {
      result = { dataEntry: getSheetAsJSON(ss, DATA_ENTRY_TAB) };
    } else if (action === "productionMaster") {
      result = { productionMaster: getSheetAsJSON(ss, PRODUCTION_MASTER_TAB) };
    } else {
      result = {
        dataEntry: getSheetAsJSON(ss, DATA_ENTRY_TAB),
        productionMaster: getSheetAsJSON(ss, PRODUCTION_MASTER_TAB),
        lastUpdated: new Date().toISOString(),
        sheetName: ss.getName()
      };
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, ...result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: err.message,
        hint: "Make sure this script is created via Extensions → Apps Script inside the Google Sheet, not as a standalone script."
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetAsJSON(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName + ". Available sheets: " + ss.getSheets().map(s => s.getName()).join(", "));

  const range = sheet.getDataRange();
  const values = range.getDisplayValues();
  const rawValues = range.getValues();

  const headers = values[0].map(function(h) { return String(h).trim(); });
  const rows = [];

  for (var r = 1; r < values.length; r++) {
    var rowDisplay = values[r];
    var rowRaw = rawValues[r];

    var isEmpty = rowDisplay.every(function(cell) { return cell === "" || cell === null; });
    if (isEmpty) continue;

    var obj = {};
    headers.forEach(function(header, c) {
      if (!header) return;
      var val = rowDisplay[c];
      if (rowRaw[c] instanceof Date) {
        val = Utilities.formatDate(rowRaw[c], Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      obj[header] = val;
    });
    rows.push(obj);
  }

  return rows;
}
