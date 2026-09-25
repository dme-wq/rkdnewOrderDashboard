// ============================================
// KARIGAR PRODUCTION DASHBOARD - BACKEND API
// ============================================
// IMPORTANT: Pehle testAccess() function ko editor mein Run karo!
// Ye Google ko permission deta hai Sheet access karne ki.
// ============================================

const SHEET_ID = "1ubeR_kedLqm8Sv31k4cjbxdnSyPFdN9q4byi4KOysvE";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1ubeR_kedLqm8Sv31k4cjbxdnSyPFdN9q4byi4KOysvE/edit";
const DATA_ENTRY_TAB = "Data Entry";
const PRODUCTION_MASTER_TAB = "Production Master";

// ─── TEST FUNCTION: Isko Editor mein Run karo (pehli baar authorization ke liye) ───
function testAccess() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    Logger.log("✅ SUCCESS! Sheet name: " + ss.getName());
    Logger.log("Sheets available: " + ss.getSheets().map(function(s){ return s.getName(); }).join(", "));
  } catch(e) {
    Logger.log("❌ ERROR: " + e.message);
    Logger.log("Hint: Make sure you are logged in with the account that has access to this Google Sheet.");
  }
}

// ─── MAIN API FUNCTION ───────────────────────────────────────────────────────
function doGet(e) {
  try {
    var ss;
    
    // Try bound spreadsheet first
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch(e1) {
      ss = null;
    }
    
    // Fallback: open by ID (works if this account has sheet access)
    if (!ss) {
      ss = SpreadsheetApp.openById(SHEET_ID);
    }

    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "all";
    var result;

    if (action === "dataEntry") {
      result = { dataEntry: getSheetAsJSON(ss, DATA_ENTRY_TAB) };
    } else if (action === "productionMaster") {
      result = { productionMaster: getSheetAsJSON(ss, PRODUCTION_MASTER_TAB) };
    } else {
      result = {
        dataEntry: getSheetAsJSON(ss, DATA_ENTRY_TAB),
        productionMaster: getSheetAsJSON(ss, PRODUCTION_MASTER_TAB),
        lastUpdated: new Date().toISOString(),
        spreadsheetName: ss.getName()
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
        fix: "Run testAccess() function manually in Apps Script editor to authorize permissions, then redeploy."
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── HELPER: Sheet rows to JSON ──────────────────────────────────────────────
function getSheetAsJSON(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    var available = ss.getSheets().map(function(s){ return s.getName(); }).join(", ");
    throw new Error("Sheet not found: '" + sheetName + "'. Available: " + available);
  }

  var range = sheet.getDataRange();
  var values = range.getDisplayValues();
  var rawValues = range.getValues();
  // Normalize headers: replace newlines (from wrapped header cells) with a single space
  var headers = values[0].map(function(h) { 
    return String(h).trim().replace(/\n/g, " ").replace(/\s+/g, " "); 
  });
  var rows = [];

  for (var r = 1; r < values.length; r++) {
    // Skip rows that are truly empty (no date and no PO number = not a real entry)
    var hasDate = values[r][0] !== "" && values[r][0] !== null;
    var hasPO = false;
    headers.forEach(function(h, c) {
      if ((h === "Buyer PO Number" || h === "Date") && values[r][c] !== "" && values[r][c] !== null) {
        hasPO = true;
      }
    });
    if (!hasDate && !hasPO) continue;
    var obj = {};
    headers.forEach(function(header, c) {
      if (!header) return;
      var val = values[r][c];
      if (rawValues[r][c] instanceof Date) {
        val = Utilities.formatDate(rawValues[r][c], Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      obj[header] = val;
    });
    rows.push(obj);
  }
  return rows;
}
