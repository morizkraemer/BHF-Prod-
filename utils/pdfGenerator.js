const PDFDocument = require('pdfkit');

/**
 * Generates a PDF report from form data
 * @param {Object} formData - The form data object containing all sections
 * @returns {Promise<Buffer>} - A promise that resolves to the PDF buffer
 */
function generateReportPDF(formData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: 'Shift Report',
          Author: 'Produktionstool'
        }
      });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Helper function to draw a section header
      const drawSectionHeader = (title) => {
        doc.moveDown(1);
        doc.fillColor('#2c3e50')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(title, { underline: false });
        doc.fillColor('#34495e')
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();
        doc.moveDown(0.5);
        doc.fillColor('#000000');
      };
      
      // Helper function to add a key-value pair
      const addField = (label, value, indent = 0) => {
        if (value !== undefined && value !== null && value !== '') {
          const xPos = 50 + indent;
          doc.fontSize(10)
            .fillColor('#555555')
            .text(label + ':', xPos, doc.y, { width: 150, continued: false });
          doc.fillColor('#000000')
            .font('Helvetica-Bold')
            .text(String(value), xPos + 160, doc.y, { width: 335 });
          doc.moveDown(0.4);
        }
      };
      
      // Helper function to add a table row
      const addTableRow = (cells, isHeader = false) => {
        const startY = doc.y;
        const rowHeight = isHeader ? 20 : 18;
        const cellWidth = 495 / cells.length;
        let xPos = 50;
        
        cells.forEach((cell, index) => {
          doc.rect(xPos, startY, cellWidth, rowHeight)
            .fillColor(isHeader ? '#34495e' : index % 2 === 0 ? '#f8f9fa' : '#ffffff')
            .fill()
            .stroke();
          
          doc.fillColor(isHeader ? '#ffffff' : '#000000')
            .fontSize(isHeader ? 10 : 9)
            .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
            .text(cell, xPos + 5, startY + (rowHeight / 2) - 5, {
              width: cellWidth - 10,
              align: 'left'
            });
          
          xPos += cellWidth;
        });
        
        doc.y = startY + rowHeight;
        doc.fillColor('#000000');
      };
      
      // Header with colored background
      doc.rect(0, 0, 595, 80)
        .fillColor('#2c3e50')
        .fill();
      
      doc.fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('SHIFT REPORT', 50, 30, { align: 'center', width: 495 });
      
      const uebersicht = formData.uebersicht || {};
      if (uebersicht.eventName) {
        doc.fontSize(16)
          .font('Helvetica')
          .text(uebersicht.eventName, 50, 55, { align: 'center', width: 495 });
      }
      
      if (uebersicht.date) {
        doc.fontSize(12)
          .text(uebersicht.date, 50, 75, { align: 'center', width: 495 });
      }
      
      doc.y = 100;
      doc.fillColor('#000000');
      
      // Übersicht Section
      drawSectionHeader('ÜBERSICHT');
      doc.fontSize(10).font('Helvetica');
      
      if (uebersicht.eventName) addField('Event Name', uebersicht.eventName);
      if (uebersicht.date) addField('Datum', uebersicht.date);
      if (uebersicht.eventType) {
        const eventTypeMap = { 'club': 'Club', 'konzert': 'Konzert', 'einmietung': 'Einmietung', 'andere': 'Andere' };
        addField('Event Typ', eventTypeMap[uebersicht.eventType] || uebersicht.eventType);
      }
      if (uebersicht.nightLead) addField('Night Lead', uebersicht.nightLead);
      if (uebersicht.nightlinerParkplatz) {
        addField('Nightliner Parkplatz', uebersicht.nightlinerParkplatz === 'yes' ? 'Ja' : 'Nein');
      }
      
      // Time information in a table
      const timeData = [];
      if (uebersicht.getInTime || uebersicht.getInTatsachlich) {
        timeData.push({
          label: 'Get In',
          geplant: uebersicht.getInTime || '-',
          tatsachlich: uebersicht.getInTatsachlich || '-'
        });
      }
      if (uebersicht.doorsTime || uebersicht.doorsTatsachlich) {
        timeData.push({
          label: 'Doors',
          geplant: uebersicht.doorsTime || '-',
          tatsachlich: uebersicht.doorsTatsachlich || '-'
        });
      }
      if (uebersicht.konzertende || uebersicht.konzertendeTatsachlich) {
        timeData.push({
          label: 'Konzertende',
          geplant: uebersicht.konzertende || '-',
          tatsachlich: uebersicht.konzertendeTatsachlich || '-'
        });
      }
      if (uebersicht.backstageCurfew || uebersicht.backstageCurfewTatsachlich) {
        timeData.push({
          label: 'Backstage Curfew',
          geplant: uebersicht.backstageCurfew || '-',
          tatsachlich: uebersicht.backstageCurfewTatsachlich || '-'
        });
      }
      
      if (timeData.length > 0) {
        doc.moveDown(0.3);
        addTableRow(['Zeitpunkt', 'Geplant', 'Tatsächlich'], true);
        timeData.forEach(row => {
          addTableRow([row.label, row.geplant, row.tatsachlich]);
        });
      }
      
      if (uebersicht.travelPartyGetIn) addField('Travel Party Get In', uebersicht.travelPartyGetIn);
      if (uebersicht.travelPartyTatsachlich) addField('Travel Party Tatsächlich', uebersicht.travelPartyTatsachlich);
      
      if (uebersicht.agentur) addField('Agentur', uebersicht.agentur);
      if (uebersicht.agenturAPName) addField('Agentur AP Name', uebersicht.agenturAPName);
      if (uebersicht.veranstalterName) addField('Veranstalter Name', uebersicht.veranstalterName);
      if (uebersicht.veranstalterAPName) addField('Veranstalter AP Name', uebersicht.veranstalterAPName);
      if (uebersicht.companyName) addField('Company Name', uebersicht.companyName);
      if (uebersicht.vva) addField('VVA', uebersicht.vva);
      
      // Hospitality Section
      const riderExtras = formData['rider-extras'] || {};
      drawSectionHeader('HOSPITALITY');
      doc.fontSize(10).font('Helvetica');
      
      if (riderExtras.getInCatering) {
        const cateringMap = { 
          'no': 'Nein', 
          'kalt': 'Kalt',
          'nur-snacks': 'Nur Snacks',
          'warm': 'Warm', 
          'buyout': 'Buyout' 
        };
        addField('Get In Catering', cateringMap[riderExtras.getInCatering] || riderExtras.getInCatering);
      }
      if (riderExtras.dinner) {
        const dinnerMap = { 'no': 'Nein', 'warm': 'Warm', 'buyout': 'Buyout' };
        addField('Dinner', dinnerMap[riderExtras.dinner] || riderExtras.dinner);
      }
      if (riderExtras.buyoutProvider) addField('Buyout Provider', riderExtras.buyoutProvider);
      if (riderExtras.buyoutGroups && riderExtras.buyoutGroups.length > 0) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Buyout Gruppen:', 50, doc.y);
        doc.moveDown(0.3);
        addTableRow(['Gruppe', 'Personen', 'Pro Person'], true);
        riderExtras.buyoutGroups.forEach((group, idx) => {
          if (group.people || group.perPerson) {
            addTableRow([
              `Gruppe ${idx + 1}`,
              String(group.people || 0),
              `€${group.perPerson || '0.00'}`
            ]);
          }
        });
        doc.font('Helvetica');
      }
      
      if (riderExtras.standardbestueckung) {
        const bestueckungMap = {
          'leer': 'Leer',
          'abgeschlossen': 'Abgeschlossen',
          'standard-konzert': 'Standard Konzert',
          'standard-tranzit': 'Standard Tranzit'
        };
        addField('Backstage Kühlschrank', bestueckungMap[riderExtras.standardbestueckung] || riderExtras.standardbestueckung);
        
        // Fridge items table
        if (riderExtras.customizedFridgeItems && riderExtras.customizedFridgeItems.length > 0) {
          doc.moveDown(0.3);
          doc.font('Helvetica-Bold').text('Kühlschrank Items:', 50, doc.y);
          doc.moveDown(0.3);
          addTableRow(['Item', 'Menge', 'Preis'], true);
          riderExtras.customizedFridgeItems.forEach(item => {
            if (item.name) {
              let price = '';
              if (item.price !== undefined && item.price !== null && item.price !== '') {
                let priceNum;
                if (typeof item.price === 'number' && !isNaN(item.price)) {
                  priceNum = item.price;
                } else {
                  priceNum = parseFloat(String(item.price));
                  if (isNaN(priceNum) || !isFinite(priceNum)) {
                    priceNum = 0;
                  }
                }
                if (typeof priceNum === 'number' && !isNaN(priceNum) && isFinite(priceNum)) {
                  price = `€${priceNum.toFixed(2)}`;
                }
              }
              addTableRow([
                item.name,
                String(item.amount || '-'),
                price || '-'
              ]);
            }
          });
          doc.font('Helvetica');
        } else if (riderExtras.standardbestueckung === 'standard-konzert' || riderExtras.standardbestueckung === 'standard-tranzit') {
          doc.moveDown(0.3);
          doc.fillColor('#999999').text('(Keine Items hinzugefügt)', 50, doc.y);
          doc.fillColor('#000000');
        }
      }
      
      // Extras items table
      if (riderExtras.items && riderExtras.items.length > 0) {
        const extrasItems = riderExtras.items.filter(item => item.text && item.text.trim());
        if (extrasItems.length > 0) {
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').text('Extras:', 50, doc.y);
          doc.moveDown(0.3);
          addTableRow(['Item', 'Menge', 'Preis', 'Rabatt', 'Status'], true);
          extrasItems.forEach(item => {
            let price = '';
            if (item.price !== undefined && item.price !== null && item.price !== '') {
              let priceNum;
              if (typeof item.price === 'number' && !isNaN(item.price)) {
                priceNum = item.price;
              } else {
                priceNum = parseFloat(String(item.price));
                if (isNaN(priceNum) || !isFinite(priceNum)) {
                  priceNum = 0;
                }
              }
              if (typeof priceNum === 'number' && !isNaN(priceNum) && isFinite(priceNum)) {
                price = `€${priceNum.toFixed(2)}`;
              }
            }
            const discountMap = { '50': '50%', '75': '75%', '100': '100%', 'EK': 'EK' };
            const discount = item.discount ? (discountMap[item.discount] || item.discount) : '-';
            const status = item.checked ? '✓ Eingebongt' : '-';
            addTableRow([
              item.text,
              String(item.amount || '-'),
              price || '-',
              discount,
              status
            ]);
          });
          doc.font('Helvetica');
        }
      }
      
      if (riderExtras.notes) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Notizen:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica')
          .fillColor('#333333')
          .text(riderExtras.notes, 50, doc.y, { width: 495, align: 'left' });
        doc.fillColor('#000000');
      }
      
      // Ton/Lichttechnik Section
      const tontechniker = formData.tontechniker || {};
      drawSectionHeader('TON/LICHTTECHNIK');
      doc.fontSize(10).font('Helvetica');
      
      if (tontechniker.soundEngineerEnabled !== false) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Sound Engineer:', 50, doc.y);
        doc.moveDown(0.3);
        if (tontechniker.soundEngineerName) addField('Name', tontechniker.soundEngineerName, 20);
        if (tontechniker.soundEngineerStartTime) addField('Start', tontechniker.soundEngineerStartTime, 20);
        if (tontechniker.soundEngineerEndTime) addField('Ende', tontechniker.soundEngineerEndTime, 20);
      }
      
      if (tontechniker.lightingTechEnabled === true) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Lighting Tech:', 50, doc.y);
        doc.moveDown(0.3);
        if (tontechniker.lightingTechName) addField('Name', tontechniker.lightingTechName, 20);
        if (tontechniker.lightingTechStartTime) addField('Start', tontechniker.lightingTechStartTime, 20);
        if (tontechniker.lightingTechEndTime) addField('Ende', tontechniker.lightingTechEndTime, 20);
      }
      
      // Secu Section
      const secu = formData.secu || {};
      if (secu.securityPersonnel && secu.securityPersonnel.length > 0) {
        drawSectionHeader('SECU');
        doc.fontSize(10).font('Helvetica');
        doc.moveDown(0.3);
        addTableRow(['Name', 'Start', 'Ende'], true);
        secu.securityPersonnel.forEach((person) => {
          if (person.name || person.startTime || person.endTime) {
            addTableRow([
              person.name || '-',
              person.startTime || '-',
              person.endTime || '-'
            ]);
          }
        });
      }
      
      // Orderbird Section
      const orderbird = formData.orderbird || {};
      drawSectionHeader('ORDERBIRD');
      doc.fontSize(10).font('Helvetica');
      
      const orderbirdItems = [];
      if (orderbird.zBericht) orderbirdItems.push('Z Bericht');
      if (orderbird.benutzerberichte) orderbirdItems.push('Benutzerberichte');
      if (orderbird.veranstalter1) orderbirdItems.push('Veranstalter 1');
      if (orderbird.veranstalter2) orderbirdItems.push('Veranstalter 2');
      if (orderbird.veranstalter3) orderbirdItems.push('Veranstalter 3');
      if (orderbird.agentur) orderbirdItems.push('Agentur');
      if (orderbird.persoBeleg) orderbirdItems.push('Perso Beleg');
      if (orderbird.sonstige) orderbirdItems.push('Sonstige');
      
      if (orderbirdItems.length > 0) {
        orderbirdItems.forEach(item => {
          doc.fillColor('#27ae60')
            .text('✓ ', 50, doc.y)
            .fillColor('#000000')
            .text(item, 60, doc.y);
          doc.moveDown(0.4);
        });
      }
      
      // Gäste Section
      const gaeste = formData.gaeste || {};
      drawSectionHeader('GÄSTE');
      doc.fontSize(10).font('Helvetica');
      
      if (gaeste.paymentType) {
        const paymentMap = { 'selbstzahler': 'Selbstzahler', 'pauschale': 'Pauschale' };
        addField('Zahlungsart', paymentMap[gaeste.paymentType] || gaeste.paymentType);
      }
      
      if (gaeste.paymentType === 'pauschale' && gaeste.pauschaleOptions) {
        const options = [];
        if (gaeste.pauschaleOptions.standard) options.push('Standard');
        if (gaeste.pauschaleOptions.longdrinks) options.push('Longdrinks');
        if (gaeste.pauschaleOptions.sektCocktails) options.push('Sekt-Cocktails');
        if (gaeste.pauschaleOptions.shots) options.push('Shots');
        if (options.length > 0) {
          addField('Pauschale Optionen', options.join(', '));
        }
      }
      
      if (gaeste.anzahlAbendkasse || gaeste.betragAbendkasse || gaeste.gaesteGesamt) {
        doc.moveDown(0.3);
        addTableRow(['Kategorie', 'Wert'], true);
        if (gaeste.anzahlAbendkasse) {
          addTableRow(['Anzahl Abendkasse', String(gaeste.anzahlAbendkasse)]);
        }
        if (gaeste.betragAbendkasse) {
          addTableRow(['Betrag Abendkasse', `€${gaeste.betragAbendkasse}`]);
        }
        if (gaeste.anzahlAbendkasse && gaeste.betragAbendkasse) {
          const total = (parseFloat(gaeste.anzahlAbendkasse) * parseFloat(gaeste.betragAbendkasse)).toFixed(2);
          doc.fillColor('#2c3e50')
            .font('Helvetica-Bold')
            .text('Total:', 50, doc.y + 5)
            .text(`€${total}`, 200, doc.y - 5, { width: 345 });
          doc.fillColor('#000000');
          doc.y += 18;
        }
        if (gaeste.gaesteGesamt) {
          addTableRow(['Gäste Gesamt', String(gaeste.gaesteGesamt)]);
        }
      }
      
      // Footer
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      const footerY = pageHeight - 50;
      
      doc.fillColor('#95a5a6')
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`,
          50,
          footerY,
          { align: 'center', width: 495 }
        );
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReportPDF };
