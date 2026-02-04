const { useEffect } = React;

function MainContent({
  activeSection,
  formData,
  highlightedFields,
  printedTemplates,
  handleFormDataChange,
  setPrintedTemplates
}) {
  // Automatically set Nightliner Parkplatz to "no" when event type is not "konzert"
  useEffect(() => {
    const eventType = formData.uebersicht?.eventType;
    const nightlinerParkplatz = formData.uebersicht?.nightlinerParkplatz;
    
    // If event type is set and not "konzert", and nightliner is not already "no"
    if (eventType && eventType !== 'konzert' && nightlinerParkplatz !== 'no') {
      handleFormDataChange('uebersicht', {
        ...formData.uebersicht,
        nightlinerParkplatz: 'no'
      });
    }
  }, [formData.uebersicht?.eventType]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'uebersicht':
        return (
          <UebersichtForm
            formData={formData.uebersicht}
            onDataChange={(data) => handleFormDataChange('uebersicht', data)}
            highlightedFields={highlightedFields.uebersicht || []}
            printedTemplates={printedTemplates}
            onPrintAll={() => {
              setPrintedTemplates({
                securityzettel: true,
                handtuchzettel: true,
                technikzettel: true,
                uebersichtzettel: true
              });
            }}
          />
        );
      case 'rider-extras':
        return (
          <RiderExtrasForm
            formData={formData['rider-extras']}
            onDataChange={(data) => handleFormDataChange('rider-extras', data)}
            highlightedFields={highlightedFields['rider-extras'] || []}
            printedTemplates={printedTemplates}
            onTemplatePrinted={(templateKey) => {
              setPrintedTemplates(prev => ({ ...prev, [templateKey]: true }));
            }}
          />
        );
      case 'tontechniker':
        return (
          <TontechnikerForm
            formData={formData.tontechniker}
            onDataChange={(data) => handleFormDataChange('tontechniker', data)}
            highlightedFields={highlightedFields.tontechniker || []}
            printedTemplates={printedTemplates}
            onTemplatePrinted={(templateKey) => {
              setPrintedTemplates(prev => ({ ...prev, [templateKey]: true }));
            }}
          />
        );
      case 'secu':
        return (
          <SecuForm
            formData={formData.secu}
            onDataChange={(data) => handleFormDataChange('secu', data)}
            highlightedFields={highlightedFields.secu || []}
            printedTemplates={printedTemplates}
            onTemplatePrinted={(templateKey) => {
              setPrintedTemplates(prev => ({ ...prev, [templateKey]: true }));
            }}
            shiftDate={formData.uebersicht?.date}
          />
        );
      case 'andere-mitarbeiter':
        return (
          <AndereMitarbeiterForm
            formData={formData['andere-mitarbeiter']}
            onDataChange={(data) => handleFormDataChange('andere-mitarbeiter', data)}
            highlightedFields={highlightedFields['andere-mitarbeiter'] || []}
          />
        );
      case 'gaeste':
        return (
          <GaesteForm
            formData={formData.gaeste}
            onDataChange={(data) => handleFormDataChange('gaeste', data)}
            highlightedFields={highlightedFields.gaeste || []}
            printedTemplates={printedTemplates}
            onTemplatePrinted={(templateKey) => {
              setPrintedTemplates(prev => ({ ...prev, [templateKey]: true }));
            }}
          />
        );
      case 'kassen':
        return (
          <KassenForm
            formData={formData.kassen}
            onDataChange={(data) => handleFormDataChange('kassen', data)}
            highlightedFields={highlightedFields.kassen || []}
            printedTemplates={printedTemplates}
            onTemplatePrinted={(templateKey) => {
              setPrintedTemplates(prev => ({ ...prev, [templateKey]: true }));
            }}
          />
        );
      case 'settings':
        return <SettingsForm />;
      default:
        return null;
    }
  };

  return (
    <main className="main-content">
      <div className="content-area">
        <div className={`content-title-row ${activeSection === 'uebersicht' ? 'content-title-row-with-button' : ''}`}>
          <h1>{window.AppConstants.sections.find(s => s.id === activeSection)?.name || window.AppConstants.settingsSection.name}</h1>
          {activeSection === 'uebersicht' && (
            <div id="uebersicht-print-button-container"></div>
          )}
        </div>
        {activeSection === 'rider-extras' && (
          <div className="travel-party-section">
            <div className="travel-party-nightliner-row">
              <div className="form-group-paired-container">
                <div className="form-group form-group-paired-left">
                  <label htmlFor="travelPartyGetInTitle">Travel Party Get In *</label>
                  <input
                    type="number"
                    id="travelPartyGetInTitle"
                    value={formData.uebersicht?.travelPartyGetIn || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFormDataChange('uebersicht', {
                        ...formData.uebersicht,
                        travelPartyGetIn: value,
                        travelPartyTatsachlich: value || formData.uebersicht?.travelPartyTatsachlich || ''
                      });
                    }}
                    className={`form-input ${highlightedFields['rider-extras']?.includes('Travel Party Get In') ? 'field-highlighted' : ''}`}
                    min="0"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="form-group form-group-paired-right">
                  <label htmlFor="travelPartyTatsachlichTitle">Tatsächlich</label>
                  <input
                    type="number"
                    id="travelPartyTatsachlichTitle"
                    value={formData.uebersicht?.travelPartyTatsachlich || ''}
                    onChange={(e) => {
                      handleFormDataChange('uebersicht', {
                        ...formData.uebersicht,
                        travelPartyTatsachlich: e.target.value
                      });
                    }}
                    className="form-input"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="nightliner-parkplatz-box">
                <div className={`form-group form-group-nightliner-radio ${highlightedFields['rider-extras']?.includes('Nightliner Parkplatz') ? 'field-highlighted-group' : ''}`}>
                  <label className="nightliner-radio-label">Nightliner Parkplatz *</label>
                  <div className="nightliner-radio-buttons">
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="nightlinerParkplatz"
                        value="yes"
                        checked={formData.uebersicht?.nightlinerParkplatz === 'yes'}
                        onChange={(e) => {
                          handleFormDataChange('uebersicht', {
                            ...formData.uebersicht,
                            nightlinerParkplatz: e.target.value
                          });
                        }}
                        className="nightliner-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Ja</span>
                    </label>
                    <label className="radio-option-label">
                      <input
                        type="radio"
                        name="nightlinerParkplatz"
                        value="no"
                        checked={formData.uebersicht?.nightlinerParkplatz === 'no'}
                        onChange={(e) => {
                          handleFormDataChange('uebersicht', {
                            ...formData.uebersicht,
                            nightlinerParkplatz: e.target.value
                          });
                        }}
                        className="nightliner-radio"
                        required
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-text">Nein</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {renderActiveSection()}
      </div>
    </main>
  );
}

