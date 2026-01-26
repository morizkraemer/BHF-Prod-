// Validate VVA -> SL transition (specific fields required)
const validateVVAtoSL = (formData) => {
  const errors = [];
  const uebersichtData = formData.uebersicht || {};
  const riderExtrasData = formData['rider-extras'] || {};
  
  // Event Name
  if (!uebersichtData.eventName || uebersichtData.eventName === '') {
    errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Event Name' });
  }
  
  // Event Type
  if (!uebersichtData.eventType || uebersichtData.eventType === '') {
    errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Event Typ' });
  }
  
  // Nightliner Parkplatz (now in Hospitality section)
  if (!uebersichtData.nightlinerParkplatz || uebersichtData.nightlinerParkplatz === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Nightliner Parkplatz' });
  }
  
  // Get in Zeit
  if (!uebersichtData.getInTime || uebersichtData.getInTime === '') {
    errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Get In Zeit' });
  }
  
  // Doors Zeit
  if (!uebersichtData.doorsTime || uebersichtData.doorsTime === '') {
    errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: 'Doors Zeit' });
  }
  
  // Travel Party Get In (now in Hospitality section)
  if (!uebersichtData.travelPartyGetIn || uebersichtData.travelPartyGetIn === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Travel Party Get In' });
  }

  // Catering options (getInCatering and dinner)
  if (!riderExtrasData.getInCatering || riderExtrasData.getInCatering === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Get In Catering' });
  }
  
  if (!riderExtrasData.dinner || riderExtrasData.dinner === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Dinner' });
  }
  
  // If buyout is selected, require buyout groups with people and perPerson
  if (riderExtrasData.dinner === 'buyout') {
    if (!riderExtrasData.buyoutProvider || riderExtrasData.buyoutProvider === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Buyout Provider' });
    }
    if (riderExtrasData.buyoutProvider === 'uber-bahnhof-pauli') {
      const buyoutGroups = riderExtrasData.buyoutGroups || [];
      if (buyoutGroups.length === 0) {
        errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Buyout Gruppen' });
      } else {
        buyoutGroups.forEach((group, index) => {
          if (!group.people || group.people === '' || parseFloat(group.people) <= 0) {
            errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: `Buyout Gruppe ${index + 1} - Anzahl Personen` });
          }
          if (!group.perPerson || group.perPerson === '' || parseFloat(group.perPerson) <= 0) {
            errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: `Buyout Gruppe ${index + 1} - Buyout pro Person` });
          }
        });
      }
      
      // Buyout Quittung scan required when buyout provider is "uber-bahnhof-pauli"
      const buyoutQuittungDocuments = riderExtrasData.buyoutQuittungDocuments || [];
      const hasBuyoutQuittung = buyoutQuittungDocuments.length > 0;
      if (!hasBuyoutQuittung) {
        errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Buyout Quittung Scan' });
      }
    }
  }
  
  // Backstage Kühlschrank (standardbestueckung)
  if (!riderExtrasData.standardbestueckung || riderExtrasData.standardbestueckung === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Backstage Kühlschrank' });
  }
  
  // Ton/Lichttechnik section - Get In Times (Start Times) required when enabled
  const tontechnikerData = formData.tontechniker || {};
  if (tontechnikerData.soundEngineerEnabled !== false) {
    if (!tontechnikerData.soundEngineerStartTime || tontechnikerData.soundEngineerStartTime === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Sound Engineer Start Zeit' });
    }
  }
  if (tontechnikerData.lightingTechEnabled === true) {
    if (!tontechnikerData.lightingTechStartTime || tontechnikerData.lightingTechStartTime === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Lighting Tech Start Zeit' });
    }
  }
  
  return errors;
};

// Validate all required fields with detailed field-level errors (for SL phase)
const validateAllSectionsDetailed = (formData) => {
  const errors = [];
  const uebersichtData = formData.uebersicht || {};
  const riderExtrasData = formData['rider-extras'] || {};
  const tontechnikerData = formData.tontechniker || {};
  const secuData = formData.secu || {};
  const kassenData = formData.kassen || {};
  
  // Übersicht section
  const uebersichtRequired = ['eventName', 'date', 'eventType', 'getInTime', 'doorsTime', 'nightLead', 'konzertende', 'backstageCurfew'];
  if (uebersichtData.eventType === 'konzert') {
    uebersichtRequired.push('agentur');
  } else if (uebersichtData.eventType === 'club' || uebersichtData.eventType === 'andere') {
    uebersichtRequired.push('veranstalterName');
  }
  
  const fieldNameMap = {
    'eventName': 'Event Name',
    'date': 'Datum',
    'eventType': 'Event Typ',
    'getInTime': 'Get In Zeit',
    'doorsTime': 'Doors Zeit',
    'nightLead': 'Night Lead',
    'konzertende': 'Konzertende',
    'backstageCurfew': 'Backstage Curfew',
    'agentur': 'Agentur',
    'veranstalterName': 'Veranstalter Name'
  };
  
  uebersichtRequired.forEach(field => {
    const value = uebersichtData[field];
    if (value === undefined || value === null || value === '') {
      errors.push({ section: 'Übersicht', sectionId: 'uebersicht', field: fieldNameMap[field] || field });
    }
  });
  
  // Hospitality section
  // Travel Party Get In (stored in uebersicht but required in hospitality)
  if (!uebersichtData.travelPartyGetIn || uebersichtData.travelPartyGetIn === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Travel Party Get In' });
  }
  // Nightliner Parkplatz (stored in uebersicht but required in hospitality)
  if (!uebersichtData.nightlinerParkplatz || uebersichtData.nightlinerParkplatz === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Nightliner Parkplatz' });
  }
  if (!riderExtrasData.getInCatering || riderExtrasData.getInCatering === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Get In Catering' });
  }
  if (!riderExtrasData.dinner || riderExtrasData.dinner === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Dinner' });
  }
  
  // If buyout is selected, require buyout groups with people and perPerson
  if (riderExtrasData.dinner === 'buyout') {
    if (!riderExtrasData.buyoutProvider || riderExtrasData.buyoutProvider === '') {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Buyout Provider' });
    }
    if (riderExtrasData.buyoutProvider === 'uber-bahnhof-pauli') {
      const buyoutGroups = riderExtrasData.buyoutGroups || [];
      if (buyoutGroups.length === 0) {
        errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Buyout Gruppen' });
      } else {
        buyoutGroups.forEach((group, index) => {
          if (!group.people || group.people === '' || parseFloat(group.people) <= 0) {
            errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: `Buyout Gruppe ${index + 1} - Anzahl Personen` });
          }
          if (!group.perPerson || group.perPerson === '' || parseFloat(group.perPerson) <= 0) {
            errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: `Buyout Gruppe ${index + 1} - Buyout pro Person` });
          }
        });
      }
    }
  }
  
  if (!riderExtrasData.standardbestueckung || riderExtrasData.standardbestueckung === '') {
    errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Backstage Kühlschrank' });
  }
  
  // Handtuchzettel scan - only required for Konzert events
  if (uebersichtData.eventType === 'konzert') {
    const scannedDocuments = riderExtrasData.scannedDocuments || [];
    const handtuchzettelScans = scannedDocuments.filter(doc => doc.scanName === 'Handtuchzettel');
    if (handtuchzettelScans.length === 0) {
      errors.push({ section: 'Hospitality', sectionId: 'rider-extras', field: 'Handtuchzettel Scan' });
    }
  }
  
  // Ton/Lichttechnik section
  if (tontechnikerData.soundEngineerEnabled !== false) {
    if (!tontechnikerData.soundEngineerName || tontechnikerData.soundEngineerName === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Sound Engineer Name' });
    }
    if (!tontechnikerData.soundEngineerStartTime || tontechnikerData.soundEngineerStartTime === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Sound Engineer Start Zeit' });
    }
    if (!tontechnikerData.soundEngineerEndTime || tontechnikerData.soundEngineerEndTime === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Sound Engineer End Zeit' });
    }
  }
  if (tontechnikerData.lightingTechEnabled === true) {
    if (!tontechnikerData.lightingTechName || tontechnikerData.lightingTechName === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Lighting Tech Name' });
    }
    if (!tontechnikerData.lightingTechStartTime || tontechnikerData.lightingTechStartTime === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Lighting Tech Start Zeit' });
    }
    if (!tontechnikerData.lightingTechEndTime || tontechnikerData.lightingTechEndTime === '') {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Lighting Tech End Zeit' });
    }
  }
  // Only require scanning if at least one tech is enabled
  const soundEngineerEnabled = tontechnikerData.soundEngineerEnabled !== false;
  const lightingTechEnabled = tontechnikerData.lightingTechEnabled === true;
  if (soundEngineerEnabled || lightingTechEnabled) {
    const scannedImages = tontechnikerData.scannedImages || [];
    if (scannedImages.length === 0) {
      errors.push({ section: 'Ton/Lichttechnik', sectionId: 'tontechniker', field: 'Gescannte Bilder' });
    }
  }
  
  // Secu section
  const securityPersonnel = secuData.securityPersonnel || [];
  if (securityPersonnel.length > 0) {
    securityPersonnel.forEach((person, index) => {
      if (!person.name || person.name.trim() === '') {
        errors.push({ section: 'Secu', sectionId: 'secu', field: `Secu Person ${index + 1} Name` });
      }
      if (!person.startTime || person.startTime === '') {
        errors.push({ section: 'Secu', sectionId: 'secu', field: `Secu Person ${index + 1} Start Zeit` });
      }
      if (!person.endTime || person.endTime === '') {
        errors.push({ section: 'Secu', sectionId: 'secu', field: `Secu Person ${index + 1} End Zeit` });
      }
    });
    const secuScannedDocuments = secuData.scannedDocuments || [];
    if (secuScannedDocuments.length === 0) {
      errors.push({ section: 'Secu', sectionId: 'secu', field: 'Gescannte Dokumente' });
    }
  }
  
  // Andere Mitarbeiter section
  const andereMitarbeiterData = formData['andere-mitarbeiter'] || {};
  const mitarbeiter = andereMitarbeiterData.mitarbeiter || [];
  if (mitarbeiter.length > 0) {
    mitarbeiter.forEach((person, index) => {
      if (!person.name || person.name.trim() === '') {
        errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} Name` });
      }
      if (!person.startTime || person.startTime === '') {
        errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} Start Zeit` });
      }
      if (!person.endTime || person.endTime === '') {
        errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} End Zeit` });
      }
      if (!person.category || person.category === '') {
        errors.push({ section: 'Andere Mitarbeiter', sectionId: 'andere-mitarbeiter', field: `Andere Mitarbeiter Person ${index + 1} Kategorie` });
      }
    });
  }
  
  // Kassen section
  const hasReceipts = kassenData.receipts && kassenData.receipts.length > 0;
  if (!hasReceipts) {
    errors.push({ section: 'Kassen', sectionId: 'kassen', field: 'Belege Scans' });
  }
  const hasAbrechnungen = kassenData.abrechnungen && kassenData.abrechnungen.length > 0;
  if (!hasAbrechnungen) {
    errors.push({ section: 'Kassen', sectionId: 'kassen', field: 'Abrechnungen Scans' });
  }
  
  // Gäste section - Agenturzettel required for Konzert events
  const gaesteData = formData.gaeste || {};
  if (uebersichtData.eventType === 'konzert') {
    const agenturzettelScans = gaesteData.scannedDocuments || [];
    const hasAgenturzettel = agenturzettelScans.some(doc => doc.scanName === 'Agenturzettel');
    if (!hasAgenturzettel) {
      errors.push({ section: 'Gäste', sectionId: 'gaeste', field: 'Agenturzettel Scan' });
    }
  }
  if (!gaesteData.gaesteGesamt || gaesteData.gaesteGesamt === '') {
    errors.push({ section: 'Gäste', sectionId: 'gaeste', field: 'Gäste Gesamt' });
  }
  
  return errors;
};

// Check if there are extras in hospitality
const hasHospitalityExtras = (formData) => {
  const riderExtrasData = formData['rider-extras'] || {};
  const items = riderExtrasData.items || [];
  // Check if there are any items with text/name filled
  return items.some(item => item.text && item.text.trim() !== '');
};

// Function to count filled required fields for each section
const getRequiredFieldsCount = (sectionId, formData) => {
  const data = formData[sectionId] || {};
  const uebersichtData = formData.uebersicht || {}; // Used in multiple cases
  
  switch (sectionId) {
    case 'uebersicht':
      let uebersichtRequired = ['eventName', 'date', 'eventType', 'getInTime', 'doorsTime', 'nightLead', 'konzertende', 'backstageCurfew'];

      // Add conditional required fields based on event type
      if (data.eventType === 'konzert') {
        uebersichtRequired.push('agentur');
      } else if (data.eventType === 'club' || data.eventType === 'andere') {
        uebersichtRequired.push('veranstalterName');
      }

      const uebersichtFilled = uebersichtRequired.filter(field => {
        const value = data[field];
        return value !== undefined && value !== null && value !== '';
      }).length;
      return { filled: uebersichtFilled, total: uebersichtRequired.length };
    
    case 'tontechniker':
      // Count required fields based on enabled checkboxes
      let tontechnikerRequired = [];
      let tontechnikerFilled = 0;
      
      // Sound engineer fields are required if enabled (default true)
      if (data.soundEngineerEnabled !== false) {
        const soundFields = ['soundEngineerName', 'soundEngineerStartTime', 'soundEngineerEndTime'];
        tontechnikerRequired = tontechnikerRequired.concat(soundFields);
        soundFields.forEach(field => {
          const value = data[field];
          if (value !== undefined && value !== null && value !== '') {
            tontechnikerFilled++;
          }
        });
      }
      
      // Lighting tech fields are required if enabled
      if (data.lightingTechEnabled === true) {
        const lightingFields = ['lightingTechName', 'lightingTechStartTime', 'lightingTechEndTime'];
        tontechnikerRequired = tontechnikerRequired.concat(lightingFields);
        lightingFields.forEach(field => {
          const value = data[field];
          if (value !== undefined && value !== null && value !== '') {
            tontechnikerFilled++;
          }
        });
      }
      
      // Scanned images are only required if at least one tech is enabled
      const soundEngineerEnabled = data.soundEngineerEnabled !== false;
      const lightingTechEnabled = data.lightingTechEnabled === true;
      if (soundEngineerEnabled || lightingTechEnabled) {
        const scannedImages = data.scannedImages || [];
        tontechnikerRequired.push('scannedImages');
        if (scannedImages.length > 0) {
          tontechnikerFilled++;
        }
      }
      
      return { filled: tontechnikerFilled, total: tontechnikerRequired.length };
    
    case 'rider-extras':
      const hospitalityRequired = ['getInCatering', 'dinner', 'standardbestueckung', 'travelPartyGetIn', 'nightlinerParkplatz'];
      let hospitalityFilled = hospitalityRequired.filter(field => {
        // Travel Party Get In and Nightliner Parkplatz are stored in uebersicht data
        if (field === 'travelPartyGetIn' || field === 'nightlinerParkplatz') {
          const value = uebersichtData[field];
          return value !== undefined && value !== null && value !== '';
        }
        const value = data[field];
        return value !== undefined && value !== null && value !== '';
      }).length;
      
      return { filled: hospitalityFilled, total: hospitalityRequired.length };
    
    case 'secu':
      // Each security person's fields are required if there are any personnel entries
      const securityPersonnel = data.securityPersonnel || [];
      if (securityPersonnel.length === 0) {
        // No personnel = no required fields
        return { filled: 0, total: 0 };
      }
      
      // For each person, name, startTime, and endTime are required
      let secuRequired = securityPersonnel.length * 3; // 3 fields per person
      let secuFilled = 0;
      
      securityPersonnel.forEach(person => {
        if (person.name && person.name.trim() !== '') secuFilled++;
        if (person.startTime && person.startTime !== '') secuFilled++;
        if (person.endTime && person.endTime !== '') secuFilled++;
      });
      
      // Scanned documents are also required if there are personnel
      const scannedDocuments = data.scannedDocuments || [];
      secuRequired += 1; // Add 1 for scanned documents
      if (scannedDocuments.length > 0) {
        secuFilled++;
      }
      
      return { filled: secuFilled, total: secuRequired };
    
    case 'andere-mitarbeiter':
      // Each person's fields are required if there are any entries
      const mitarbeiter = data.mitarbeiter || [];
      if (mitarbeiter.length === 0) {
        // No personnel = no required fields
        return { filled: 0, total: 0 };
      }
      
      // For each person, name, startTime, endTime, and category are required
      let andereMitarbeiterRequired = mitarbeiter.length * 4; // 4 fields per person
      let andereMitarbeiterFilled = 0;
      
      mitarbeiter.forEach(person => {
        if (person.name && person.name.trim() !== '') andereMitarbeiterFilled++;
        if (person.startTime && person.startTime !== '') andereMitarbeiterFilled++;
        if (person.endTime && person.endTime !== '') andereMitarbeiterFilled++;
        if (person.category && person.category !== '') andereMitarbeiterFilled++;
      });
      
      return { filled: andereMitarbeiterFilled, total: andereMitarbeiterRequired };
    
    case 'kassen':
      // Required: at least one scan for receipts and abrechnungen
      const hasReceipts = formData.kassen?.receipts && formData.kassen.receipts.length > 0;
      const hasAbrechnungen = formData.kassen?.abrechnungen && formData.kassen.abrechnungen.length > 0;
      const kassenFilled = (hasReceipts ? 1 : 0) + (hasAbrechnungen ? 1 : 0);
      const kassenRequired = 2;
      return { filled: kassenFilled, total: kassenRequired };
    
    case 'gaeste':
      const gaesteData = formData.gaeste || {};
      let gaesteRequired = ['gaesteGesamt'];
      let gaesteFilled = gaesteRequired.filter(field => {
        const value = gaesteData[field];
        return value !== undefined && value !== null && value !== '';
      }).length;
      
      // Agenturzettel scan required for Konzert events
      if (uebersichtData.eventType === 'konzert') {
        gaesteRequired.push('agenturzettelScan');
        const agenturzettelScans = gaesteData.scannedDocuments || [];
        const hasAgenturzettel = agenturzettelScans.some(doc => doc.scanName === 'Agenturzettel');
        if (hasAgenturzettel) {
          gaesteFilled++;
        }
      }
      
      return { filled: gaesteFilled, total: gaesteRequired.length };
    
    default:
      return { filled: 0, total: 0 };
  }
};

// Get all VVA required fields with their fill status
const getVVAFieldsStatus = (formData) => {
  const fields = [];
  const uebersichtData = formData.uebersicht || {};
  const riderExtrasData = formData['rider-extras'] || {};
  const tontechnikerData = formData.tontechniker || {};
  
  // Event Name
  fields.push({
    section: 'Übersicht',
    sectionId: 'uebersicht',
    field: 'Event Name',
    isFilled: !!(uebersichtData.eventName && uebersichtData.eventName !== '')
  });
  
  // Event Type
  fields.push({
    section: 'Übersicht',
    sectionId: 'uebersicht',
    field: 'Event Typ',
    isFilled: !!(uebersichtData.eventType && uebersichtData.eventType !== '')
  });
  
  // Nightliner Parkplatz
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Nightliner Parkplatz',
    isFilled: !!(uebersichtData.nightlinerParkplatz && uebersichtData.nightlinerParkplatz !== '')
  });
  
  // Get in Zeit
  fields.push({
    section: 'Übersicht',
    sectionId: 'uebersicht',
    field: 'Get In Zeit',
    isFilled: !!(uebersichtData.getInTime && uebersichtData.getInTime !== '')
  });
  
  // Doors Zeit
  fields.push({
    section: 'Übersicht',
    sectionId: 'uebersicht',
    field: 'Doors Zeit',
    isFilled: !!(uebersichtData.doorsTime && uebersichtData.doorsTime !== '')
  });
  
  // Travel Party Get In
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Travel Party Get In',
    isFilled: !!(uebersichtData.travelPartyGetIn && uebersichtData.travelPartyGetIn !== '')
  });
  
  // Get In Catering
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Get In Catering',
    isFilled: !!(riderExtrasData.getInCatering && riderExtrasData.getInCatering !== '')
  });
  
  // Dinner
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Dinner',
    isFilled: !!(riderExtrasData.dinner && riderExtrasData.dinner !== '')
  });
  
  // Buyout fields (if buyout is selected)
  if (riderExtrasData.dinner === 'buyout') {
    fields.push({
      section: 'Hospitality',
      sectionId: 'rider-extras',
      field: 'Buyout Provider',
      isFilled: !!(riderExtrasData.buyoutProvider && riderExtrasData.buyoutProvider !== '')
    });
    
    if (riderExtrasData.buyoutProvider === 'uber-bahnhof-pauli') {
      const buyoutGroups = riderExtrasData.buyoutGroups || [];
      if (buyoutGroups.length === 0) {
        fields.push({
          section: 'Hospitality',
          sectionId: 'rider-extras',
          field: 'Buyout Gruppen',
          isFilled: false
        });
      } else {
        buyoutGroups.forEach((group, index) => {
          fields.push({
            section: 'Hospitality',
            sectionId: 'rider-extras',
            field: `Buyout Gruppe ${index + 1} - Anzahl Personen`,
            isFilled: !!(group.people && group.people !== '' && parseFloat(group.people) > 0)
          });
          fields.push({
            section: 'Hospitality',
            sectionId: 'rider-extras',
            field: `Buyout Gruppe ${index + 1} - Buyout pro Person`,
            isFilled: !!(group.perPerson && group.perPerson !== '' && parseFloat(group.perPerson) > 0)
          });
        });
      }
      
      // Buyout Quittung scan (only when buyout provider is "uber-bahnhof-pauli")
      const buyoutQuittungDocuments = riderExtrasData.buyoutQuittungDocuments || [];
      const hasBuyoutQuittung = buyoutQuittungDocuments.length > 0;
      fields.push({
        section: 'Hospitality',
        sectionId: 'rider-extras',
        field: 'Buyout Quittung Scan',
        isFilled: hasBuyoutQuittung
      });
    }
  }
  
  // Backstage Kühlschrank
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Backstage Kühlschrank',
    isFilled: !!(riderExtrasData.standardbestueckung && riderExtrasData.standardbestueckung !== '')
  });
  
  // Ton/Lichttechnik - Sound Engineer Start Zeit
  if (tontechnikerData.soundEngineerEnabled !== false) {
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Sound Engineer Start Zeit',
      isFilled: !!(tontechnikerData.soundEngineerStartTime && tontechnikerData.soundEngineerStartTime !== '')
    });
  }
  
  // Ton/Lichttechnik - Lighting Tech Start Zeit
  if (tontechnikerData.lightingTechEnabled === true) {
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Lighting Tech Start Zeit',
      isFilled: !!(tontechnikerData.lightingTechStartTime && tontechnikerData.lightingTechStartTime !== '')
    });
  }
  
  return fields;
};

// Get all required fields with their fill status (for SL phase)
const getAllFieldsStatus = (formData) => {
  const fields = [];
  const uebersichtData = formData.uebersicht || {};
  const riderExtrasData = formData['rider-extras'] || {};
  const tontechnikerData = formData.tontechniker || {};
  const secuData = formData.secu || {};
  const kassenData = formData.kassen || {};
  const gaesteData = formData.gaeste || {};
  const andereMitarbeiterData = formData['andere-mitarbeiter'] || {};
  
  const fieldNameMap = {
    'eventName': 'Event Name',
    'date': 'Datum',
    'eventType': 'Event Typ',
    'getInTime': 'Get In Zeit',
    'doorsTime': 'Doors Zeit',
    'nightLead': 'Night Lead',
    'konzertende': 'Konzertende',
    'backstageCurfew': 'Backstage Curfew',
    'agentur': 'Agentur',
    'veranstalterName': 'Veranstalter Name'
  };
  
  // Übersicht section
  const uebersichtRequired = ['eventName', 'date', 'eventType', 'getInTime', 'doorsTime', 'nightLead', 'konzertende', 'backstageCurfew'];
  if (uebersichtData.eventType === 'konzert') {
    uebersichtRequired.push('agentur');
  } else if (uebersichtData.eventType === 'club' || uebersichtData.eventType === 'andere') {
    uebersichtRequired.push('veranstalterName');
  }
  
  uebersichtRequired.forEach(field => {
    const value = uebersichtData[field];
    fields.push({
      section: 'Übersicht',
      sectionId: 'uebersicht',
      field: fieldNameMap[field] || field,
      isFilled: !!(value !== undefined && value !== null && value !== '')
    });
  });
  
  // Hospitality section
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Travel Party Get In',
    isFilled: !!(uebersichtData.travelPartyGetIn && uebersichtData.travelPartyGetIn !== '')
  });
  
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Nightliner Parkplatz',
    isFilled: !!(uebersichtData.nightlinerParkplatz && uebersichtData.nightlinerParkplatz !== '')
  });
  
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Get In Catering',
    isFilled: !!(riderExtrasData.getInCatering && riderExtrasData.getInCatering !== '')
  });
  
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Dinner',
    isFilled: !!(riderExtrasData.dinner && riderExtrasData.dinner !== '')
  });
  
  // Buyout fields (if buyout is selected)
  if (riderExtrasData.dinner === 'buyout') {
    fields.push({
      section: 'Hospitality',
      sectionId: 'rider-extras',
      field: 'Buyout Provider',
      isFilled: !!(riderExtrasData.buyoutProvider && riderExtrasData.buyoutProvider !== '')
    });
    
    if (riderExtrasData.buyoutProvider === 'uber-bahnhof-pauli') {
      const buyoutGroups = riderExtrasData.buyoutGroups || [];
      if (buyoutGroups.length === 0) {
        fields.push({
          section: 'Hospitality',
          sectionId: 'rider-extras',
          field: 'Buyout Gruppen',
          isFilled: false
        });
      } else {
        buyoutGroups.forEach((group, index) => {
          fields.push({
            section: 'Hospitality',
            sectionId: 'rider-extras',
            field: `Buyout Gruppe ${index + 1} - Anzahl Personen`,
            isFilled: !!(group.people && group.people !== '' && parseFloat(group.people) > 0)
          });
          fields.push({
            section: 'Hospitality',
            sectionId: 'rider-extras',
            field: `Buyout Gruppe ${index + 1} - Buyout pro Person`,
            isFilled: !!(group.perPerson && group.perPerson !== '' && parseFloat(group.perPerson) > 0)
          });
        });
      }
    }
  }
  
  fields.push({
    section: 'Hospitality',
    sectionId: 'rider-extras',
    field: 'Backstage Kühlschrank',
    isFilled: !!(riderExtrasData.standardbestueckung && riderExtrasData.standardbestueckung !== '')
  });
  
  // Handtuchzettel scan (only for Konzert events)
  if (uebersichtData.eventType === 'konzert') {
    const scannedDocuments = riderExtrasData.scannedDocuments || [];
    const hasHandtuchzettel = scannedDocuments.some(doc => doc.scanName === 'Handtuchzettel');
    fields.push({
      section: 'Hospitality',
      sectionId: 'rider-extras',
      field: 'Handtuchzettel Scan',
      isFilled: hasHandtuchzettel
    });
  }
  
  // Ton/Lichttechnik section
  if (tontechnikerData.soundEngineerEnabled !== false) {
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Sound Engineer Name',
      isFilled: !!(tontechnikerData.soundEngineerName && tontechnikerData.soundEngineerName !== '')
    });
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Sound Engineer Start Zeit',
      isFilled: !!(tontechnikerData.soundEngineerStartTime && tontechnikerData.soundEngineerStartTime !== '')
    });
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Sound Engineer End Zeit',
      isFilled: !!(tontechnikerData.soundEngineerEndTime && tontechnikerData.soundEngineerEndTime !== '')
    });
  }
  
  if (tontechnikerData.lightingTechEnabled === true) {
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Lighting Tech Name',
      isFilled: !!(tontechnikerData.lightingTechName && tontechnikerData.lightingTechName !== '')
    });
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Lighting Tech Start Zeit',
      isFilled: !!(tontechnikerData.lightingTechStartTime && tontechnikerData.lightingTechStartTime !== '')
    });
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Lighting Tech End Zeit',
      isFilled: !!(tontechnikerData.lightingTechEndTime && tontechnikerData.lightingTechEndTime !== '')
    });
  }
  
  const soundEngineerEnabled = tontechnikerData.soundEngineerEnabled !== false;
  const lightingTechEnabled = tontechnikerData.lightingTechEnabled === true;
  if (soundEngineerEnabled || lightingTechEnabled) {
    const scannedImages = tontechnikerData.scannedImages || [];
    fields.push({
      section: 'Ton/Lichttechnik',
      sectionId: 'tontechniker',
      field: 'Gescannte Bilder',
      isFilled: scannedImages.length > 0
    });
  }
  
  // Secu section
  const securityPersonnel = secuData.securityPersonnel || [];
  if (securityPersonnel.length > 0) {
    securityPersonnel.forEach((person, index) => {
      fields.push({
        section: 'Secu',
        sectionId: 'secu',
        field: `Secu Person ${index + 1} Name`,
        isFilled: !!(person.name && person.name.trim() !== '')
      });
      fields.push({
        section: 'Secu',
        sectionId: 'secu',
        field: `Secu Person ${index + 1} Start Zeit`,
        isFilled: !!(person.startTime && person.startTime !== '')
      });
      fields.push({
        section: 'Secu',
        sectionId: 'secu',
        field: `Secu Person ${index + 1} End Zeit`,
        isFilled: !!(person.endTime && person.endTime !== '')
      });
    });
    const secuScannedDocuments = secuData.scannedDocuments || [];
    fields.push({
      section: 'Secu',
      sectionId: 'secu',
      field: 'Gescannte Dokumente',
      isFilled: secuScannedDocuments.length > 0
    });
  }
  
  // Andere Mitarbeiter section
  const mitarbeiter = andereMitarbeiterData.mitarbeiter || [];
  if (mitarbeiter.length > 0) {
    mitarbeiter.forEach((person, index) => {
      fields.push({
        section: 'Andere Mitarbeiter',
        sectionId: 'andere-mitarbeiter',
        field: `Andere Mitarbeiter Person ${index + 1} Name`,
        isFilled: !!(person.name && person.name.trim() !== '')
      });
      fields.push({
        section: 'Andere Mitarbeiter',
        sectionId: 'andere-mitarbeiter',
        field: `Andere Mitarbeiter Person ${index + 1} Start Zeit`,
        isFilled: !!(person.startTime && person.startTime !== '')
      });
      fields.push({
        section: 'Andere Mitarbeiter',
        sectionId: 'andere-mitarbeiter',
        field: `Andere Mitarbeiter Person ${index + 1} End Zeit`,
        isFilled: !!(person.endTime && person.endTime !== '')
      });
      fields.push({
        section: 'Andere Mitarbeiter',
        sectionId: 'andere-mitarbeiter',
        field: `Andere Mitarbeiter Person ${index + 1} Kategorie`,
        isFilled: !!(person.category && person.category !== '')
      });
    });
  }
  
  // Kassen section
  const hasReceipts = kassenData.receipts && kassenData.receipts.length > 0;
  fields.push({
    section: 'Kassen',
    sectionId: 'kassen',
    field: 'Belege Scans',
    isFilled: hasReceipts
  });
  const hasAbrechnungen = kassenData.abrechnungen && kassenData.abrechnungen.length > 0;
  fields.push({
    section: 'Kassen',
    sectionId: 'kassen',
    field: 'Abrechnungen Scans',
    isFilled: hasAbrechnungen
  });
  
  // Gäste section
  if (uebersichtData.eventType === 'konzert') {
    const agenturzettelScans = gaesteData.scannedDocuments || [];
    const hasAgenturzettel = agenturzettelScans.some(doc => doc.scanName === 'Agenturzettel');
    fields.push({
      section: 'Gäste',
      sectionId: 'gaeste',
      field: 'Agenturzettel Scan',
      isFilled: hasAgenturzettel
    });
  }
  
  fields.push({
    section: 'Gäste',
    sectionId: 'gaeste',
    field: 'Gäste Gesamt',
    isFilled: !!(gaesteData.gaesteGesamt && gaesteData.gaesteGesamt !== '')
  });
  
  return fields;
};

// Make available globally
window.AppValidation = {
  validateVVAtoSL,
  validateAllSectionsDetailed,
  hasHospitalityExtras,
  getRequiredFieldsCount,
  getVVAFieldsStatus,
  getAllFieldsStatus
};

