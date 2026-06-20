const ja = {
  // Section headers
  'section.inputParams': '入力パラメータ',
  'section.portalAddress': 'ポータルアドレス',
  'section.importAddress': '既知のアドレスをインポート',

  // Form labels
  'label.galaxy': '銀河番号',
  'label.planet': '惑星番号',
  'label.system': '星系番号',
  'label.coordY': 'Y座標',
  'label.coordZ': 'Z座標',
  'label.coordX': 'X座標',

  // Tooltips
  'tooltip.planet': '1,2は全ての惑星に存在します。',
  'tooltip.system': '121はブラックホール、122はアトラスステーションで固定されています。',

  // ComboField
  'combo.search': 'IDまたは名前で検索...',
  'combo.notFound': '見つかりません',
  'combo.pleaseSelect': '選択してください',

  // Buttons
  'btn.copy': 'コピー',
  'btn.import': 'インポート',

  // Placeholders
  'placeholder.addressInput': 'ポータルアドレスか銀河座標を入力…',

  // Validation
  'validation.range': '範囲: {min} ～ {max}',

  // Alert
  'alert.galacticCenterTitle': '銀河中心付近の制限',
  'alert.galacticCenterDesc': '銀河の中心から半径3000光年以内の領域はポータルが使用できません。',

  // PortalDisplay
  'portal.systemRegion': '星系 {system} - エリア {region}',
  'portal.addressLabel': 'ポータルアドレス',
  'portal.coordsLabel': '銀河座標',

  // Footer
  'footer.tagline': "No Man's Sky · 座標 → ポータルアドレス変換",
  'footer.about': 'このサイトについて',

  // About page
  'about.disclaimer': '免責事項',
  'about.disclaimerText': "当サイトはファンサイトであり、『No Man's Sky』及びHello Gamesとは一切関係ありません。",
  'about.sourceCode': 'ソースコードは下記リポジトリで公開されています。',
  'about.references': '参考資料',
  'about.ref.portalCoords': 'ポータルアドレス及び銀河座標の仕組み',
  'about.ref.namingSystem': '惑星・星系・エリアの命名システム',
  'about.ref.font': 'フォント',
  'about.ref.testData': 'テスト用データ',

  // CoordViewer
  'viewer.title': '3Dビューア',
  'viewer.distance': '中心まで 約 {dist} 光年',
  'viewer.currentLocation': '現在地',
} as const;

export default ja;
