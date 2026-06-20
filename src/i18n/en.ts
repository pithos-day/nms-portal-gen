const en = {
  // Section headers
  'section.inputParams': 'Input Parameters',
  'section.portalAddress': 'Portal Address',
  'section.importAddress': 'Import Known Address',

  // Form labels
  'label.galaxy': 'Galaxy',
  'label.planet': 'Planet',
  'label.system': 'System',
  'label.coordY': 'Y Coordinate',
  'label.coordZ': 'Z Coordinate',
  'label.coordX': 'X Coordinate',

  // Tooltips
  'tooltip.planet': 'Planets 1 and 2 exist on all systems.',
  'tooltip.system': '121 is a black hole, 122 is an Atlas Station.',

  // ComboField
  'combo.search': 'Search by ID or name...',
  'combo.notFound': 'Not found',
  'combo.pleaseSelect': 'Please select',

  // Buttons
  'btn.copy': 'Copy',
  'btn.import': 'Import',

  // Placeholders
  'placeholder.addressInput': 'Enter portal address or galactic coordinates...',

  // Validation
  'validation.range': 'Range: {min} ~ {max}',

  // Alert
  'alert.galacticCenterTitle': 'Restricted Near Galactic Center',
  'alert.galacticCenterDesc': 'Portals cannot be used within 3,000 light-years of the galactic center.',

  // PortalDisplay
  'portal.systemRegion': 'System {system} - Region {region}',
  'portal.addressLabel': 'Portal Address',
  'portal.coordsLabel': 'Galactic Coordinates',

  // Footer
  'footer.tagline': "No Man's Sky · Coordinates → Portal Address Converter",
  'footer.about': 'About This Site',

  // About page
  'about.disclaimer': 'Disclaimer',
  'about.disclaimerText': "This is a fan-made site and is not affiliated with 'No Man's Sky' or Hello Games.",
  'about.references': 'References',
  'about.ref.portalCoords': 'How Portal Addresses and Galactic Coordinates Work',
  'about.ref.namingSystem': 'Planet, System, and Region Naming System',
  'about.ref.font': 'Font',
  'about.ref.testData': 'Test Data',

  // CoordViewer
  'viewer.title': '3D Viewer',
  'viewer.distance': 'Approx. {dist} light-years to center',
  'viewer.currentLocation': 'Current Location',
} as const;

export default en;
