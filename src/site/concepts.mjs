// Original design-concept illustrations (inline SVG line drawings, drawn for this site). They are labeled
// "Design concept" everywhere they appear and never presented as completed work.
export const CONCEPTS = [
  { id: 'courtyard-elevation', title: 'Courtyard residence — front elevation', kind: 'Residential concept',
    text: 'Two low volumes linked by a glazed entry, deep roof overhangs for shade, and a planted courtyard behind the street wall.' },
  { id: 'kitchen-plan', title: 'Kitchen & dining — plan study', kind: 'Interior concept',
    text: 'A working triangle kept clear of circulation, a long island that seats four, and a walk-in pantry beside the garage entry.' },
  { id: 'lanai-section', title: 'Lanai & pool — section', kind: 'Outdoor living concept',
    text: 'A covered lanai with an outdoor kitchen under the roof line, stepping down to the pool deck and a shaded seating edge.' },
  { id: 'retail-plan', title: 'Retail build-out — plan', kind: 'Commercial concept',
    text: 'Storefront display zone, a central cash wrap, fitting rooms and an accessible restroom grouped along the rear service wall.' },
  { id: 'office-plan', title: 'Office suite — plan', kind: 'Commercial concept',
    text: 'Glass-fronted meeting rooms along the core, open work areas on the window wall, and a break room with acoustic separation.' },
  { id: 'addition-axon', title: 'Rear addition — massing study', kind: 'Residential concept',
    text: 'A single-story family room addition with a clerestory, tied into the existing roof line and opening to the yard.' },
];

const C = '#1E1D1B', B = '#9C6B3C', S = '#B9AF9F';
const svg = (inner, label) => `<svg viewBox="0 0 400 300" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const dim = (x1, y, x2, t) => `<g stroke="${B}" stroke-width=".8"><path d="M${x1} ${y}h${x2 - x1}M${x1} ${y - 4}v8M${x2} ${y - 4}v8"/></g><text x="${(x1 + x2) / 2}" y="${y - 6}" font-family="Instrument Sans, sans-serif" font-size="8" fill="${B}" stroke="none" text-anchor="middle" letter-spacing="1">${t}</text>`;
const label = (x, y, t, anchor = 'start') => `<text x="${x}" y="${y}" font-family="Instrument Sans, sans-serif" font-size="7.5" fill="#6B6357" stroke="none" text-anchor="${anchor}" letter-spacing=".8">${t}</text>`;
const tree = (x, y, r) => `<g stroke="${S}"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${y}" r="${r * .55}"/><path d="M${x} ${y + r}v${r * .7}"/></g>`;

const ART = {
  'courtyard-elevation': () => svg(`
    <path d="M20 232h360" stroke-width="1.6"/>
    <path d="M40 232V150h120v82M30 150h140" />
    <path d="M30 146h140" stroke-width="2.2"/>
    <path d="M58 172h34v60H58zM104 172h44v36h-44z"/><path d="M75 172v60M126 172v36" stroke="${S}"/>
    <path d="M160 232v-62h46v62" /><path d="M168 182h30v50h-30z" stroke="${B}"/><path d="M183 182v50" stroke="${B}" stroke-width=".8"/>
    <path d="M206 232V128h150v104M196 128h170" /><path d="M196 124h170" stroke-width="2.2"/>
    <path d="M222 148h118v48H222z"/><path d="M251 148v48M281 148v48M311 148v48" stroke="${S}"/>
    <path d="M222 206h50v26h-50z" stroke="${S}"/><path d="M286 206h54v26" stroke="${S}"/>
    ${tree(362, 196, 18)}${tree(26, 206, 12)}
    <path d="M10 236h380" stroke="${S}" stroke-dasharray="2 4"/>
    ${dim(40, 262, 356, 'FRONT ELEVATION — CONCEPT')}
  `, 'Line drawing: front elevation of a two-volume courtyard house'),

  'kitchen-plan': () => svg(`
    <path d="M40 40h320v220H40z" stroke-width="2.4"/>
    <path d="M40 40h320" stroke-width="2.4"/>
    <path d="M50 50h300v24H50zM50 74v120h24V74" />
    <circle cx="130" cy="62" r="7" stroke="${S}"/><circle cx="150" cy="62" r="7" stroke="${S}"/><path d="M200 54h40v16h-40z" stroke="${S}"/>
    <path d="M120 120h150v44H120z" stroke="${B}" stroke-width="1.4"/>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${140 + i * 37}" cy="176" r="7" stroke="${S}"/>`).join('')}
    <path d="M260 200h80v50h-80z" /><path d="M270 196v-6M290 196v-6M310 196v-6M330 196v-6M270 254v6M290 254v6M310 254v6M330 254v6" stroke="${S}"/>
    <path d="M50 200h60v50H50z" stroke="${S}"/>${label(80, 228, 'PANTRY', 'middle')}
    <path d="M110 250a20 20 0 0 1 20-20" stroke="${S}"/>
    ${label(195, 145, 'ISLAND', 'middle')}${label(300, 228, 'DINING', 'middle')}
    ${dim(50, 288, 350, 'KITCHEN & DINING — PLAN CONCEPT')}
  `, 'Line drawing: plan of a kitchen with island, pantry and dining table'),

  'lanai-section': () => svg(`
    <path d="M20 200h120M140 200v40h180v-40h60" stroke-width="1.6"/>
    <path d="M146 214h168" stroke="${B}" stroke-dasharray="6 5"/>
    <path d="M30 200V96M130 200V96" /><path d="M20 96h130" stroke-width="2.4"/><path d="M20 90h130" stroke="${S}"/>
    <path d="M40 170h50v30H40z"/><path d="M48 170v-10h34v10" stroke="${S}"/>
    <path d="M100 186h22v14" stroke="${S}"/>
    <path d="M328 200v-26h40v26" stroke="${S}"/><path d="M322 174h52" stroke="${S}"/>
    ${tree(360, 140, 22)}
    ${label(65, 160, 'OUTDOOR KITCHEN', 'middle')}${label(230, 232, 'POOL', 'middle')}${label(75, 86, 'COVERED LANAI', 'middle')}
    ${dim(30, 268, 370, 'LANAI & POOL — SECTION CONCEPT')}
  `, 'Line drawing: section through a covered lanai, outdoor kitchen and pool'),

  'retail-plan': () => svg(`
    <path d="M40 40h320v210H40z" stroke-width="2.4"/>
    <path d="M40 250h320" stroke="${B}" stroke-width="3"/><path d="M180 250v-8M220 250v-8" stroke="${B}"/>
    <path d="M60 210h40v24H60zM300 210h40v24h-40z" stroke="${S}"/>
    <path d="M160 140h80v30h-80z" stroke="${B}" stroke-width="1.4"/>
    <path d="M60 60h12v120H60zM328 60h12v120h-12z" stroke="${S}"/>
    <path d="M100 40v50h60V40M160 40v50h60V40" /><path d="M220 40v60h80V40" />
    ${label(130, 70, 'FITTING', 'middle')}${label(190, 70, 'FITTING', 'middle')}${label(260, 74, 'RESTROOM', 'middle')}
    <circle cx="260" cy="82" r="14" stroke="${S}" stroke-dasharray="2 3"/>
    ${label(200, 160, 'CASH WRAP', 'middle')}${label(200, 238, 'STOREFRONT', 'middle')}
    ${dim(40, 280, 360, 'RETAIL BUILD-OUT — PLAN CONCEPT')}
  `, 'Line drawing: retail tenant plan with storefront, cash wrap, fitting rooms and restroom'),

  'office-plan': () => svg(`
    <path d="M30 40h340v210H30z" stroke-width="2.4"/>
    <path d="M30 40h340" stroke="${B}" stroke-width="3"/>
    <path d="M150 120h100v70H150z" stroke-width="1.6"/>${label(200, 160, 'CORE', 'middle')}
    <path d="M150 120V90h50v30M200 90h50v30" stroke="${B}"/>${label(175, 108, 'MEET', 'middle')}${label(225, 108, 'MEET', 'middle')}
    ${[0, 1, 2, 3].map((i) => `<path d="M${50 + i * 24} 60h16v10h-16z" stroke="${S}"/>`).join('')}
    ${[0, 1, 2, 3].map((i) => `<path d="M${272 + i * 22} 60h14v10h-14z" stroke="${S}"/>`).join('')}
    <path d="M30 200h90v50" /><path d="M48 214h50v20H48z" stroke="${S}"/>${label(75, 246, 'BREAK', 'middle')}
    <path d="M280 200h90M280 200v50" /><path d="M300 214h50v24h-50z" stroke="${S}"/>${label(325, 246, 'CONFERENCE', 'middle')}
    ${dim(30, 280, 370, 'OFFICE SUITE — PLAN CONCEPT')}
  `, 'Line drawing: office suite plan with meeting rooms around a central core'),

  'addition-axon': () => svg(`
    <path d="M60 200l110-50 130 40-110 50z" stroke="${S}"/>
    <path d="M60 200v-70l110-50v70M170 80l60-28 70 22-60 28" />
    <path d="M170 150V80M300 190v-80l-130-40" /><path d="M300 110L190 160v70" stroke="${B}" stroke-width="1.6"/>
    <path d="M190 160l-20-10" stroke="${B}"/><path d="M190 230l110-40" stroke="${B}"/>
    <path d="M206 168l78-30v14l-78 30z" stroke="${B}" stroke-width=".9"/>
    <path d="M220 200l50-18v30l-50 18z" stroke="${S}"/>
    ${label(110, 220, 'EXISTING', 'middle')}${label(258, 250, 'ADDITION', 'middle')}
    ${dim(60, 280, 340, 'REAR ADDITION — MASSING CONCEPT')}
  `, 'Line drawing: axonometric massing of a single-story rear addition'),
};

export const conceptArt = (id) => (ART[id] ? ART[id]() : '');
