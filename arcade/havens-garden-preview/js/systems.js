'use strict';
/* Haven's Garden — shop, hive/jars, bugs, color-by-number (v0.9-go)
   Original kid-garden systems. Feel from garden toys — no copied IP. */

const HGSystems = (() => {
  const SHOP = [
    { id: 'greenhouse', label: 'Bigger greenhouse', cost: 50, desc: 'More beds to plant' },
    { id: 'shovel', label: 'Shovel', cost: 10, desc: 'Faster planting' },
    { id: 'sparkle', label: 'Sparkle basket', cost: 15, desc: 'Pick 2 at once · 30s' }
  ];

  const CBN_PALETTE = [
    '#ffd23c', // 1 yellow
    '#7ec8ff', // 2 sky
    '#5ecf7a', // 3 green
    '#ff9ec8', // 4 pink
    '#ff5a5a', // 5 red
    '#a86f34', // 6 brown
    '#ff9a2a', // 7 orange
    '#c8a0ff', // 8 purple
    '#3c8237', // 9 dark green
    '#e8b020'  // 10 gold
  ];

  /** Easy→Hard ladder. Regions are normalized 0..1 over the page art. */
  function buildCbnPages() {
    const pages = [];
    // 0 — ultra easy sun + hill
    pages.push({
      id: 'easy-sun', title: 'Sunny hill', bg: null, colors: 5,
      regions: [
        { id: 'sun', n: 1, shape: 'ellipse', x: 0.22, y: 0.18, w: 0.28, h: 0.18 },
        { id: 'sky', n: 2, shape: 'rect', x: 0.0, y: 0.0, w: 1, h: 0.42 },
        { id: 'hill', n: 3, shape: 'ellipse', x: 0.5, y: 0.72, w: 1.2, h: 0.55 },
        { id: 'petal', n: 4, shape: 'ellipse', x: 0.32, y: 0.52, w: 0.16, h: 0.12 },
        { id: 'center', n: 1, shape: 'ellipse', x: 0.32, y: 0.52, w: 0.06, h: 0.06 },
        { id: 'bug', n: 5, shape: 'ellipse', x: 0.72, y: 0.70, w: 0.14, h: 0.10 }
      ]
    });
    // 1 — easy meadow concept plate
    pages.push({
      id: 'easy-meadow', title: 'Meadow', bg: 'cbnEasyMeadow', colors: 5,
      regions: [
        { id: 'sun', n: 1, shape: 'ellipse', x: 0.18, y: 0.14, w: 0.22, h: 0.14 },
        { id: 'sky', n: 2, shape: 'rect', x: 0, y: 0, w: 1, h: 0.38 },
        { id: 'grass', n: 3, shape: 'rect', x: 0, y: 0.38, w: 1, h: 0.45 },
        { id: 'petals', n: 4, shape: 'ellipse', x: 0.28, y: 0.48, w: 0.2, h: 0.14 },
        { id: 'ctr', n: 1, shape: 'ellipse', x: 0.28, y: 0.48, w: 0.07, h: 0.07 },
        { id: 'lady', n: 5, shape: 'ellipse', x: 0.72, y: 0.72, w: 0.16, h: 0.12 }
      ]
    });
    // 2 — flower + ladybug
    pages.push({
      id: 'easy-lady', title: 'Ladybug', bg: null, colors: 5,
      regions: [
        { id: 'sky', n: 2, shape: 'rect', x: 0, y: 0, w: 1, h: 0.35 },
        { id: 'hill', n: 3, shape: 'rect', x: 0, y: 0.35, w: 1, h: 0.65 },
        { id: 'p1', n: 4, shape: 'ellipse', x: 0.35, y: 0.42, w: 0.22, h: 0.16 },
        { id: 'c1', n: 1, shape: 'ellipse', x: 0.35, y: 0.42, w: 0.07, h: 0.07 },
        { id: 'body', n: 5, shape: 'ellipse', x: 0.68, y: 0.62, w: 0.2, h: 0.14 },
        { id: 'head', n: 1, shape: 'ellipse', x: 0.58, y: 0.58, w: 0.08, h: 0.08 }
      ]
    });
    // 3-5 medium meadows
    for (let i = 0; i < 3; i++) {
      const regs = [
        { id: 'sky', n: 2, shape: 'rect', x: 0, y: 0, w: 1, h: 0.32 },
        { id: 'hill', n: 3, shape: 'rect', x: 0, y: 0.32, w: 1, h: 0.68 }
      ];
      for (let f = 0; f < 3 + i; f++) {
        const x = 0.18 + f * 0.22;
        regs.push({ id: 'fl' + f, n: 4, shape: 'ellipse', x, y: 0.55, w: 0.14, h: 0.12 });
        regs.push({ id: 'fc' + f, n: 1, shape: 'ellipse', x, y: 0.55, w: 0.05, h: 0.05 });
      }
      if (i > 0) regs.push({ id: 'tree', n: 9, shape: 'ellipse', x: 0.78, y: 0.40, w: 0.2, h: 0.22 });
      if (i > 1) regs.push({ id: 'path', n: 6, shape: 'rect', x: 0.4, y: 0.55, w: 0.2, h: 0.4 });
      pages.push({ id: 'mid-meadow-' + i, title: 'Field ' + (i + 1), bg: null, colors: 6 + i, regions: regs });
    }
    // 6 — mid greenhouse concept
    pages.push({
      id: 'mid-gh', title: 'Greenhouse', bg: 'cbnMidGreenhouse', colors: 7,
      regions: [
        { id: 'sky', n: 2, shape: 'rect', x: 0, y: 0, w: 1, h: 0.28 },
        { id: 'hill', n: 3, shape: 'rect', x: 0, y: 0.28, w: 1, h: 0.2 },
        { id: 'glass', n: 2, shape: 'rect', x: 0.22, y: 0.22, w: 0.56, h: 0.36 },
        { id: 'doorL', n: 6, shape: 'rect', x: 0.18, y: 0.40, w: 0.14, h: 0.28 },
        { id: 'doorR', n: 6, shape: 'rect', x: 0.68, y: 0.40, w: 0.14, h: 0.28 },
        { id: 'box1', n: 6, shape: 'rect', x: 0.12, y: 0.72, w: 0.22, h: 0.14 },
        { id: 'box2', n: 6, shape: 'rect', x: 0.39, y: 0.70, w: 0.22, h: 0.14 },
        { id: 'box3', n: 6, shape: 'rect', x: 0.66, y: 0.72, w: 0.22, h: 0.14 },
        { id: 'f1', n: 5, shape: 'ellipse', x: 0.18, y: 0.68, w: 0.08, h: 0.08 },
        { id: 'f2', n: 4, shape: 'ellipse', x: 0.48, y: 0.66, w: 0.08, h: 0.08 },
        { id: 'f3', n: 4, shape: 'ellipse', x: 0.74, y: 0.68, w: 0.08, h: 0.08 },
        { id: 'can', n: 7, shape: 'ellipse', x: 0.5, y: 0.86, w: 0.14, h: 0.1 }
      ]
    });
    // 7-9 denser garden / rows
    for (let i = 0; i < 3; i++) {
      const regs = [
        { id: 'sky', n: 2, shape: 'rect', x: 0, y: 0, w: 1, h: 0.25 },
        { id: 'floor', n: 6, shape: 'rect', x: 0, y: 0.55, w: 1, h: 0.45 }
      ];
      for (let r = 0; r < 2 + i; r++) {
        for (let c = 0; c < 4; c++) {
          const n = [4, 5, 1, 8][c % 4];
          regs.push({
            id: 'cell' + r + c, n,
            shape: 'ellipse',
            x: 0.15 + c * 0.2,
            y: 0.38 + r * 0.16,
            w: 0.1, h: 0.08
          });
        }
      }
      pages.push({ id: 'rows-' + i, title: 'Flower rows', bg: i === 2 ? 'conceptRows' : null, colors: 8, regions: regs });
    }
    // 10 — hard hive/jars concept
    pages.push({
      id: 'hard-hive', title: 'Hive & jars', bg: 'cbnHardHive', colors: 10,
      regions: [
        { id: 'hive', n: 1, shape: 'rect', x: 0.25, y: 0.08, w: 0.5, h: 0.32 },
        { id: 'comb', n: 1, shape: 'ellipse', x: 0.5, y: 0.22, w: 0.28, h: 0.18 },
        { id: 'shelf', n: 6, shape: 'rect', x: 0.12, y: 0.42, w: 0.76, h: 0.08 },
        { id: 'j1', n: 10, shape: 'ellipse', x: 0.22, y: 0.52, w: 0.1, h: 0.14 },
        { id: 'j2', n: 10, shape: 'ellipse', x: 0.38, y: 0.52, w: 0.1, h: 0.14 },
        { id: 'j3', n: 10, shape: 'ellipse', x: 0.54, y: 0.52, w: 0.1, h: 0.14 },
        { id: 'j4', n: 8, shape: 'ellipse', x: 0.70, y: 0.52, w: 0.1, h: 0.14 },
        { id: 'flL', n: 5, shape: 'ellipse', x: 0.22, y: 0.78, w: 0.18, h: 0.14 },
        { id: 'flR', n: 4, shape: 'ellipse', x: 0.72, y: 0.78, w: 0.18, h: 0.14 },
        { id: 'leaf', n: 9, shape: 'ellipse', x: 0.5, y: 0.82, w: 0.16, h: 0.1 },
        { id: 'bee1', n: 7, shape: 'ellipse', x: 0.18, y: 0.18, w: 0.1, h: 0.08 },
        { id: 'bee2', n: 2, shape: 'ellipse', x: 0.82, y: 0.28, w: 0.1, h: 0.08 }
      ]
    });
    // 11-14 denser hive/meadow hard
    for (let i = 0; i < 4; i++) {
      const regs = [
        { id: 'sky', n: 2, shape: 'rect', x: 0, y: 0, w: 1, h: 0.22 },
        { id: 'ground', n: 3, shape: 'rect', x: 0, y: 0.55, w: 1, h: 0.45 }
      ];
      const nFlowers = 8 + i * 2;
      for (let f = 0; f < nFlowers; f++) {
        const x = 0.1 + (f % 5) * 0.18;
        const y = 0.35 + ((f / 5) | 0) * 0.18;
        regs.push({ id: 'f' + f, n: (f % 5) + 4, shape: 'ellipse', x, y, w: 0.09, h: 0.08 });
        regs.push({ id: 'c' + f, n: 1, shape: 'ellipse', x, y, w: 0.035, h: 0.035 });
      }
      if (i >= 1) regs.push({ id: 'hive', n: 7, shape: 'ellipse', x: 0.5, y: 0.28, w: 0.22, h: 0.2 });
      if (i >= 2) {
        for (let j = 0; j < 4; j++) {
          regs.push({ id: 'jar' + j, n: 10, shape: 'ellipse', x: 0.2 + j * 0.18, y: 0.72, w: 0.08, h: 0.12 });
        }
      }
      pages.push({
        id: 'hard-' + i,
        title: i < 2 ? 'Busy meadow' : 'Honey garden',
        bg: i === 3 ? 'conceptHive' : null,
        colors: 10,
        regions: regs
      });
    }
    return pages;
  }

  const CBN_PAGES = buildCbnPages();

  function hitRegion(reg, nx, ny) {
    if (reg.shape === 'rect') {
      return nx >= reg.x && nx <= reg.x + reg.w && ny >= reg.y && ny <= reg.y + reg.h;
    }
    const cx = reg.x, cy = reg.y, rx = (reg.w || 0.1) / 2, ry = (reg.h || 0.1) / 2;
    const dx = (nx - cx) / Math.max(0.001, rx);
    const dy = (ny - cy) / Math.max(0.001, ry);
    return dx * dx + dy * dy <= 1;
  }

  function freshExtras() {
    return {
      flowerPoints: 0,
      bees: 0,
      bugs: { ladybug: 0, grasshopper: 0, butterfly: 0 },
      honey: 0,
      jarsFull: 0,
      jarsEmpty: 8,
      owned: { greenhouse: 0, shovel: 0, sparkle: 0 },
      sparkleUntil: 0,
      cbnDone: [],
      cbnPage: 0,
      cbnFill: {},
      colorRows: 1,
      netMode: 0
    };
  }

  function migrateExtras(raw) {
    const base = freshExtras();
    if (!raw || typeof raw !== 'object') return base;
    const e = Object.assign(base, raw);
    if (!e.bugs || typeof e.bugs !== 'object') e.bugs = { ladybug: 0, grasshopper: 0, butterfly: 0 };
    if (!e.owned || typeof e.owned !== 'object') e.owned = { greenhouse: 0, shovel: 0, sparkle: 0 };
    if (!Array.isArray(e.cbnDone)) e.cbnDone = [];
    if (!e.cbnFill || typeof e.cbnFill !== 'object') e.cbnFill = {};
    e.jarsEmpty = Math.max(0, e.jarsEmpty | 0);
    e.jarsFull = Math.max(0, e.jarsFull | 0);
    return e;
  }

  return {
    SHOP,
    CBN_PALETTE,
    CBN_PAGES,
    hitRegion,
    freshExtras,
    migrateExtras
  };
})();

window.HGSystems = HGSystems;
