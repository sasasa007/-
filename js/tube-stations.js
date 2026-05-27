// js/tube-stations.js
// 여행에서 쓸 주요 런던 지하철역 + 노선. (x/y는 향후 맵 오버레이용 예비 필드)
window.TUBE_STATIONS = [
  { id: 'kings_cross',       name: "King's Cross St. Pancras", x: 40, y: 30, lines: ['northern','victoria','piccadilly','circle','hammersmith','metropolitan'] },
  { id: 'euston',            name: 'Euston',                   x: 38, y: 33, lines: ['northern','victoria'] },
  { id: 'angel',             name: 'Angel',                    x: 43, y: 30, lines: ['northern'] },
  { id: 'old_street',        name: 'Old Street',               x: 47, y: 34, lines: ['northern'] },
  { id: 'holborn',           name: 'Holborn',                  x: 40, y: 44, lines: ['central','piccadilly'] },
  { id: 'tottenham_ct_rd',   name: 'Tottenham Court Road',     x: 37, y: 44, lines: ['central','northern','elizabeth'] },
  { id: 'covent_garden',     name: 'Covent Garden',            x: 39, y: 47, lines: ['piccadilly'] },
  { id: 'leicester_sq',      name: 'Leicester Square',         x: 37, y: 48, lines: ['northern','piccadilly'] },
  { id: 'oxford_circus',     name: 'Oxford Circus',            x: 34, y: 43, lines: ['central','bakerloo','victoria'] },
  { id: 'bond_street',       name: 'Bond Street',              x: 31, y: 43, lines: ['central','jubilee','elizabeth'] },
  { id: 'marble_arch',       name: 'Marble Arch',              x: 29, y: 44, lines: ['central'] },
  { id: 'paddington',        name: 'Paddington',               x: 24, y: 40, lines: ['circle','district','hammersmith','bakerloo','elizabeth'] },
  { id: 'notting_hill_gate', name: 'Notting Hill Gate',        x: 22, y: 52, lines: ['central','circle','district'] },
  { id: 'high_st_kens',      name: 'High Street Kensington',   x: 22, y: 58, lines: ['circle','district'] },
  { id: 'knightsbridge',     name: 'Knightsbridge',            x: 28, y: 55, lines: ['piccadilly'] },
  { id: 'hyde_park_corner',  name: 'Hyde Park Corner',         x: 30, y: 53, lines: ['piccadilly'] },
  { id: 'green_park',        name: 'Green Park',               x: 33, y: 52, lines: ['jubilee','victoria','piccadilly'] },
  { id: 'piccadilly_circus', name: 'Piccadilly Circus',        x: 35, y: 49, lines: ['bakerloo','piccadilly'] },
  { id: 'charing_cross',     name: 'Charing Cross',            x: 37, y: 53, lines: ['bakerloo','northern'] },
  { id: 'embankment',        name: 'Embankment',               x: 38, y: 55, lines: ['circle','district','bakerloo','northern'] },
  { id: 'westminster',       name: 'Westminster',              x: 37, y: 58, lines: ['circle','district','jubilee'] },
  { id: 'st_james_park',     name: "St. James's Park",         x: 35, y: 61, lines: ['circle','district'] },
  { id: 'victoria',          name: 'Victoria',                 x: 33, y: 63, lines: ['circle','district','victoria'] },
  { id: 'sloane_sq',         name: 'Sloane Square',            x: 30, y: 63, lines: ['circle','district'] },
  { id: 'waterloo',          name: 'Waterloo',                 x: 39, y: 58, lines: ['bakerloo','northern','jubilee','waterloo_city'] },
  { id: 'liverpool_st',      name: 'Liverpool Street',         x: 48, y: 42, lines: ['central','circle','metropolitan','hammersmith','elizabeth'] },
  { id: 'bank',              name: 'Bank',                     x: 46, y: 50, lines: ['central','northern','waterloo_city'] },
  { id: 'tower_hill',        name: 'Tower Hill',               x: 49, y: 52, lines: ['circle','district'] },
  { id: 'london_bridge',     name: 'London Bridge',            x: 47, y: 57, lines: ['northern','jubilee'] },
  { id: 'borough',           name: 'Borough',                  x: 45, y: 60, lines: ['northern'] },
  { id: 'elephant_castle',   name: 'Elephant & Castle',        x: 43, y: 65, lines: ['bakerloo','northern'] },
  { id: 'canary_wharf',      name: 'Canary Wharf',             x: 60, y: 55, lines: ['jubilee','elizabeth'] },
  { id: 'stratford',         name: 'Stratford',                x: 64, y: 36, lines: ['central','jubilee','elizabeth'] },
  { id: 'heathrow_123',      name: 'Heathrow Terminals 2 & 3', x: 7,  y: 57, lines: ['piccadilly','elizabeth'] },
  { id: 'heathrow_5',        name: 'Heathrow Terminal 5',      x: 7,  y: 51, lines: ['piccadilly','elizabeth'] },
];

// 노선 컬러 (TfL 공식)
window.TUBE_LINE_COLORS = {
  central:        '#E32017',
  jubilee:        '#A0A5A9',
  northern:       '#000000',
  victoria:       '#0098D4',
  piccadilly:     '#003688',
  district:       '#00782A',
  circle:         '#FFD300',
  bakerloo:       '#B36305',
  hammersmith:    '#F3A9BB',
  metropolitan:   '#9B0056',
  elizabeth:      '#6950A1',
  waterloo_city:  '#95CDBA',
};

// 노선 한글 표기 (배지용)
window.TUBE_LINE_KO = {
  central: '센트럴', jubilee: '주빌리', northern: '노던', victoria: '빅토리아',
  piccadilly: '피카딜리', district: '디스트릭트', circle: '서클', bakerloo: '베이컬루',
  hammersmith: '해머스미스', metropolitan: '메트로폴리탄', elizabeth: '엘리자베스', waterloo_city: '워털루&시티'
};
