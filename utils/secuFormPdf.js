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
 * Generates a single PDF for a Secu form submission (one or more people).
 * @param {{ people?: Array<{ name: string, startTime: string, endTime: string }>, getickert?: string, vorfalle?: string, signature?: Buffer | Uint8Array, einlassbereichAbgeraeumt?: boolean, sachenZurueckgebracht?: boolean, arbeitsplatzHinterlassen?: boolean, eventName?: string, date?: string, doorsTime?: string }} data
 * @returns {Promise<Buffer>}
 */
async function generateSecuFormPDF(data) {
  const {
    people: peopleInput = [],
    name: singleName = '',
    startTime: singleStart = '',
    endTime: singleEnd = '',
    getickert = '',
    vorfalle = '',
    signature: signatureInput = null,
    einlassbereichAbgeraeumt = false,
    sachenZurueckgebracht = false,
    arbeitsplatzHinterlassen = false,
    eventName = '',
    date: eventDate = '',
    doorsTime = '',
  } = data;

  const people = Array.isArray(peopleInput) && peopleInput.length > 0
    ? peopleInput.map((p) => ({
        name: (p.name != null ? String(p.name) : '').trim(),
        startTime: (p.startTime != null ? String(p.startTime) : '').trim(),
        endTime: (p.endTime != null ? String(p.endTime) : '').trim(),
      }))
    : [{ name: singleName, startTime: singleStart, endTime: singleEnd }];

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
  const helvetica = await pdfDoc.embedFont('Helvetica');

  const titleSize = 18;
  const bodySize = 14;
  const smallSize = 10;
  const lineHeight = 22;
  const margin = 50;
  let y = height - margin - titleSize;

  // Title
  page.drawText('Secuzettel', {
    x: margin,
    y,
    size: titleSize,
    font: helveticaBold,
  });
  y -= lineHeight * 1.2;

  // Event info (read-only display)
  if (eventName || eventDate || doorsTime) {
    const formatDate = (d) => {
      if (!d || !d.trim()) return '–';
      const parts = d.trim().split('-');
      if (parts.length >= 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return d.trim();
    };
    page.drawText('Event:', { x: margin, y, size: smallSize, font: helveticaBold });
    page.drawText(String(eventName).trim() || '–', { x: margin + 55, y, size: smallSize, font: helvetica });
    y -= lineHeight * 0.8;
    page.drawText('Datum:', { x: margin, y, size: smallSize, font: helveticaBold });
    page.drawText(formatDate(eventDate), { x: margin + 55, y, size: smallSize, font: helvetica });
    y -= lineHeight * 0.8;
    page.drawText('Doors:', { x: margin, y, size: smallSize, font: helveticaBold });
    page.drawText(String(doorsTime).trim() || '–', { x: margin + 55, y, size: smallSize, font: helvetica });
    y -= lineHeight * 1.2;
  }

  // Submission timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE');
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  page.drawText(`Erstellt am ${dateStr} um ${timeStr}`, {
    x: margin,
    y,
    size: smallSize,
    font: helvetica,
  });
  y -= lineHeight * 1.2;

  // People table: header then one row per person
  page.drawText('Name', { x: margin, y, size: bodySize, font: helveticaBold });
  page.drawText('Start', { x: margin + 180, y, size: bodySize, font: helveticaBold });
  page.drawText('Ende', { x: margin + 280, y, size: bodySize, font: helveticaBold });
  y -= lineHeight * 0.9;

  for (const p of people) {
    page.drawText(String(p.name) || '–', { x: margin, y, size: bodySize, font: helvetica });
    page.drawText(String(p.startTime) || '–', { x: margin + 180, y, size: bodySize, font: helvetica });
    page.drawText(String(p.endTime) || '–', { x: margin + 280, y, size: bodySize, font: helvetica });
    y -= lineHeight * 0.85;
  }
  y -= lineHeight * 0.5;

  // Getickert
  page.drawText('Getickert:', { x: margin, y, size: bodySize, font: helveticaBold });
  page.drawText(String(getickert).trim() || '–', { x: margin + 80, y, size: bodySize, font: helvetica });
  y -= lineHeight * 1.2;

  // Vorfälle
  page.drawText('Vorfälle:', { x: margin, y, size: bodySize, font: helveticaBold });
  y -= lineHeight * 0.8;
  const vorfalleLines = wrapLines(vorfalle, helvetica, bodySize, 72);
  const vorfalleLineHeight = 14;
  for (const line of vorfalleLines) {
    if (y < margin + vorfalleLineHeight) break;
    page.drawText(line, { x: margin, y, size: 11, font: helvetica });
    y -= vorfalleLineHeight;
  }

  const jaNein = (v) => (v ? 'Ja' : 'Nein');
  y -= lineHeight * 0.8;
  page.drawText('Einlassbereich wurde abgeräumt?', { x: margin, y, size: smallSize, font: helvetica });
  page.drawText(jaNein(einlassbereichAbgeraeumt), { x: margin + 280, y, size: smallSize, font: helvetica });
  y -= lineHeight * 0.7;
  page.drawText('Sachen aus anderen Läden wurden zurückgebracht?', { x: margin, y, size: smallSize, font: helvetica });
  page.drawText(jaNein(sachenZurueckgebracht), { x: margin + 280, y, size: smallSize, font: helvetica });
  y -= lineHeight * 0.7;
  page.drawText('Arbeitsplatz so hinterlassen wie vorgefunden?', { x: margin, y, size: smallSize, font: helvetica });
  page.drawText(jaNein(arbeitsplatzHinterlassen), { x: margin + 280, y, size: smallSize, font: helvetica });
  y -= lineHeight * 0.8;

  // Signature at the end
  const signatureBytes = signatureInput && (Buffer.isBuffer(signatureInput) || signatureInput instanceof Uint8Array)
    ? (Buffer.isBuffer(signatureInput) ? new Uint8Array(signatureInput) : signatureInput)
    : null;
  if (signatureBytes && signatureBytes.length > 0 && y > margin + 50) {
    try {
      const sigImage = await pdfDoc.embedPng(signatureBytes);
      const maxSigWidth = 250;
      const maxSigHeight = 60;
      const scaled = sigImage.scaleToFit(maxSigWidth, maxSigHeight);
      y -= lineHeight * 0.8;
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
      y -= sigHeight + lineHeight * 0.5;
    } catch (_) {
      // If PNG invalid, skip signature
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { generateSecuFormPDF };
