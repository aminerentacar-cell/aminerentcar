/**
 * Code.gs — à coller dans ton projet Google Apps Script
 * (celui qui a l'URL /exec que tu utilises déjà)
 *
 * CONFIGURATION :
 * 1) SHEET_NAME  -> le nom exact de l'onglet dans ton Google Sheet où écrire les réservations
 * 2) NOTIFY_EMAIL -> l'adresse qui reçoit un email à chaque nouvelle réservation
 */

const SHEET_NAME = "Réservations"; // <-- change si ton onglet a un autre nom
const NOTIFY_EMAIL = "islemnaili688@gmail.com"; // <-- ton adresse

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ---- 1) Écriture dans Google Sheets ----
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Si l'onglet n'existe pas encore, on le crée avec les en-têtes
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Date de réception", "Nom", "Téléphone", "Voiture", "Agence",
        "Date début", "Date fin", "Durée (jours)", "Remarques"
      ]);
    }

    sheet.appendRow([
      new Date(),
      data.client_name || "",
      data.client_phone || "",
      data.car_model || "",
      data.agency || "",
      data.start_date || "",
      data.end_date || "",
      data.duration_days || "",
      data.notes || ""
    ]);

    // ---- 2) Envoi de l'email de notification ----
    const subject = "🚗 Nouvelle réservation — " + (data.client_name || "Client");
    const body =
      "Nouvelle demande de réservation reçue :\n\n" +
      "Nom : " + (data.client_name || "-") + "\n" +
      "Téléphone : " + (data.client_phone || "-") + "\n" +
      "Voiture : " + (data.car_model || "-") + "\n" +
      "Agence : " + (data.agency || "-") + "\n" +
      "Date début : " + (data.start_date || "-") + "\n" +
      "Date fin : " + (data.end_date || "-") + "\n" +
      "Durée : " + (data.duration_days || "-") + " jour(s)\n" +
      "Remarques : " + (data.notes || "-") + "\n";

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
