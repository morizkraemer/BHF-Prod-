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
    const gaeste = data.gaeste || {};
    
    // Debug: Log settings data to verify it's being passed
    console.log('Catering Prices:', data.cateringPrices);
    console.log('Bestueckung Total Prices:', data.bestueckungTotalPrices);

    // Helper function to create field row
    function createFieldRow(label, value) {
        // Always show field, use '-' if value is empty
        const displayValue = (value === undefined || value === null || value === '') ? '-' : String(value);
        return `
            <div class="field-row">
                <span class="field-label">${escapeHtml(label)}:</span>
                <span class="field-value">${escapeHtml(displayValue)}</span>
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

    // Übersicht Fields - always show all fields
    const eventTypeMap = { 'club': 'Club', 'konzert': 'Konzert', 'einmietung': 'Einmietung', 'andere': 'Andere' };
    document.getElementById('field-event-name').innerHTML = createFieldRow('Event Name', uebersicht.eventName);
    document.getElementById('field-date').innerHTML = createFieldRow('Datum', uebersicht.date);
    document.getElementById('field-event-type').innerHTML = createFieldRow('Event Typ', eventTypeMap[uebersicht.eventType] || uebersicht.eventType);
    document.getElementById('field-night-lead').innerHTML = createFieldRow('Night Lead', uebersicht.nightLead);

    // Time fields - all separate, always show
    document.getElementById('field-getin-geplant').innerHTML = createFieldRow('Get In Geplant', uebersicht.getInTime);
    document.getElementById('field-getin-tatsachlich').innerHTML = createFieldRow('Get In Tatsächlich', uebersicht.getInTatsachlich);
    document.getElementById('field-doors-geplant').innerHTML = createFieldRow('Doors Geplant', uebersicht.doorsTime);
    document.getElementById('field-doors-tatsachlich').innerHTML = createFieldRow('Doors Tatsächlich', uebersicht.doorsTatsachlich);
    document.getElementById('field-konzertende-geplant').innerHTML = createFieldRow('Konzertende Geplant', uebersicht.konzertende);
    document.getElementById('field-konzertende-tatsachlich').innerHTML = createFieldRow('Konzertende Tatsächlich', uebersicht.konzertendeTatsachlich);
    document.getElementById('field-backstage-curfew-geplant').innerHTML = createFieldRow('Backstage Curfew Geplant', uebersicht.backstageCurfew);
    document.getElementById('field-backstage-curfew-tatsachlich').innerHTML = createFieldRow('Backstage Curfew Tatsächlich', uebersicht.backstageCurfewTatsachlich);

    // Conditional fields - always show
    document.getElementById('field-agentur').innerHTML = createFieldRow('Agentur', uebersicht.agentur);
    document.getElementById('field-agentur-ap').innerHTML = createFieldRow('Agentur AP Name', uebersicht.agenturAPName);
    document.getElementById('field-veranstalter-name').innerHTML = createFieldRow('Veranstalter Name', uebersicht.veranstalterName);
    // Only show veranstalter-ap if it has a value
    if (uebersicht.veranstalterAPName && uebersicht.veranstalterAPName.trim() !== '') {
        document.getElementById('field-veranstalter-ap').innerHTML = createFieldRow('Veranstalter AP Name', uebersicht.veranstalterAPName);
    } else {
        document.getElementById('field-veranstalter-ap').innerHTML = '';
    }
    // Only show company-name if it has a value
    if (uebersicht.companyName && uebersicht.companyName.trim() !== '') {
        document.getElementById('field-company-name').innerHTML = createFieldRow('Company Name', uebersicht.companyName);
    } else {
        document.getElementById('field-company-name').innerHTML = '';
    }
    document.getElementById('field-vva').innerHTML = createFieldRow('VVA', uebersicht.vva);

    // Positionen
    if (uebersicht.positionen && uebersicht.positionen.length > 0) {
        let positionenHtml = '<div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Name</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Position</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Funkgerät</th><th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Zurückgegeben</th></tr></thead><tbody>';
        uebersicht.positionen.forEach(position => {
            if (position.name) {
                const returned = position.returned ? 'Ja' : 'Nein';
                positionenHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">${escapeHtml(position.name || '-')}</td><td style="padding: 10px;">${escapeHtml(position.position || '-')}</td><td style="padding: 10px;">${escapeHtml(position.funkgerat || '-')}</td><td style="text-align: center; padding: 10px;">${escapeHtml(returned)}</td></tr>`;
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
    // Hospitality Section - always show all fields
    document.getElementById('field-travel-party-getin-hospitality').innerHTML = createFieldRow('Travel Party Get In', uebersicht.travelPartyGetIn);
    document.getElementById('field-travel-party-tatsachlich-hospitality').innerHTML = createFieldRow('Travel Party Tatsächlich', uebersicht.travelPartyTatsachlich);
    
    // Nightliner Parkplatz - always show
    const nightlinerValue = uebersicht.nightlinerParkplatz === 'yes' ? 'Ja' : (uebersicht.nightlinerParkplatz === 'no' ? 'Nein' : '-');
    document.getElementById('field-nightliner-hospitality').innerHTML = createFieldRow('Nightliner Parkplatz', nightlinerValue);
    
    // Get In Catering - always show
    const cateringMap = { 'no': 'Nein', 'kalt': 'Kalt', 'nur-snacks': 'Nur Snacks', 'warm': 'Warm', 'buyout': 'Buyout' };
    const getInCateringValue = riderExtras.getInCatering ? (cateringMap[riderExtras.getInCatering] || riderExtras.getInCatering) : '-';
    document.getElementById('field-getin-catering').innerHTML = createFieldRow('Get In Catering', getInCateringValue);
    
    // Dinner - always show
    const dinnerMap = { 'no': 'Nein', 'warm': 'Warm', 'buyout': 'Buyout', 'caterer': 'Caterer' };
    let dinnerValue = riderExtras.dinner ? (dinnerMap[riderExtras.dinner] || riderExtras.dinner) : '-';
    
    // Add disclaimer for caterer option only
    if (riderExtras.dinner === 'caterer') {
        dinnerValue += ' <span style="color: #e74c3c; font-style: italic;">(Nicht Standard)</span>';
    }
    
    document.getElementById('field-dinner').innerHTML = createFieldRow('Dinner', dinnerValue);
    
    // Create invoice-like table for catering prices
    const cateringInvoiceItems = [];
    const cateringPrices = data.cateringPrices || {};
    const bestueckungTotalPrices = data.bestueckungTotalPrices || {};
    const bestueckungPricingTypes = data.bestueckungPricingTypes || {};
    // Use actual travel party (tatsächlich) if available, otherwise fall back to Get In
    const travelParty = parseFloat(uebersicht.travelPartyTatsachlich) || parseFloat(uebersicht.travelPartyGetIn) || 0;
    
    // Get In Catering
    if ((riderExtras.getInCatering === 'warm' || riderExtras.getInCatering === 'kalt') && travelParty > 0) {
        let pricePerPerson = 0;
        let description = '';
        
        if (riderExtras.getInCatering === 'warm' && cateringPrices.warmPerPerson && cateringPrices.warmPerPerson.trim() !== '') {
            pricePerPerson = parseFloat(cateringPrices.warmPerPerson) || 0;
            description = 'Get In Catering (Warm)';
        } else if (riderExtras.getInCatering === 'kalt' && cateringPrices.coldPerPerson && cateringPrices.coldPerPerson.trim() !== '') {
            pricePerPerson = parseFloat(cateringPrices.coldPerPerson) || 0;
            description = 'Get In Catering (Kalt)';
        }
        
        if (pricePerPerson > 0) {
            const total = travelParty * pricePerPerson;
            cateringInvoiceItems.push({
                description: description,
                quantity: travelParty,
                unitPrice: pricePerPerson,
                total: total
            });
        }
    }
    
    // Dinner (if warm)
    if (riderExtras.dinner === 'warm' && travelParty > 0) {
        if (cateringPrices.warmPerPerson && cateringPrices.warmPerPerson.trim() !== '') {
            const pricePerPerson = parseFloat(cateringPrices.warmPerPerson) || 0;
            if (pricePerPerson > 0) {
                const total = travelParty * pricePerPerson;
                cateringInvoiceItems.push({
                    description: 'Dinner (Warm)',
                    quantity: travelParty,
                    unitPrice: pricePerPerson,
                    total: total
                });
            }
        }
    }
    
    // Bestückung (if standard-konzert or standard-tranzit is selected)
    if (riderExtras.standardbestueckung === 'standard-konzert' || riderExtras.standardbestueckung === 'standard-tranzit') {
        const bestueckungKey = riderExtras.standardbestueckung;
        const pricingType = bestueckungPricingTypes[bestueckungKey] || 'pauschale';
        const priceStr = bestueckungTotalPrices[bestueckungKey];
        
        if (priceStr && priceStr.trim() !== '') {
            const unitPrice = parseFloat(priceStr) || 0;
            if (unitPrice > 0) {
                const bestueckungMap = {
                    'standard-konzert': 'Standard Konzert',
                    'standard-tranzit': 'Standard Tranzit'
                };
                const bestueckungName = bestueckungMap[bestueckungKey] || bestueckungKey;
                const description = `Backstage Kühlschrank ${bestueckungName}`;
                
                if (pricingType === 'perPerson' && travelParty > 0) {
                    const total = travelParty * unitPrice;
                    cateringInvoiceItems.push({
                        description: description + ' (Pro Person)',
                        quantity: travelParty,
                        unitPrice: unitPrice,
                        total: total
                    });
                } else if (pricingType === 'pauschale') {
                    cateringInvoiceItems.push({
                        description: description + ' (Pauschale)',
                        quantity: 1,
                        unitPrice: unitPrice,
                        total: unitPrice
                    });
                }
            }
        }
    }
    
    // Display invoice table if there are items
    if (cateringInvoiceItems.length > 0) {
        let invoiceHtml = '<div class="subsection-header" style="margin-top: 20px; margin-bottom: 10px; font-weight: 600; font-size: 14px;">Catering Rechnung</div>';
        invoiceHtml += '<div class="table-container"><table style="width: 100%; border-collapse: collapse;">';
        invoiceHtml += '<thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">';
        invoiceHtml += '<th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Beschreibung</th>';
        invoiceHtml += '<th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Menge</th>';
        invoiceHtml += '<th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Einzelpreis</th>';
        invoiceHtml += '<th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Gesamt</th>';
        invoiceHtml += '</tr></thead><tbody>';
        
        let grandTotal = 0;
        cateringInvoiceItems.forEach(item => {
            grandTotal += item.total;
            invoiceHtml += '<tr style="border-bottom: 1px solid #eee;">';
            invoiceHtml += `<td style="padding: 10px;">${escapeHtml(item.description)}</td>`;
            invoiceHtml += `<td style="text-align: right; padding: 10px;">${item.quantity}</td>`;
            invoiceHtml += `<td style="text-align: right; padding: 10px;">€${item.unitPrice.toFixed(2)}</td>`;
            invoiceHtml += `<td style="text-align: right; padding: 10px; font-weight: 600;">€${item.total.toFixed(2)}</td>`;
            invoiceHtml += '</tr>';
        });
        
        invoiceHtml += '</tbody>';
        invoiceHtml += '<tfoot><tr style="background-color: #f9f9f9; border-top: 2px solid #ddd;">';
        invoiceHtml += '<td colspan="3" style="text-align: right; padding: 10px; font-weight: 600;">Gesamtsumme:</td>';
        invoiceHtml += `<td style="text-align: right; padding: 10px; font-weight: 700; font-size: 16px;">€${grandTotal.toFixed(2)}</td>`;
        invoiceHtml += '</tr></tfoot>';
        invoiceHtml += '</table></div>';
        
        document.getElementById('field-catering-sum').innerHTML = invoiceHtml;
    }
    
    if (riderExtras.buyoutProvider) {
        const buyoutProviderMap = {
            'uber-bahnhof-pauli': 'Bahnhof Pauli',
            'uber-agentur': 'Agentur'
        };
        const providerDisplay = buyoutProviderMap[riderExtras.buyoutProvider] || riderExtras.buyoutProvider;
        document.getElementById('field-buyout-provider').innerHTML = createFieldRow('Buyout Provider', providerDisplay);
    }

    // Buyout Groups (only show if buyout ueber bahnhof is selected)
    if (riderExtras.buyoutProvider === 'uber-bahnhof-pauli' && riderExtras.buyoutGroups && riderExtras.buyoutGroups.length > 0) {
        let buyoutHtml = '<div class="subsection-header">Buyout Gruppen:</div><div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Personen</th><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Pro Person</th><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Gesamt</th></tr></thead><tbody>';
        let grandTotal = 0;
        riderExtras.buyoutGroups.forEach((group, idx) => {
            if (group.people || group.perPerson) {
                const people = parseFloat(group.people) || 0;
                const perPerson = parseFloat(group.perPerson) || 0;
                const total = people * perPerson;
                grandTotal += total;
                buyoutHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="text-align: right; padding: 10px;">${escapeHtml(String(group.people || 0))}</td><td style="text-align: right; padding: 10px;">€${escapeHtml(String(group.perPerson || '0.00'))}</td><td style="text-align: right; padding: 10px; font-weight: 600;">€${total.toFixed(2)}</td></tr>`;
            }
        });
        buyoutHtml += '</tbody>';
        buyoutHtml += '<tfoot><tr style="background-color: #f9f9f9; border-top: 2px solid #ddd;">';
        buyoutHtml += '<td colspan="2" style="text-align: right; padding: 10px; font-weight: 600;">Gesamtsumme:</td>';
        buyoutHtml += `<td style="text-align: right; padding: 10px; font-weight: 700; font-size: 16px;">€${grandTotal.toFixed(2)}</td>`;
        buyoutHtml += '</tr></tfoot>';
        buyoutHtml += '</table></div>';
        document.getElementById('buyout-groups-container').innerHTML = buyoutHtml;
    }

    // Backstage Kühlschrank - always show
    const bestueckungMap = {
        'leer': 'Leer',
        'abgeschlossen': 'Abgeschlossen',
        'standard-konzert': 'Standard Konzert',
        'standard-tranzit': 'Standard Tranzit'
    };
    let bestueckungValue = riderExtras.standardbestueckung ? (bestueckungMap[riderExtras.standardbestueckung] || riderExtras.standardbestueckung) : '-';
    const displayValue = bestueckungValue !== '-' ? `Backstage Kühlschrank: ${bestueckungValue}` : '-';
    document.getElementById('field-backstage-kuehlschrank').innerHTML = createFieldRow('Backstage Kühlschrank', displayValue);
    
    if (riderExtras.standardbestueckung) {

        // Fridge Items
        if (riderExtras.customizedFridgeItems && riderExtras.customizedFridgeItems.length > 0) {
            let fridgeHtml = '<div class="subsection-header">Kühlschrank Items:</div><div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Item</th><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Menge</th><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Preis</th></tr></thead><tbody>';
            riderExtras.customizedFridgeItems.forEach(item => {
                if (item.name) {
                    let price = '-';
                    if (item.price !== undefined && item.price !== null && item.price !== '') {
                        const priceNum = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
                        if (!isNaN(priceNum) && isFinite(priceNum)) {
                            price = `€${priceNum.toFixed(2)}`;
                        }
                    }
                    fridgeHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">${escapeHtml(item.name)}</td><td style="text-align: right; padding: 10px;">${escapeHtml(String(item.amount || '-'))}</td><td style="text-align: right; padding: 10px;">${escapeHtml(price)}</td></tr>`;
                }
            });
            fridgeHtml += '</tbody></table></div>';
            document.getElementById('fridge-items-container').innerHTML = fridgeHtml;
        } else if (riderExtras.standardbestueckung === 'standard-konzert' || riderExtras.standardbestueckung === 'standard-tranzit') {
            document.getElementById('fridge-items-container').innerHTML = '<div class="empty-state">(Keine Items hinzugefügt)</div>';
        }
    }

    // Extras (resolve riderItemId -> name, price from riderItems)
    const riderItems = data.riderItems || [];
    function resolveRiderItem(item) {
        if (!item.riderItemId || !riderItems.length) return { name: '', price: 0, ekPrice: null };
        const cat = riderItems.find(function(c) { return c.id === item.riderItemId; });
        if (!cat) return { name: '', price: 0, ekPrice: null };
        return { name: cat.name, price: cat.price != null ? cat.price : 0, ekPrice: cat.ekPrice != null ? cat.ekPrice : null };
    }
    function computedExtrasPrice(resolved, item) {
        if (item.discount === 'EK' && resolved.ekPrice != null) return resolved.ekPrice;
        if (item.discount) {
            var pct = parseFloat(item.discount);
            if (!isNaN(pct)) return resolved.price * (1 - pct / 100);
        }
        return resolved.price;
    }
    if (riderExtras.items && riderExtras.items.length > 0) {
        const extrasItems = riderExtras.items.filter(function(item) { return item.riderItemId; });
        if (extrasItems.length > 0) {
            let extrasHtml = '<div class="subsection-header">Extras:</div><div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Item</th><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Menge</th><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Preis</th><th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Rabatt</th><th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Status</th></tr></thead><tbody>';
            extrasItems.forEach(function(item) {
                var resolved = resolveRiderItem(item);
                var priceNum = computedExtrasPrice(resolved, item);
                var price = (priceNum != null && isFinite(priceNum)) ? '€' + priceNum.toFixed(2) : '-';
                const discountMap = { '50': '50%', '75': '75%', '100': '100%', 'EK': 'EK' };
                const discount = item.discount ? (discountMap[item.discount] || item.discount) : '-';
                const status = item.checked ? '✓ Eingebongt' : '-';
                extrasHtml += '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">' + escapeHtml(resolved.name) + '</td><td style="text-align: right; padding: 10px;">' + escapeHtml(String(item.amount || '-')) + '</td><td style="text-align: right; padding: 10px;">' + escapeHtml(price) + '</td><td style="text-align: center; padding: 10px;">' + escapeHtml(discount) + '</td><td style="text-align: center; padding: 10px;">' + escapeHtml(status) + '</td></tr>';
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

    // Ton/Lichttechnik – personnel list
    const tonPersonnel = tontechniker.personnel || [];
    const tonWithData = tonPersonnel.filter(p => (p.name || '').trim() || (p.startTime || '').trim() || (p.endTime || '').trim());
    if (tonWithData.length > 0) {
        let tonHtml = '<div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Name</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Rolle</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Start</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Ende</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Dauer</th></tr></thead><tbody>';
        tonWithData.forEach(person => {
            const duration = calculateDuration(person.startTime, person.endTime);
            tonHtml += '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">' + escapeHtml(person.name || '-') + '</td><td style="padding: 10px;">' + escapeHtml(person.role || '-') + '</td><td style="padding: 10px;">' + escapeHtml(person.startTime || '-') + '</td><td style="padding: 10px;">' + escapeHtml(person.endTime || '-') + '</td><td style="padding: 10px;">' + escapeHtml(duration) + '</td></tr>';
        });
        tonHtml += '</tbody></table></div>';
        document.getElementById('sound-engineer-container').innerHTML = tonHtml;
    }
    document.getElementById('lighting-tech-container').innerHTML = '';

    // Secu
    if (secu.securityPersonnel && secu.securityPersonnel.length > 0) {
        let secuHtml = '<div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Name</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Start</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Ende</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Dauer</th></tr></thead><tbody>';
        secu.securityPersonnel.forEach(person => {
            if (person.name || person.startTime || person.endTime) {
                const duration = calculateDuration(person.startTime, person.endTime);
                secuHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">${escapeHtml(person.name || '-')}</td><td style="padding: 10px;">${escapeHtml(person.startTime || '-')}</td><td style="padding: 10px;">${escapeHtml(person.endTime || '-')}</td><td style="padding: 10px;">${escapeHtml(duration)}</td></tr>`;
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
        let andereMitarbeiterHtml = '<div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Name</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Start</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Ende</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Dauer</th><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Kategorie</th></tr></thead><tbody>';
        andereMitarbeiter.mitarbeiter.forEach(person => {
            if (person.name || person.startTime || person.endTime || person.category) {
                const duration = calculateDuration(person.startTime, person.endTime);
                andereMitarbeiterHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">${escapeHtml(person.name || '-')}</td><td style="padding: 10px;">${escapeHtml(person.startTime || '-')}</td><td style="padding: 10px;">${escapeHtml(person.endTime || '-')}</td><td style="padding: 10px;">${escapeHtml(duration)}</td><td style="padding: 10px;">${escapeHtml(person.category || '-')}</td></tr>`;
            }
        });
        andereMitarbeiterHtml += '</tbody></table></div>';
        document.getElementById('andere-mitarbeiter-table-container').innerHTML = andereMitarbeiterHtml;
    } else {
        document.getElementById('andere-mitarbeiter-section').style.display = 'none';
    }


    // Gäste Section - always show payment type
    const paymentMap = { 'selbstzahler': 'Selbstzahler', 'pauschale': 'Pauschale' };
    const paymentTypeValue = gaeste.paymentType ? (paymentMap[gaeste.paymentType] || gaeste.paymentType) : '-';
    document.getElementById('field-payment-type').innerHTML = createFieldRow('Zahlungsart', paymentTypeValue);

    if (gaeste.paymentType === 'pauschale' && gaeste.pauschaleOptions) {
        const options = [];
        const prices = [];
        const pauschalePrices = data.pauschalePrices || {};
        
        if (gaeste.pauschaleOptions.standard) {
            options.push('Standard');
            if (pauschalePrices.standard && pauschalePrices.standard.trim() !== '') {
                const price = parseFloat(pauschalePrices.standard) || 0;
                if (price > 0) {
                    prices.push(`Standard: €${price.toFixed(2)}`);
                }
            }
        }
        if (gaeste.pauschaleOptions.longdrinks) {
            options.push('Longdrinks');
            if (pauschalePrices.longdrinks && pauschalePrices.longdrinks.trim() !== '') {
                const price = parseFloat(pauschalePrices.longdrinks) || 0;
                if (price > 0) {
                    prices.push(`Longdrinks: €${price.toFixed(2)}`);
                }
            }
        }
        if (gaeste.pauschaleOptions.shots) {
            options.push('Shots');
            if (pauschalePrices.shots && pauschalePrices.shots.trim() !== '') {
                const price = parseFloat(pauschalePrices.shots) || 0;
                if (price > 0) {
                    prices.push(`Shots: €${price.toFixed(2)}`);
                }
            }
        }
        // Show pauschale fields only if pauschale is selected
        if (options.length > 0) {
            document.getElementById('field-pauschale-options').innerHTML = createFieldRow('Pauschale Optionen', options.join(', '));
        } else {
            document.getElementById('field-pauschale-options').innerHTML = createFieldRow('Pauschale Optionen', '-');
        }
        if (prices.length > 0) {
            const total = prices.reduce((sum, priceStr) => {
                const match = priceStr.match(/€(\d+\.?\d*)/);
                return sum + (match ? parseFloat(match[1]) : 0);
            }, 0);
            const pricesDisplay = prices.join(', ');
            const totalDisplay = total > 0 ? ` (Gesamt: €${total.toFixed(2)})` : '';
            document.getElementById('field-pauschale-prices').innerHTML = createFieldRow('Pauschale Preise', pricesDisplay + totalDisplay);
        } else {
            document.getElementById('field-pauschale-prices').innerHTML = createFieldRow('Pauschale Preise', '-');
        }
    } else {
        // Hide pauschale fields if payment type is not pauschale or not set
        document.getElementById('field-pauschale-options').innerHTML = '';
        document.getElementById('field-pauschale-prices').innerHTML = '';
    }

    if (gaeste.anzahlAbendkasse || gaeste.betragAbendkasse || gaeste.useTimeBasedPricing || gaeste.gaesteGesamt) {
        let gaesteHtml = '<div class="table-container"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;"><th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Kategorie</th><th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd; color: #000;">Wert</th></tr></thead><tbody>';
        
        // Handle time-based pricing
        if (gaeste.useTimeBasedPricing && gaeste.abendkasseTimeSlots && Array.isArray(gaeste.abendkasseTimeSlots) && gaeste.abendkasseTimeSlots.length > 0) {
            gaesteHtml += '<tr style="border-bottom: 1px solid #eee; background-color: #f0f0f0;"><td style="padding: 10px; font-weight: 600;" colspan="2">Zeitbasierte Preise Abendkasse</td></tr>';
            let timeSlotsTotal = 0;
            gaeste.abendkasseTimeSlots.forEach((slot) => {
                if (slot.time || slot.price || slot.count) {
                    const price = parseFloat(slot.price || 0);
                    const count = parseFloat(slot.count || 0);
                    const slotTotal = price * count;
                    timeSlotsTotal += slotTotal;
                    const timeDisplay = slot.time || '-';
                    gaesteHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">Abendkasse ${escapeHtml(timeDisplay)} (${escapeHtml(String(slot.count || 0))} × €${escapeHtml(String(slot.price || 0))})</td><td style="text-align: right; padding: 10px;">€${escapeHtml(slotTotal.toFixed(2))}</td></tr>`;
                }
            });
            if (timeSlotsTotal > 0) {
                gaesteHtml += `<tr style="border-bottom: 1px solid #eee; background-color: #f9f9f9;"><td style="padding: 10px; font-weight: 600;">Total Abendkasse:</td><td style="text-align: right; padding: 10px; font-weight: 600;">€${escapeHtml(timeSlotsTotal.toFixed(2))}</td></tr>`;
            }
        } else {
            // Handle simple pricing
            if (gaeste.anzahlAbendkasse) {
                gaesteHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">Anzahl Abendkasse</td><td style="text-align: right; padding: 10px;">${escapeHtml(String(gaeste.anzahlAbendkasse))}</td></tr>`;
            }
            if (gaeste.betragAbendkasse) {
                gaesteHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">Betrag Abendkasse</td><td style="text-align: right; padding: 10px;">€${escapeHtml(String(gaeste.betragAbendkasse))}</td></tr>`;
            }
            if (gaeste.anzahlAbendkasse && gaeste.betragAbendkasse) {
                const total = (parseFloat(gaeste.anzahlAbendkasse) * parseFloat(gaeste.betragAbendkasse)).toFixed(2);
                gaesteHtml += `<tr style="border-bottom: 1px solid #eee; background-color: #f9f9f9;"><td style="padding: 10px; font-weight: 600;">Total:</td><td style="text-align: right; padding: 10px; font-weight: 600;">€${escapeHtml(total)}</td></tr>`;
            }
        }
        
        if (gaeste.gaesteGesamt) {
            gaesteHtml += `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">Gäste Gesamt</td><td style="text-align: right; padding: 10px;">${escapeHtml(String(gaeste.gaesteGesamt))}</td></tr>`;
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
    }
    
    if (itemsArray.length === 0) {
        document.getElementById('shift-notes-section').style.display = 'none';
    }
})();

