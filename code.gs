/**
 * AMINE RENT A CAR — Moteur de réservation
 * À coller dans Extensions > Apps Script du Google Sheet.
 * Voir GUIDE-CONFIGURATION.md pour les étapes d'installation.
 */

const SHEET_VOITURES = 'Voitures';       // colonnes: Nom | Statut (Disponible/Indisponible)
const SHEET_RESERVATIONS = 'Reservations'; // colonnes: Horodatage | Voiture | Nom | Téléphone | Email | Début | Fin | Statut | Expiration
const EMAIL_PROPRIETAIRE = 'ton-email@exemple.com'; // <-- remplace par l'email du gérant
const DELAI_CONFIRMATION_MS = 60 * 60 * 1000;   // 60 min avant réponse (info uniquement)
const DELAI_FINALISATION_MS = 6 * 60 * 60 * 1000; // 6h pour finaliser après confirmation

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'list') {
    return jsonResponse({ cars: getCarStatuses() });
  }
  return jsonResponse({ error: 'action inconnue' });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.action === 'reserve') {
      return handleReservation(payload);
    }
    return jsonResponse({ success: false, error: 'action inconnue' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function handleReservation(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const carsSheet = ss.getSheetByName(SHEET_VOITURES);
  const resSheet = ss.getSheetByName(SHEET_RESERVATIONS);

  // 1. Vérifier la disponibilité réelle dans la feuille (source de vérité)
  const carRow = findCarRow(carsSheet, payload.car);
  if (carRow === -1) {
    return jsonResponse({ success: false, error: 'Voiture introuvable' });
  }
  const statutActuel = carsSheet.getRange(carRow, 2).getValue();
  if (statutActuel === 'Indisponible') {
    return jsonResponse({ success: false, reason: 'unavailable' });
  }

  // 2. Marquer la voiture comme réservée immédiatement (premier arrivé, premier servi)
  carsSheet.getRange(carRow, 2).setValue('Indisponible');

  // 3. Enregistrer la réservation
  const now = new Date();
  const expiration = new Date(now.getTime() + DELAI_FINALISATION_MS);
  resSheet.appendRow([
    now, payload.car, payload.name, payload.phone, payload.email || '',
    payload.start, payload.end, 'En attente', expiration
  ]);

  // 4. Email de notification au propriétaire (confirmation automatique dans le tableau = ligne ajoutée)
  try {
    MailApp.sendEmail({
      to: EMAIL_PROPRIETAIRE,
      subject: 'Nouvelle demande de réservation — ' + payload.car,
      body:
        'Nouvelle demande reçue :\n\n' +
        'Voiture : ' + payload.car + '\n' +
        'Client : ' + payload.name + '\n' +
        'Téléphone : ' + payload.phone + '\n' +
        'Email : ' + (payload.email || 'non fourni') + '\n' +
        'Du ' + payload.start + ' au ' + payload.end + '\n\n' +
        'Merci de répondre dans les 60 minutes. Le client aura ensuite 6h pour finaliser les documents.'
    });
  } catch (err) { /* l'échec de l'email ne doit pas bloquer la réservation */ }

  // 5. Email de confirmation au client, si fourni
  if (payload.email) {
    try {
      MailApp.sendEmail({
        to: payload.email,
        subject: 'Amine Rent A Car — Demande reçue',
        body:
          'Bonjour ' + payload.name + ',\n\n' +
          'Votre demande de réservation pour ' + payload.car + ' a bien été reçue.\n' +
          'Nous vous répondons sous 60 minutes.\n' +
          'Une fois confirmée, vous aurez 6 heures pour finaliser les documents.\n\n' +
          'Amine Rent A Car'
      });
    } catch (err) { /* silencieux */ }
  }

  return jsonResponse({ success: true, stillAvailable: false });
}

function getCarStatuses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_VOITURES);
  const values = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < values.length; i++) {
    const nom = values[i][0];
    const statut = values[i][1];
    if (nom) map[nom] = statut;
  }
  return map;
}

function findCarRow(sheet, carName) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === carName) return i + 1; // +1 car les lignes sheet commencent à 1
  }
  return -1;
}

/**
 * À lancer automatiquement toutes les 15-30 min via un déclencheur (trigger).
 * Libère les voitures dont la réservation "En attente" dépasse le délai de 6h
 * sans finalisation, pour respecter la règle premier-arrivé-premier-servi.
 */
function liberateExpiredReservations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const carsSheet = ss.getSheetByName(SHEET_VOITURES);
  const resSheet = ss.getSheetByName(SHEET_RESERVATIONS);
  const values = resSheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < values.length; i++) {
    const statut = values[i][7];
    const expiration = values[i][8];
    if (statut === 'En attente' && expiration && now > new Date(expiration)) {
      resSheet.getRange(i + 1, 8).setValue('Expirée');
      const carRow = findCarRow(carsSheet, values[i][1]);
      if (carRow !== -1) carsSheet.getRange(carRow, 2).setValue('Disponible');
    }
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
