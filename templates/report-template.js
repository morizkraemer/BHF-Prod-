// This script populates the HTML template with data
(function() {
    if (!window.reportData) {
        console.error('No report data provided');
        return;
    }

    const data = window.reportData;
    const uebersicht = data.uebersicht || {};
    const riderExtras = data['rider-extras'] || {};
    const tontechniker = data.tontechniker || {};
    const secu = data.secu || {};
    const orderbird = data.orderbird || {};
    const gaeste = data.gaeste || {};

    // Helper function to create field row
    function createFieldRow(label, value) {
        if (value === undefined || value === null || value === '') return '';
        return `
            <div class="field-row">
                <span class="field-label">${escapeHtml(label)}:</span>
                <span class="field-value">${escapeHtml(String(value))}</span>
            </div>
        `;
    }

    // Helper to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to calculate duration between two times (HH:MM format)
    function calculateDuration(startTime, endTime) {
        if (!startTime || !endTime || startTime === '-' || endTime === '-') {
            return '-';
        }

        try {
            // Parse time strings (HH:MM format)
            const parseTime = (timeStr) => {
                const parts = timeStr.split(':');
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1] || 0, 10);
                return hours * 60 + minutes; // Convert to total minutes
            };

            const start = parseTime(startTime);
            let end = parseTime(endTime);

            // Handle next day (e.g., 00:00 means next day)
            if (end < start) {
                end += 24 * 60; // Add 24 hours
            }

            const durationMinutes = end - start;
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;

            return `${hours}:${minutes.toString().padStart(2, '0')}`;
        } catch (e) {
            return '-';
        }
    }

    // Header
    if (uebersicht.eventName) {
        document.getElementById('event-name').textContent = uebersicht.eventName;
    }
    if (uebersicht.date) {
        document.getElementById('event-date').textContent = uebersicht.date;
    }

    // Übersicht Fields
    if (uebersicht.eventName) {
        document.getElementById('field-event-name').innerHTML = createFieldRow('Event Name', uebersicht.eventName);
    }
    if (uebersicht.date) {
        document.getElementById('field-date').innerHTML = createFieldRow('Datum', uebersicht.date);
    }
    if (uebersicht.eventType) {
        const eventTypeMap = { 'club': 'Club', 'konzert': 'Konzert', 'einmietung': 'Einmietung', 'andere': 'Andere' };
        document.getElementById('field-event-type').innerHTML = createFieldRow('Event Typ', eventTypeMap[uebersicht.eventType] || uebersicht.eventType);
    }
    if (uebersicht.nightLead) {
        document.getElementById('field-night-lead').innerHTML = createFieldRow('Night Lead', uebersicht.nightLead);
    }

    // Time fields - all separate
    if (uebersicht.getInTime) {
        document.getElementById('field-getin-geplant').innerHTML = createFieldRow('Get In Geplant', uebersicht.getInTime);
    }
    if (uebersicht.getInTatsachlich) {
        document.getElementById('field-getin-tatsachlich').innerHTML = createFieldRow('Get In Tatsächlich', uebersicht.getInTatsachlich);
    }

    if (uebersicht.doorsTime) {
        document.getElementById('field-doors-geplant').innerHTML = createFieldRow('Doors Geplant', uebersicht.doorsTime);
    }
    if (uebersicht.doorsTatsachlich) {
        document.getElementById('field-doors-tatsachlich').innerHTML = createFieldRow('Doors Tatsächlich', uebersicht.doorsTatsachlich);
    }

    if (uebersicht.konzertende) {
        document.getElementById('field-konzertende-geplant').innerHTML = createFieldRow('Konzertende Geplant', uebersicht.konzertende);
    }
    if (uebersicht.konzertendeTatsachlich) {
        document.getElementById('field-konzertende-tatsachlich').innerHTML = createFieldRow('Konzertende Tatsächlich', uebersicht.konzertendeTatsachlich);
    }

    if (uebersicht.backstageCurfew) {
        document.getElementById('field-backstage-curfew-geplant').innerHTML = createFieldRow('Backstage Curfew Geplant', uebersicht.backstageCurfew);
    }
    if (uebersicht.backstageCurfewTatsachlich) {
        document.getElementById('field-backstage-curfew-tatsachlich').innerHTML = createFieldRow('Backstage Curfew Tatsächlich', uebersicht.backstageCurfewTatsachlich);
    }

    if (uebersicht.agentur) {
        document.getElementById('field-agentur').innerHTML = createFieldRow('Agentur', uebersicht.agentur);
    }
    if (uebersicht.agenturAPName) {
        document.getElementById('field-agentur-ap').innerHTML = createFieldRow('Agentur AP Name', uebersicht.agenturAPName);
    }
    if (uebersicht.veranstalterName) {
        document.getElementById('field-veranstalter-name').innerHTML = createFieldRow('Veranstalter Name', uebersicht.veranstalterName);
    }
    if (uebersicht.veranstalterAPName) {
        document.getElementById('field-veranstalter-ap').innerHTML = createFieldRow('Veranstalter AP Name', uebersicht.veranstalterAPName);
    }
    if (uebersicht.companyName) {
        document.getElementById('field-company-name').innerHTML = createFieldRow('Company Name', uebersicht.companyName);
    }
    if (uebersicht.vva) {
        document.getElementById('field-vva').innerHTML = createFieldRow('VVA', uebersicht.vva);
    }

    // Positionen
    if (uebersicht.positionen && uebersicht.positionen.length > 0) {
        let positionenHtml = '<div class="table-container"><table><thead><tr><th>Name</th><th>Position</th><th>Funkgerät</th><th>Zurückgegeben</th></tr></thead><tbody>';
        uebersicht.positionen.forEach(position => {
            if (position.name) {
                const returned = position.returned ? 'Ja' : 'Nein';
                positionenHtml += `<tr><td>${escapeHtml(position.name || '-')}</td><td>${escapeHtml(position.position || '-')}</td><td>${escapeHtml(position.funkgerat || '-')}</td><td>${escapeHtml(returned)}</td></tr>`;
            }
        });
        positionenHtml += '</tbody></table></div>';
        document.getElementById('positionen-table-container').innerHTML = positionenHtml;
    }

    // Übersicht Notes
    if (uebersicht.notes) {
        document.getElementById('uebersicht-notes-container').innerHTML = `
            <div class="notes-container">
                <div class="notes-label">Notizen:</div>
                <div class="notes-content">${escapeHtml(uebersicht.notes)}</div>
            </div>
        `;
    }

    // Hospitality
    // Travel Party (stored in uebersicht but displayed in Hospitality section)
    if (uebersicht.travelPartyGetIn) {
        document.getElementById('field-travel-party-getin-hospitality').innerHTML = createFieldRow('Travel Party Get In', uebersicht.travelPartyGetIn);
    }
    if (uebersicht.travelPartyTatsachlich) {
        document.getElementById('field-travel-party-tatsachlich-hospitality').innerHTML = createFieldRow('Travel Party Tatsächlich', uebersicht.travelPartyTatsachlich);
    }
    // Nightliner Parkplatz (stored in uebersicht but displayed in Hospitality section)
    if (uebersicht.nightlinerParkplatz) {
        document.getElementById('field-nightliner-hospitality').innerHTML = createFieldRow('Nightliner Parkplatz', uebersicht.nightlinerParkplatz === 'yes' ? 'Ja' : 'Nein');
    }
    
    if (riderExtras.getInCatering) {
        const cateringMap = { 'no': 'Nein', 'kalt': 'Kalt', 'nur-snacks': 'Nur Snacks', 'warm': 'Warm', 'buyout': 'Buyout' };
        document.getElementById('field-getin-catering').innerHTML = createFieldRow('Get In Catering', cateringMap[riderExtras.getInCatering] || riderExtras.getInCatering);
        
        // Calculate catering sum if warm, cold, or snacks catering is selected
        if ((riderExtras.getInCatering === 'warm' || riderExtras.getInCatering === 'kalt' || riderExtras.getInCatering === 'nur-snacks') && uebersicht.travelPartyGetIn) {
            const cateringPrices = data.cateringPrices || {};
            const travelParty = parseFloat(uebersicht.travelPartyGetIn) || 0;
            let pricePerPerson = 0;
            
            if (riderExtras.getInCatering === 'warm' && cateringPrices.warmPerPerson) {
                pricePerPerson = parseFloat(cateringPrices.warmPerPerson) || 0;
            } else if (riderExtras.getInCatering === 'kalt' && cateringPrices.coldPerPerson) {
                pricePerPerson = parseFloat(cateringPrices.coldPerPerson) || 0;
            } else if (riderExtras.getInCatering === 'nur-snacks' && cateringPrices.snacksPerPerson) {
                pricePerPerson = parseFloat(cateringPrices.snacksPerPerson) || 0;
            }
            
            if (pricePerPerson > 0 && travelParty > 0) {
                const total = (travelParty * pricePerPerson).toFixed(2);
                document.getElementById('field-catering-sum').innerHTML = createFieldRow('Catering Summe', `€${total} (${travelParty} × €${pricePerPerson.toFixed(2)})`);
            }
        }
    }
    if (riderExtras.dinner) {
        const dinnerMap = { 'no': 'Nein', 'warm': 'Warm', 'buyout': 'Buyout', 'caterer': 'Caterer' };
        let dinnerValue = dinnerMap[riderExtras.dinner] || riderExtras.dinner;
        
        // Add disclaimer for caterer option only
        if (riderExtras.dinner === 'caterer') {
            dinnerValue += ' <span style="color: #e74c3c; font-style: italic;">(Nicht Standard)</span>';
        }
        
        document.getElementById('field-dinner').innerHTML = createFieldRow('Dinner', dinnerValue);
        
        // Calculate warm catering sum for dinner when warm option is selected
        if (riderExtras.dinner === 'warm' && uebersicht.travelPartyGetIn) {
            const cateringPrices = data.cateringPrices || {};
            const travelParty = parseFloat(uebersicht.travelPartyGetIn) || 0;
            let pricePerPerson = 0;
            
            if (cateringPrices.warmPerPerson) {
                pricePerPerson = parseFloat(cateringPrices.warmPerPerson) || 0;
            }
            
            if (pricePerPerson > 0 && travelParty > 0) {
                const total = (travelParty * pricePerPerson).toFixed(2);
                document.getElementById('field-dinner-catering-sum').innerHTML = createFieldRow('Dinner Catering Summe', `€${total} (${travelParty} × €${pricePerPerson.toFixed(2)})`);
            }
        }
    }
    if (riderExtras.buyoutProvider) {
        document.getElementById('field-buyout-provider').innerHTML = createFieldRow('Buyout Provider', riderExtras.buyoutProvider);
    }

    // Buyout Groups
    if (riderExtras.buyoutGroups && riderExtras.buyoutGroups.length > 0) {
        let buyoutHtml = '<div class="subsection-header">Buyout Gruppen:</div><div class="table-container"><table><thead><tr><th>Gruppe</th><th>Personen</th><th>Pro Person</th></tr></thead><tbody>';
        riderExtras.buyoutGroups.forEach((group, idx) => {
            if (group.people || group.perPerson) {
                buyoutHtml += `<tr><td>Gruppe ${idx + 1}</td><td>${escapeHtml(String(group.people || 0))}</td><td>€${escapeHtml(String(group.perPerson || '0.00'))}</td></tr>`;
            }
        });
        buyoutHtml += '</tbody></table></div>';
        document.getElementById('buyout-groups-container').innerHTML = buyoutHtml;
    }

    // Backstage Kühlschrank
    if (riderExtras.standardbestueckung) {
        const bestueckungMap = {
            'leer': 'Leer',
            'abgeschlossen': 'Abgeschlossen',
            'standard-konzert': 'Standard Konzert',
            'standard-tranzit': 'Standard Tranzit'
        };
        let bestueckungValue = bestueckungMap[riderExtras.standardbestueckung] || riderExtras.standardbestueckung;
        if (riderExtras.standardbestueckungTotalPrice) {
            const totalPrice = parseFloat(riderExtras.standardbestueckungTotalPrice);
            if (!isNaN(totalPrice) && totalPrice > 0) {
                bestueckungValue += ` (Gesamtpreis: €${totalPrice.toFixed(2)})`;
            }
        }
        document.getElementById('field-backstage-kuehlschrank').innerHTML = createFieldRow('Backstage Kühlschrank', bestueckungValue);

        // Fridge Items
        if (riderExtras.customizedFridgeItems && riderExtras.customizedFridgeItems.length > 0) {
            let fridgeHtml = '<div class="subsection-header">Kühlschrank Items:</div><div class="table-container"><table><thead><tr><th>Item</th><th>Menge</th><th>Preis</th></tr></thead><tbody>';
            riderExtras.customizedFridgeItems.forEach(item => {
                if (item.name) {
                    let price = '-';
                    if (item.price !== undefined && item.price !== null && item.price !== '') {
                        const priceNum = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
                        if (!isNaN(priceNum) && isFinite(priceNum)) {
                            price = `€${priceNum.toFixed(2)}`;
                        }
                    }
                    fridgeHtml += `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(String(item.amount || '-'))}</td><td>${escapeHtml(price)}</td></tr>`;
                }
            });
            fridgeHtml += '</tbody></table></div>';
            document.getElementById('fridge-items-container').innerHTML = fridgeHtml;
        } else if (riderExtras.standardbestueckung === 'standard-konzert' || riderExtras.standardbestueckung === 'standard-tranzit') {
            document.getElementById('fridge-items-container').innerHTML = '<div class="empty-state">(Keine Items hinzugefügt)</div>';
        }
    }

    // Extras
    if (riderExtras.items && riderExtras.items.length > 0) {
        const extrasItems = riderExtras.items.filter(item => item.text && item.text.trim());
        if (extrasItems.length > 0) {
            let extrasHtml = '<div class="subsection-header">Extras:</div><div class="table-container"><table><thead><tr><th>Item</th><th>Menge</th><th>Preis</th><th>Rabatt</th><th>Status</th></tr></thead><tbody>';
            extrasItems.forEach(item => {
                let price = '-';
                if (item.price !== undefined && item.price !== null && item.price !== '') {
                    const priceNum = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
                    if (!isNaN(priceNum) && isFinite(priceNum)) {
                        price = `€${priceNum.toFixed(2)}`;
                    }
                }
                const discountMap = { '50': '50%', '75': '75%', '100': '100%', 'EK': 'EK' };
                const discount = item.discount ? (discountMap[item.discount] || item.discount) : '-';
                const status = item.checked ? '✓ Eingebongt' : '-';
                extrasHtml += `<tr><td>${escapeHtml(item.text)}</td><td>${escapeHtml(String(item.amount || '-'))}</td><td>${escapeHtml(price)}</td><td>${escapeHtml(discount)}</td><td>${escapeHtml(status)}</td></tr>`;
            });
            extrasHtml += '</tbody></table></div>';
            document.getElementById('extras-container').innerHTML = extrasHtml;
        }
    }

    // Notes
    if (riderExtras.notes) {
        document.getElementById('notes-container').innerHTML = `
            <div class="notes-container">
                <div class="notes-label">Notizen:</div>
                <div class="notes-content">${escapeHtml(riderExtras.notes)}</div>
            </div>
        `;
    }

    // Ton/Lichttechnik
    if (tontechniker.soundEngineerEnabled !== false) {
        let soundHtml = '<div class="subsection-header">Sound Engineer:</div>';
        if (tontechniker.soundEngineerName) soundHtml += createFieldRow('Name', tontechniker.soundEngineerName);
        if (tontechniker.soundEngineerStartTime) soundHtml += createFieldRow('Start', tontechniker.soundEngineerStartTime);
        if (tontechniker.soundEngineerEndTime) soundHtml += createFieldRow('Ende', tontechniker.soundEngineerEndTime);
        const duration = calculateDuration(tontechniker.soundEngineerStartTime, tontechniker.soundEngineerEndTime);
        if (duration !== '-') {
            soundHtml += createFieldRow('Dauer', duration);
        }
        document.getElementById('sound-engineer-container').innerHTML = soundHtml;
    }

    if (tontechniker.lightingTechEnabled === true) {
        let lightingHtml = '<div class="subsection-header">Lighting Tech:</div>';
        if (tontechniker.lightingTechName) lightingHtml += createFieldRow('Name', tontechniker.lightingTechName);
        if (tontechniker.lightingTechStartTime) lightingHtml += createFieldRow('Start', tontechniker.lightingTechStartTime);
        if (tontechniker.lightingTechEndTime) lightingHtml += createFieldRow('Ende', tontechniker.lightingTechEndTime);
        const duration = calculateDuration(tontechniker.lightingTechStartTime, tontechniker.lightingTechEndTime);
        if (duration !== '-') {
            lightingHtml += createFieldRow('Dauer', duration);
        }
        document.getElementById('lighting-tech-container').innerHTML = lightingHtml;
    }

    // Secu
    if (secu.securityPersonnel && secu.securityPersonnel.length > 0) {
        let secuHtml = '<div class="table-container"><table><thead><tr><th>Name</th><th>Start</th><th>Ende</th><th>Dauer</th></tr></thead><tbody>';
        secu.securityPersonnel.forEach(person => {
            if (person.name || person.startTime || person.endTime) {
                const duration = calculateDuration(person.startTime, person.endTime);
                secuHtml += `<tr><td>${escapeHtml(person.name || '-')}</td><td>${escapeHtml(person.startTime || '-')}</td><td>${escapeHtml(person.endTime || '-')}</td><td>${escapeHtml(duration)}</td></tr>`;
            }
        });
        secuHtml += '</tbody></table></div>';
        document.getElementById('secu-table-container').innerHTML = secuHtml;
    } else {
        document.getElementById('secu-section').style.display = 'none';
    }

    // Andere Mitarbeiter
    const andereMitarbeiter = data['andere-mitarbeiter'] || {};
    if (andereMitarbeiter.mitarbeiter && andereMitarbeiter.mitarbeiter.length > 0) {
        let andereMitarbeiterHtml = '<div class="table-container"><table><thead><tr><th>Name</th><th>Start</th><th>Ende</th><th>Dauer</th><th>Kategorie</th></tr></thead><tbody>';
        andereMitarbeiter.mitarbeiter.forEach(person => {
            if (person.name || person.startTime || person.endTime || person.category) {
                const duration = calculateDuration(person.startTime, person.endTime);
                andereMitarbeiterHtml += `<tr><td>${escapeHtml(person.name || '-')}</td><td>${escapeHtml(person.startTime || '-')}</td><td>${escapeHtml(person.endTime || '-')}</td><td>${escapeHtml(duration)}</td><td>${escapeHtml(person.category || '-')}</td></tr>`;
            }
        });
        andereMitarbeiterHtml += '</tbody></table></div>';
        document.getElementById('andere-mitarbeiter-table-container').innerHTML = andereMitarbeiterHtml;
    } else {
        document.getElementById('andere-mitarbeiter-section').style.display = 'none';
    }

    // Orderbird
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
        let orderbirdHtml = '<ul class="checkmark-list">';
        orderbirdItems.forEach(item => {
            orderbirdHtml += `<li>${escapeHtml(item)}</li>`;
        });
        orderbirdHtml += '</ul>';
        document.getElementById('orderbird-container').innerHTML = orderbirdHtml;
    }

    // Gäste
    if (gaeste.paymentType) {
        const paymentMap = { 'selbstzahler': 'Selbstzahler', 'pauschale': 'Pauschale' };
        document.getElementById('field-payment-type').innerHTML = createFieldRow('Zahlungsart', paymentMap[gaeste.paymentType] || gaeste.paymentType);
    }

    if (gaeste.paymentType === 'pauschale' && gaeste.pauschaleOptions) {
        const options = [];
        if (gaeste.pauschaleOptions.standard) options.push('Standard');
        if (gaeste.pauschaleOptions.longdrinks) options.push('Longdrinks');
        if (gaeste.pauschaleOptions.sektCocktails) options.push('Sekt-Cocktails');
        if (gaeste.pauschaleOptions.shots) options.push('Shots');
        if (options.length > 0) {
            document.getElementById('field-pauschale-options').innerHTML = createFieldRow('Pauschale Optionen', options.join(', '));
        }
    }

    if (gaeste.anzahlAbendkasse || gaeste.betragAbendkasse || gaeste.gaesteGesamt) {
        let gaesteHtml = '<div class="table-container"><table><thead><tr><th>Kategorie</th><th>Wert</th></tr></thead><tbody>';
        if (gaeste.anzahlAbendkasse) {
            gaesteHtml += `<tr><td>Anzahl Abendkasse</td><td>${escapeHtml(String(gaeste.anzahlAbendkasse))}</td></tr>`;
        }
        if (gaeste.betragAbendkasse) {
            gaesteHtml += `<tr><td>Betrag Abendkasse</td><td>€${escapeHtml(String(gaeste.betragAbendkasse))}</td></tr>`;
        }
        if (gaeste.anzahlAbendkasse && gaeste.betragAbendkasse) {
            const total = (parseFloat(gaeste.anzahlAbendkasse) * parseFloat(gaeste.betragAbendkasse)).toFixed(2);
            gaesteHtml += `<tr class="total-row"><td>Total:</td><td>€${escapeHtml(total)}</td></tr>`;
        }
        if (gaeste.gaesteGesamt) {
            gaesteHtml += `<tr><td>Gäste Gesamt</td><td>${escapeHtml(String(gaeste.gaesteGesamt))}</td></tr>`;
        }
        gaesteHtml += '</tbody></table></div>';
        document.getElementById('gaeste-table-container').innerHTML = gaesteHtml;
    }

    // Shift Notes and Missing Fields
    const shiftNotes = data.shiftNotes || {};
    const itemsArray = [];
    
    // Missing Fields - VVA
    if (shiftNotes.vvaMissingFields && Array.isArray(shiftNotes.vvaMissingFields) && shiftNotes.vvaMissingFields.length > 0) {
        const fieldsBySection = {};
        shiftNotes.vvaMissingFields.forEach(err => {
            if (!fieldsBySection[err.section]) {
                fieldsBySection[err.section] = [];
            }
            fieldsBySection[err.section].push(err.field);
        });
        
        let fieldsText = '';
        Object.entries(fieldsBySection).forEach(([section, fields]) => {
            fieldsText += `${section}: ${fields.join(', ')}\n`;
        });
        
        itemsArray.push({
            title: 'VVA Fehlende Felder',
            content: fieldsText.trim(),
            note: shiftNotes.vvaMissingFieldsNote
        });
    } else if (shiftNotes.vvaMissingFieldsNote) {
        itemsArray.push({
            title: 'VVA Notiz',
            content: null,
            note: shiftNotes.vvaMissingFieldsNote
        });
    }
    
    // Missing Fields - SL
    if (shiftNotes.slMissingFields && Array.isArray(shiftNotes.slMissingFields) && shiftNotes.slMissingFields.length > 0) {
        const fieldsBySection = {};
        shiftNotes.slMissingFields.forEach(err => {
            if (!fieldsBySection[err.section]) {
                fieldsBySection[err.section] = [];
            }
            fieldsBySection[err.section].push(err.field);
        });
        
        let fieldsText = '';
        Object.entries(fieldsBySection).forEach(([section, fields]) => {
            fieldsText += `${section}: ${fields.join(', ')}\n`;
        });
        
        itemsArray.push({
            title: 'SL Fehlende Felder',
            content: fieldsText.trim(),
            note: shiftNotes.slMissingFieldsNote
        });
    } else if (shiftNotes.slMissingFieldsNote) {
        itemsArray.push({
            title: 'SL Notiz',
            content: null,
            note: shiftNotes.slMissingFieldsNote
        });
    }
    
    // Other notes
    if (shiftNotes.vvaConfirmationNote) {
        itemsArray.push({
            title: 'VVA Bestätigung Notiz',
            content: null,
            note: shiftNotes.vvaConfirmationNote
        });
    }
    
    if (shiftNotes.closeShiftConfirmationNote) {
        itemsArray.push({
            title: 'Shift Beendung Notiz',
            content: null,
            note: shiftNotes.closeShiftConfirmationNote
        });
    }
    
    if (itemsArray.length > 0) {
        let notesHtml = '';
        itemsArray.forEach(item => {
            notesHtml += `
                <div class="shift-note-item">
                    <div class="shift-note-title">${escapeHtml(item.title)}:</div>
                    ${item.content ? `<div class="shift-note-fields">${escapeHtml(item.content).replace(/\n/g, '<br>')}</div>` : ''}
                    ${item.note ? `<div class="shift-note-content">${escapeHtml(item.note).replace(/\n/g, '<br>')}</div>` : ''}
                </div>
            `;
        });
        document.getElementById('shift-notes-container').innerHTML = notesHtml;
    } else {
        document.getElementById('shift-notes-section').style.display = 'none';
    }
})();

