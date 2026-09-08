/**
 * Where each media image is used, across the whole WEB namespace.
 *
 * The media library needs two things the media documents themselves cannot
 * answer, because an image does not know who references it:
 *
 *  - **Before a delete**, so removing a photo cannot silently leave a hole on a
 *    published page. webController.postMediaDelete blocks on a non-empty usage
 *    list unless the editor explicitly forces it.
 *  - **On replace**, so a new upload can inherit every reference the old image
 *    had. Replace mints a *new* uuid (the public API caches media by uuid as
 *    immutable — see webApiController.js), then repointReferences() rewrites
 *    every field that pointed at the old uuid to the new one, so no page is left
 *    dangling and the immutable cache stays correct.
 *
 * All of this is derived from webContentConfig, not hardcoded: a media-bearing
 * field is any field whose type is image, panel or gallery. Add such a field to
 * a content type and it is scanned here automatically, the same config-driven
 * habit as the rest of the editor. The pure helpers (mediaRefsInRecord,
 * repointInRecord) take a record and touch no database, so the mapping is unit
 * tested without one — see tests/webMediaUsage.test.js.
 */
import mdb from '../mongoose/services/mongooseDatabaseService.js';
import webContentConfig from '../mongoose/config/webContentConfig.js';

/** Field types that hold a webMedia.uuid in a `.media` property. */
const MEDIA_FIELD_TYPES = new Set(['image', 'panel', 'gallery']);

/** The media-bearing fields of one content type. */
export function mediaFields(cfg) {
  return (cfg.fields || []).filter((f) => MEDIA_FIELD_TYPES.has(f.type));
}

/** The field that names a record: most types use `title`, accreditations `name`. */
function titleField(cfg) {
  return (cfg.fields || []).some((f) => f.name === 'title') ? 'title' : 'name';
}

/**
 * Every media reference a single record holds.
 *
 * Returns [{ field, media }] — one entry per referenced uuid, so a gallery of
 * four images yields four entries against the same field. Pure: no database.
 */
export function mediaRefsInRecord(cfg, record) {
  const out = [];
  if (!record) return out;
  for (const field of mediaFields(cfg)) {
    const val = record[field.name];
    if (!val) continue;
    if (field.type === 'gallery') {
      (Array.isArray(val) ? val : []).forEach((row) => {
        if (row && row.media) out.push({ field, media: row.media });
      });
    } else if (val.media) {
      out.push({ field, media: val.media });
    }
  }
  return out;
}

/**
 * A $set that repoints every reference to oldUuid onto newUuid within one
 * record, or null when the record references oldUuid nowhere.
 *
 * Only the fields that actually change are included, so a record with one
 * matching gallery slot rewrites that gallery and nothing else. Pure: the
 * caller decides how to persist it. Alt and caption are carried across
 * untouched — they describe the *usage*, not the file, so replacing the file
 * must not disturb them.
 */
export function repointInRecord(cfg, record, oldUuid, newUuid) {
  const set = {};
  for (const field of mediaFields(cfg)) {
    const val = record[field.name];
    if (!val) continue;
    if (field.type === 'gallery') {
      if (Array.isArray(val) && val.some((row) => row && row.media === oldUuid)) {
        set[field.name] = val.map((row) => (row && row.media === oldUuid ? { ...row, media: newUuid } : row));
      }
    } else if (val.media === oldUuid) {
      set[field.name] = { ...val, media: newUuid };
    }
  }
  return Object.keys(set).length ? set : null;
}

/** The content types that can reference media, with their loaded model. */
function typesWithMedia() {
  return Object.entries(webContentConfig)
    .filter(([, cfg]) => mediaFields(cfg).length && mdb.WEB[cfg.model])
    .map(([type, cfg]) => ({ type, cfg, Model: mdb.WEB[cfg.model] }));
}

/** Load the records of one content type. Singletons resolve to their one doc. */
async function loadRecords(cfg, Model) {
  if (cfg.singleton) {
    const doc = await Model.findOne({ key: 'site' }).lean();
    return doc ? [doc] : [];
  }
  return Model.find({}).select('-bytes').lean();
}

/** Where to send an editor to fix a usage. */
function editUrl(type, cfg, doc) {
  return cfg.singleton ? '/website/settings' : `/website/${type}/${doc.uuid}/edit`;
}

/**
 * A Map of mediaUuid → usage[], covering every content record.
 *
 * Each usage is { type, label, title, status, field, editUrl } — enough to tell
 * an editor which page uses the image and take them straight to it. The content
 * collections are small (case studies, posts, services, accreditations and the
 * settings singleton), so scanning them whole on each media page render is
 * cheaper than maintaining a reverse index that could drift.
 */
export async function buildUsageMap() {
  const map = new Map();
  const add = (media, usage) => {
    const list = map.get(media) || [];
    list.push(usage);
    map.set(media, list);
  };

  for (const { type, cfg, Model } of typesWithMedia()) {
    const tf = titleField(cfg);
    const records = await loadRecords(cfg, Model);
    for (const doc of records) {
      for (const ref of mediaRefsInRecord(cfg, doc)) {
        add(ref.media, {
          type,
          label: cfg.label,
          title: cfg.singleton ? cfg.label : (doc[tf] || '(untitled)'),
          status: doc.status || (cfg.singleton ? 'published' : 'draft'),
          field: ref.field.label,
          editUrl: editUrl(type, cfg, doc),
        });
      }
    }
  }
  return map;
}

/** The usages of a single image. */
export async function usageFor(mediaUuid) {
  return (await buildUsageMap()).get(mediaUuid) || [];
}

/**
 * Repoint every reference from oldUuid to newUuid across all content types.
 *
 * Returns the number of records changed. Persists one record at a time with a
 * targeted $set so a record referencing the image in two fields is written
 * once, and records that do not reference it are not touched at all.
 */
export async function repointReferences(oldUuid, newUuid, updatedBy) {
  let changed = 0;
  for (const { cfg, Model } of typesWithMedia()) {
    const records = await loadRecords(cfg, Model);
    for (const doc of records) {
      const set = repointInRecord(cfg, doc, oldUuid, newUuid);
      if (!set) continue;
      if (updatedBy) set.updatedBy = updatedBy;
      await Model.updateOne(cfg.singleton ? { key: 'site' } : { uuid: doc.uuid }, { $set: set });
      changed += 1;
    }
  }
  return changed;
}

export default {
  mediaFields,
  mediaRefsInRecord,
  repointInRecord,
  buildUsageMap,
  usageFor,
  repointReferences,
};
