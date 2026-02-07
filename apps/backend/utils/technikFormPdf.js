const { PDFDocument } = require('pdf-lib');

/** Wrap text into lines that fit within maxWidth (approx. character count at given size). */
function wrapLines(text, font, size, maxWidthChars) {
  const str = String(text || '').trim() || '–';
  const chars = Array.from(str);
  const lines = [];
  let line = '';
  for (let i = 0; i < chars.length; i++) {
    line += chars[i];
    if (line.length >= maxWidthChars || chars[i] === '\n') {
      if (chars[i] === '\n') {
        lines.push(line.replace(/\n$/, ''));
        line = '';
      } else {
        const lastSpace = line.lastIndexOf(' ');
        if (lastSpace > 0 && lastSpace > line.length - 20) {
          lines.push(line.slice(0, lastSpace));
          line = line.slice(lastSpace + 1);
        } else {
          lines.push(line);
          line = '';
        }
      }
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['–'];
}

/**
 * Generates a single PDF for a Technik Feedback form submission.
 * @param {{
 *   eventName?: string, date?: string, doorsTime?: string,
 *   kostenpflichtigeZusatztechnik?: string, anmerkungen?: string,
 *   showfileDlive?: boolean, showfileDot2?: boolean, hazerAus?: boolean, arbeitsplatzVerlassen?: boolean,
 *   signature?: Buffer | Uint8Array,
 *   getInTechniker?: string, name?: string, technikEndeAbbauBis?: string, soundcheck?: string
 * }} data
 * @returns {Promise<Buffer>}
 */
async function generateTechnikFormPDF(data) {
  const {
    eventName = '',
    date: eventDate = '',
    doorsTime = '',
    kostenpflichtigeZusatztechnik = '',
    anmerkungen = '',
    showfileDlive = false,
    showfileDot2 = false,
    hazerAus = false,
    arbeitsplatzVerlassen = false,
    signature: signatureInput = null,
    getInTechniker = '',
    name = '',
    technikEndeAbbauBis = '',
    soundcheck = '',
  } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
  const helvetica = await pdfDoc.embedFont('Helvetica');

  const titleSize = 18;
  const bodySize = 14;
  const smallSize = 10;
  const lineHeight = 22;
  const margin = 50;
  let y = height - margin - titleSize;

  // Title
  page.drawText('Technik', {
    x: margin,
    y,
    size: titleSize,
    font: helveticaBold,
  });
  y -= lineHeight * 0.8;

  // Subtitle
  page.drawText('Ihr habt den Hut auf für Licht & Ton! Achtet bitte auch auf die Lautstärke etc.', {
    x: margin,
    y,
    size: smallSize,
    font: helvetica,
  });
  y -= lineHeight * 1.2;

  // Name, then Get In / Technik Ende/Abbau bis on one row, then Soundcheck / Doors on one row
  const col1 = margin;
  const col2 = margin + 90;
  const col3 = margin + 260;
  const col4 = margin + 455;
  const rowH = lineHeight * 0.9;
  page.drawText('Name:', { x: col1, y, size: bodySize, font: helveticaBold });
  page.drawText(String(name).trim() || '–', { x: col2, y, size: bodySize, font: helvetica });
  y -= rowH;
  page.drawText('Get In:', { x: col1, y, size: bodySize, font: helveticaBold });
  page.drawText(String(getInTechniker).trim() || '–', { x: col2, y, size: bodySize, font: helvetica });
  page.drawText('Technik Ende/Abbau bis:', { x: col3, y, size: bodySize, font: helveticaBold });
  page.drawText(String(technikEndeAbbauBis).trim() || '–', { x: col4, y, size: bodySize, font: helvetica });
  y -= rowH;
  page.drawText('Soundcheck:', { x: col1, y, size: bodySize, font: helveticaBold });
  page.drawText(String(soundcheck).trim() || '–', { x: col2, y, size: bodySize, font: helvetica });
  page.drawText('Doors:', { x: col3, y, size: bodySize, font: helveticaBold });
  page.drawText(String(doorsTime).trim() || '–', { x: col4, y, size: bodySize, font: helvetica });
  y -= lineHeight * 2;

  // Kostenpflichtige Zusatztechnik
  page.drawText('Kostenpflichtige Zusatztechnik (bitte der Schichtleitung melden)', { x: margin, y, size: bodySize, font: helveticaBold });
  y -= lineHeight * 0.8;
  const kostenLines = wrapLines(kostenpflichtigeZusatztechnik, helvetica, bodySize, 72);
  for (const line of kostenLines) {
    if (y < margin + 14) break;
    page.drawText(line, { x: margin, y, size: 11, font: helvetica });
    y -= 14;
  }
  y -= lineHeight * 0.6;

  // Anmerkungen
  page.drawText('Anmerkungen', { x: margin, y, size: bodySize, font: helveticaBold });
  y -= lineHeight * 0.8;
  const anmerkLines = wrapLines(anmerkungen, helvetica, bodySize, 72);
  for (const line of anmerkLines) {
    if (y < margin + 14) break;
    page.drawText(line, { x: margin, y, size: 11, font: helvetica });
    y -= 14;
  }
  y -= lineHeight * 0.8;

  // Checkboxes (Ja/Nein)
  const jaNein = (v) => (v ? 'Ja' : 'Nein');
  page.drawText('"AA Club Standard" Showfile geladen (DLIVE)', { x: margin, y, size: smallSize, font: helvetica });
  page.drawText(jaNein(showfileDlive), { x: margin + 380, y, size: smallSize, font: helvetica });
  y -= lineHeight * 0.7;
  page.drawText('"Besichtigung" Showfile geladen (dot2)', { x: margin, y, size: smallSize, font: helvetica });
  page.drawText(jaNein(showfileDot2), { x: margin + 380, y, size: smallSize, font: helvetica });
  y -= lineHeight * 0.7;
  page.drawText('Hazer/Nebelmaschine aus', { x: margin, y, size: smallSize, font: helvetica });
  page.drawText(jaNein(hazerAus), { x: margin + 380, y, size: smallSize, font: helvetica });
  y -= lineHeight * 0.7;
  page.drawText('Ich habe den Arbeitsplatz so verlassen, wie ich ihn auch gerne wieder auffinden würde.', { x: margin, y, size: smallSize, font: helvetica });
  page.drawText(jaNein(arbeitsplatzVerlassen), { x: margin + 380, y, size: smallSize, font: helvetica });
  y -= lineHeight * 1.2;

  // Veranstaltung, Datum (read-only from event)
  const formatDate = (d) => {
    if (!d || !d.trim()) return '–';
    const parts = d.trim().split('-');
    if (parts.length >= 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return d.trim();
  };
  const tcol1 = margin;
  const tcol2 = margin + 220;
  const trowH = lineHeight * 0.85;
  page.drawText('Veranstaltung:', { x: tcol1, y, size: smallSize, font: helveticaBold });
  page.drawText(String(eventName).trim() || '–', { x: tcol2, y, size: smallSize, font: helvetica });
  y -= trowH;
  page.drawText('Datum:', { x: tcol1, y, size: smallSize, font: helveticaBold });
  page.drawText(formatDate(eventDate), { x: tcol2, y, size: smallSize, font: helvetica });
  y -= lineHeight * 1.2;

  // Signature
  const signatureBytes = signatureInput && (Buffer.isBuffer(signatureInput) || signatureInput instanceof Uint8Array)
    ? (Buffer.isBuffer(signatureInput) ? new Uint8Array(signatureInput) : signatureInput)
    : null;
  if (signatureBytes && signatureBytes.length > 0 && y > margin + 50) {
    try {
      const sigImage = await pdfDoc.embedPng(signatureBytes);
      const maxSigWidth = 250;
      const maxSigHeight = 60;
      const scaled = sigImage.scaleToFit(maxSigWidth, maxSigHeight);
      page.drawText('Unterschrift:', { x: margin, y, size: bodySize, font: helveticaBold });
      y -= lineHeight * 0.6;
      const sigHeight = scaled.height;
      const sigWidth = scaled.width;
      page.drawImage(sigImage, {
        x: margin,
        y: y - sigHeight,
        width: sigWidth,
        height: sigHeight,
      });
    } catch (_) {
      // If PNG invalid, skip signature
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generateTechnikFormPDF };
