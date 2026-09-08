import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import webContentConfig from '../mongoose/config/webContentConfig.js';
import { mediaFields, mediaRefsInRecord, repointInRecord } from '../services/webMediaUsageService.js';

/**
 * The media reference logic, exercised against the real webContentConfig with no
 * database. buildUsageMap and repointReferences are thin loops over these pure
 * helpers — if the extraction and the rewrite are right per record, the map and
 * the bulk repoint are right too. Driving it from the live config is the point:
 * a new image/panel/gallery field added to the site is covered automatically,
 * the same reason websiteViews.test.js renders every declared type.
 */

const study = () => webContentConfig['case-studies'];

/** A case study touching a media field of every kind. */
function studyRecord() {
  return {
    uuid: 'r-1',
    title: 'Boundary works',
    card: { media: 'm1', alt: 'card alt' },
    before: { media: 'm1', alt: 'before alt', caption: 'before' },
    after: { media: 'm2', alt: 'after alt', caption: 'after' },
    gallery: [
      { media: 'm3', alt: 'g3', caption: '' },
      { media: 'm1', alt: 'g1', caption: 'in progress' },
    ],
  };
}

describe('webMediaUsageService — reference extraction', () => {
  it('finds media across image, panel and gallery fields', () => {
    const refs = mediaRefsInRecord(study(), studyRecord());
    const used = refs.map((r) => r.media);
    assert.deepEqual([...new Set(used)].sort(), ['m1', 'm2', 'm3']);
    // m1 is referenced four times: card, before, and one gallery slot... plus
    // nothing else — three fields, one of them a gallery slot.
    assert.equal(used.filter((u) => u === 'm1').length, 3);
  });

  it('ignores empty and absent references', () => {
    const refs = mediaRefsInRecord(study(), {
      card: { media: '', alt: '' },
      gallery: [{ media: '', alt: '' }, {}],
    });
    assert.equal(refs.length, 0);
  });

  it('returns nothing for a record with no media', () => {
    assert.deepEqual(mediaRefsInRecord(webContentConfig.posts, { title: 'x' }), []);
  });

  it('treats every image/panel/gallery field as media-bearing and nothing else', () => {
    for (const cfg of Object.values(webContentConfig)) {
      for (const f of mediaFields(cfg)) {
        assert.ok(['image', 'panel', 'gallery'].includes(f.type), `${f.name} is not a media type`);
      }
    }
  });
});

describe('webMediaUsageService — repoint', () => {
  it('rewrites only the fields that referenced the old uuid, preserving alt/caption', () => {
    const set = repointInRecord(study(), studyRecord(), 'm1', 'mX');
    assert.ok(set, 'expected a change set');
    // card + before + gallery changed; after (m2) did not.
    assert.deepEqual(Object.keys(set).sort(), ['before', 'card', 'gallery']);
    assert.equal(set.card.media, 'mX');
    assert.equal(set.card.alt, 'card alt', 'alt must survive the repoint');
    assert.equal(set.before.media, 'mX');
    assert.equal(set.before.caption, 'before', 'caption must survive the repoint');
    // Only the m1 gallery slot moves; the m3 slot is untouched.
    assert.equal(set.gallery[0].media, 'm3');
    assert.equal(set.gallery[1].media, 'mX');
    assert.equal(set.gallery[1].caption, 'in progress');
  });

  it('returns null when the record does not reference the old uuid', () => {
    assert.equal(repointInRecord(study(), studyRecord(), 'nope', 'mX'), null);
  });
});
