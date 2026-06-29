const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const SHEET_NAME = '방문상담_DB';
const DEVELOPER = '장문희';
const HEADERS = ['접수일시', '이름', '연락처', '문의', '개발자', '상담상태', '유입페이지', 'UTM Source', 'UTM Medium', 'UTM Campaign', '접수ID', 'User Agent'];

function doGet() {
  return output(true, null, { service: 'medispark-lead-api', developer: DEVELOPER });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse(e.postData.contents || '{}');
    const name = clean(data.name, 40);
    const phone = String(data.phone || '').replace(/[^0-9-]/g, '').slice(0, 13);
    const inquiry = clean(data.inquiry, 1000);
    if (!name || !/^01[016789]-\d{3,4}-\d{4}$/.test(phone) || !inquiry) return output(false, 'INVALID_INPUT');

    if (!SPREADSHEET_ID) throw new Error('SPREADSHEET_ID_NOT_CONFIGURED');
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('SHEET_NOT_FOUND');
    const receiptId = Utilities.getUuid();
    sheet.appendRow([
      new Date(), safeCell(name), phone, safeCell(inquiry), DEVELOPER, '신규',
      safeCell(data.pageUrl, 500), safeCell(data.utmSource, 100), safeCell(data.utmMedium, 100),
      safeCell(data.utmCampaign, 100), receiptId, safeCell(data.userAgent, 500)
    ]);
    return output(true, null, { receiptId: receiptId });
  } catch (error) {
    console.error(error);
    return output(false, 'SERVER_ERROR');
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function clean(value, max) { return String(value || '').replace(/<[^>]*>/g, '').trim().slice(0, max); }
function safeCell(value, max) {
  const text = clean(value, max || 1000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function output(success, error, extra) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ success: success, error: error || null }, extra || {}))).setMimeType(ContentService.MimeType.JSON);
}

function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#073b46').setFontColor('#ffffff');
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange('C:C').setNumberFormat('@');
    sheet.autoResizeColumns(1, HEADERS.length);
  }
}
