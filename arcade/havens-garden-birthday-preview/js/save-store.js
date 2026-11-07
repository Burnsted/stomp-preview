'use strict';
/* Versioned save store — schemaVersion + revision + tab writerId.
   No saveRichness gate. Rotating recovery backups + tombstone after reset. */
const HGSaveStore = (() => {
  const SCHEMA_VERSION = 9;
  const LAYOUT_VERSION = 3;
  const BACKUP_N = 5;
  const TAB_ID = (() => {
    try {
      let id = sessionStorage.getItem('havensGarden.tabId');
      if (!id) {
        id = 'tab-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
        sessionStorage.setItem('havensGarden.tabId', id);
      }
      return id;
    } catch (e) {
      return 'tab-' + Date.now().toString(36);
    }
  })();

  let PK = 'havensGarden.birthday.v2';
  let PK_LEGACY = 'havensGarden.v1';
  let PK_PRIOR = ['havensGarden.v1', 'havensGarden.birthday.v1', 'havensGarden.preview.v1', 'havensGarden.polish.v1'];
  let ignoreStorage = false;
  let onRemoteNewer = null;

  function keys() {
    return {
      pk: PK,
      tombstone: PK + '.tombstone',
      preMig: PK + '.pre-migration',
      backup: (i) => PK + '.recovery.' + i,
      backupMeta: PK + '.recovery.meta'
    };
  }

  function configure(opts) {
    if (opts.pk) PK = opts.pk;
    if (opts.pkLegacy) PK_LEGACY = opts.pkLegacy;
    if (opts.pkPrior) PK_PRIOR = opts.pkPrior.slice();
    if (typeof opts.onRemoteNewer === 'function') onRemoteNewer = opts.onRemoteNewer;
  }

  function parse(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  }
  function write(key, obj) {
    ignoreStorage = true;
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
    // release on next tick so our own write doesn't look remote
    setTimeout(() => { ignoreStorage = false; }, 0);
  }
  function remove(key) {
    ignoreStorage = true;
    try { localStorage.removeItem(key); } catch (e) {}
    setTimeout(() => { ignoreStorage = false; }, 0);
  }

  function hasTombstone() {
    return !!parse(keys().tombstone);
  }

  function writeTombstone(reason) {
    write(keys().tombstone, {
      at: Date.now(),
      reason: reason || 'parent-reset',
      writerId: TAB_ID
    });
  }

  function stamp(save, reason) {
    if (!save || typeof save !== 'object') return save;
    save.schemaVersion = Math.max(SCHEMA_VERSION, save.schemaVersion | 0);
    save.layoutVersion = save.layoutVersion | 0;
    save.revision = (save.revision | 0) + 1;
    save.writerId = TAB_ID;
    save.savedAt = Date.now();
    save.saveReason = reason || 'persist';
    return save;
  }

  function rotateBackup(saveSnapshot) {
    const k = keys();
    let meta = parse(k.backupMeta) || { next: 0, count: 0 };
    const i = meta.next % BACKUP_N;
    write(k.backup(i), {
      at: Date.now(),
      revision: saveSnapshot.revision | 0,
      writerId: TAB_ID,
      save: saveSnapshot
    });
    meta.next = (i + 1) % BACKUP_N;
    meta.count = Math.min(BACKUP_N, (meta.count | 0) + 1);
    write(k.backupMeta, meta);
  }

  function listBackups() {
    const k = keys();
    const meta = parse(k.backupMeta) || { next: 0, count: 0 };
    const out = [];
    for (let i = 0; i < BACKUP_N; i++) {
      const b = parse(k.backup(i));
      if (b && b.save) {
        out.push({
          index: i,
          at: b.at,
          revision: b.revision | 0,
          writerId: b.writerId,
          flowerPoints: (b.save.extras && b.save.extras.flowerPoints) | 0,
          beds: (b.save.beds || []).filter(Boolean).length,
          ghSize: b.save.ghSize | 0
        });
      }
    }
    // pre-migration snapshot
    const pre = parse(k.preMig);
    if (pre && pre.save) {
      out.push({
        index: 'pre-migration',
        at: pre.at,
        revision: pre.revision | 0,
        writerId: pre.writerId || 'migration',
        flowerPoints: (pre.save.extras && pre.save.extras.flowerPoints) | 0,
        beds: (pre.save.beds || []).filter(Boolean).length,
        ghSize: pre.save.ghSize | 0,
        kind: 'pre-migration'
      });
    }
    out.sort((a, b) => (b.at | 0) - (a.at | 0));
    return out;
  }

  function readBackup(index) {
    const k = keys();
    if (index === 'pre-migration') {
      const pre = parse(k.preMig);
      return pre && pre.save ? pre.save : null;
    }
    const b = parse(k.backup(index | 0));
    return b && b.save ? b.save : null;
  }

  function savePreMigration(save) {
    write(keys().preMig, {
      at: Date.now(),
      revision: save.revision | 0,
      writerId: TAB_ID,
      save: JSON.parse(JSON.stringify(save))
    });
  }

  /**
   * Persist SAVE. Never uses flower-count richness gating.
   * Skips write if disk has a strictly newer revision from another tab.
   */
  function persist(save, reason, opts) {
    opts = opts || {};
    if (!save) return { ok: false, reason: 'no-save' };
    const k = keys();
    try {
      const disk = parse(k.pk);
      if (disk && !opts.force) {
        const diskRev = disk.revision | 0;
        const localRev = save.revision | 0;
        if (diskRev > localRev && disk.writerId && disk.writerId !== TAB_ID) {
          return { ok: false, reason: 'stale-tab', diskRev, localRev, disk };
        }
      }
      stamp(save, reason);
      write(k.pk, save);
      // Rotate recovery backup on meaningful gameplay events
      const important = /plant|water|grow|buy|harvest|undo|reset|migrate|backup|restore|interrupt/i.test(reason || '');
      if (important || opts.backup) rotateBackup(JSON.parse(JSON.stringify(save)));
      return { ok: true, revision: save.revision | 0 };
    } catch (e) {
      return { ok: false, reason: 'err', error: String(e && e.message || e) };
    }
  }

  /**
   * Load authoritative birthday save, or import legacy exactly once.
   * Tombstone blocks legacy/backup auto-restore.
   */
  function loadInitial(migrateFn) {
    const k = keys();
    const tomb = hasTombstone();
    let v2 = parse(k.pk);

    if (v2 && typeof v2 === 'object') {
      // Birthday save exists → authoritative (even if lean). Never re-import legacy.
      if (!v2.legacyImported) v2.legacyImported = 1;
      const s = migrateFn(v2);
      s.legacyImported = 1;
      if (s.schemaVersion == null) s.schemaVersion = SCHEMA_VERSION;
      return { save: s, source: 'birthday.v2', importedLegacy: false };
    }

    if (tomb) {
      // Reset tombstone: fresh garden, no legacy resurrection
      const s = migrateFn(null);
      s.legacyImported = 1;
      s.resetTombstone = 1;
      s.schemaVersion = SCHEMA_VERSION;
      persist(s, 'boot-after-tombstone', { force: true });
      return { save: s, source: 'tombstone-fresh', importedLegacy: false };
    }

    // Import legacy exactly once
    let best = null;
    [PK_LEGACY].concat(PK_PRIOR).forEach((key) => {
      const raw = parse(key);
      if (!raw) return;
      if (!best) best = raw;
    });
    // Prefer richer-looking legacy only for first import selection among priors
    PK_PRIOR.forEach((key) => {
      const raw = parse(key);
      if (!raw) return;
      const beds = (raw.beds || []).filter(Boolean).length;
      const bestBeds = best ? (best.beds || []).filter(Boolean).length : -1;
      if (beds > bestBeds) best = raw;
    });

    if (best) {
      savePreMigration(best);
      const s = migrateFn(best);
      s.legacyImported = 1;
      s.schemaVersion = SCHEMA_VERSION;
      persist(s, 'legacy-import-once', { force: true, backup: true });
      return { save: s, source: 'legacy-import', importedLegacy: true };
    }

    const s = migrateFn(null);
    s.legacyImported = 1;
    s.schemaVersion = SCHEMA_VERSION;
    persist(s, 'fresh', { force: true });
    return { save: s, source: 'fresh', importedLegacy: false };
  }

  function adoptRemote(disk, migrateFn) {
    if (!disk) return null;
    const s = migrateFn(disk);
    if (onRemoteNewer) onRemoteNewer(s);
    return s;
  }

  function bindStorage() {
    window.addEventListener('storage', (ev) => {
      if (ignoreStorage) return;
      if (!ev || ev.key !== PK) return;
      let disk = null;
      try { disk = ev.newValue ? JSON.parse(ev.newValue) : null; } catch (e) { return; }
      if (!disk) return;
      if (disk.writerId === TAB_ID) return;
      if (onRemoteNewer) onRemoteNewer(disk);
    });
  }

  return {
    SCHEMA_VERSION, LAYOUT_VERSION, BACKUP_N, TAB_ID,
    configure, keys, parse, persist, stamp, loadInitial,
    hasTombstone, writeTombstone, rotateBackup, listBackups, readBackup,
    savePreMigration, bindStorage, adoptRemote, write, remove
  };
})();

window.HGSaveStore = HGSaveStore;
