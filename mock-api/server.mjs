// Mock TaxonWorks API for local previews. Serves the example data in data.mjs
// in the same shapes as the real /api/v1 endpoints that TaxonPages and the
// installed panels request. Node built-ins only.
//
//   node mock-api/server.mjs [port]
//
// Endpoints that are not mocked answer 404 and are logged to the console.

import http from 'node:http'
import { TAXA, OCCURRENCES, NEWS, PROJECT_ID, referenceFor } from './data.mjs'

const OTU_OFFSET = 1000
const NAME_OFFSET = 2000
const IMAGE_OFFSET = 3000

const RANK_STRINGS = {
  root: 'NomenclaturalRank',
  order: 'NomenclaturalRank::Iczn::HigherClassificationGroup::Order',
  family: 'NomenclaturalRank::Iczn::FamilyGroup::Family',
  genus: 'NomenclaturalRank::Iczn::GenusGroup::Genus',
  species: 'NomenclaturalRank::Iczn::SpeciesGroup::Species'
}

const byId = new Map(TAXA.map((t) => [t.id, t]))
const children = (t) => TAXA.filter((c) => c.parent === t.id)
const descendants = (t) => children(t).flatMap((c) => [c, ...descendants(c)])
const ancestors = (t) => (t.parent ? [...ancestors(byId.get(t.parent)), byId.get(t.parent)] : [])

const otuId = (t) => t.id + OTU_OFFSET
const nameId = (t) => t.id + NAME_OFFSET
const taxonFromOtu = (id) => byId.get(Number(id) - OTU_OFFSET)
const taxonFromName = (id) => byId.get(Number(id) - NAME_OFFSET)

// Example "date added": later ids count as more recently added
const createdAt = (t) => new Date(Date.UTC(2026, 9, 1 + t.id)).toISOString()

const isSpecies = (t) => t.rank === 'species'
const fullName = (t) => (isSpecies(t) ? `${byId.get(t.parent).name} ${t.name}` : t.name)
const authorYear = (t) => (t.author ? (t.parenthetical ? `(${t.author}, ${t.year})` : `${t.author}, ${t.year}`) : '')
const nameHtml = (t) => (['genus', 'species'].includes(t.rank) ? `<i>${fullName(t)}</i>` : fullName(t))
const labelText = (t) => [fullName(t), authorYear(t)].filter(Boolean).join(' ')
const labelHtml = (t) => [nameHtml(t), authorYear(t)].filter(Boolean).join(' ')

function otu(t) {
  return {
    id: otuId(t),
    name: null,
    taxon_name_id: nameId(t),
    project_id: PROJECT_ID,
    global_id: `gid://taxon-works/Otu/${otuId(t)}`,
    object_tag: `<span class="otu_tag">${labelHtml(t)}</span>`
  }
}

function taxonName(t) {
  const original = t.original || fullName(t)
  return {
    id: nameId(t),
    name: t.name,
    parent_id: t.parent ? nameId(byId.get(t.parent)) : null,
    cached: fullName(t),
    cached_html: nameHtml(t),
    masculine_name: t.gender?.masculine ?? null,
    feminine_name: t.gender?.feminine ?? null,
    neuter_name: t.gender?.neuter ?? null,
    nomenclatural_code: 'iczn',
    etymology: t.etymology ?? null,
    rank: t.rank,
    rank_string: RANK_STRINGS[t.rank],
    type: 'Protonym',
    project_id: PROJECT_ID,
    cached_valid_taxon_name_id: nameId(t),
    cached_original_combination: original,
    cached_original_combination_html: isSpecies(t) ? `<i>${original}</i>` : original,
    cached_author: t.author ?? null,
    cached_author_year: authorYear(t),
    cached_is_available: true,
    cached_is_valid: true,
    year: t.year ?? null,
    created_at: createdAt(t),
    name_string: labelText(t),
    original_combination: `${isSpecies(t) ? `<i>${original}</i>` : original} ${t.author ?? ''}, ${t.year ?? ''}`
  }
}

function summary(t) {
  const parent = t.parent && byId.get(t.parent)
  const typeSpecies = t.typeSpecies && byId.get(t.typeSpecies)
  return {
    id: nameId(t),
    parent_id: parent ? nameId(parent) : null,
    name: t.name,
    is_valid: true,
    full_name: labelText(t),
    expanded_name: fullName(t),
    full_name_tag: labelHtml(t),
    nomenclatural_code: 'iczn',
    short_status: 'This name is valid/accepted.',
    status: '',
    rank: t.rank,
    rank_string: RANK_STRINGS[t.rank],
    author: t.author ?? null,
    year: t.year ?? null,
    pages: t.author ? '1' : null,
    original_citation: t.author ? referenceFor(t) : null,
    global_id: `gid://taxon-works/Protonym/${nameId(t)}`,
    ...(typeSpecies && {
      type_taxon_name_relationship: {
        object_taxon_name: labelHtml(t),
        subject_taxon_name: labelHtml(typeSpecies),
        subject_status: 'type species (example designation) of',
        valid_subject_otu_id: otuId(typeSpecies)
      }
    }),
    descorator_status: [],
    parent: parent && {
      full_name: labelText(parent),
      author: parent.author ?? null,
      global_id: `gid://taxon-works/Protonym/${nameId(parent)}`,
      rank: parent.rank,
      expanded_name: fullName(parent)
    }
  }
}

function catalog(t) {
  const original = t.original || fullName(t)
  const timeline = t.author
    ? [
        {
          label: `${isSpecies(t) ? `<i>${original}</i>` : original} ${t.author}, ${t.year}: 1. `,
          year: t.year,
          ...(t.type && { type_label: t.type.label })
        },
        ...(t.synonyms || []).map((s) => ({ label: `${s}: 1 [example synonym]. `, year: 1900 }))
      ]
    : []

  const ranks = [t, ...descendants(t)].reduce((acc, d) => {
    acc[d.rank] ??= { rank: d.rank, taxa: 0, names: { valid: 0, valid_fossil: 0, valid_extant: 0, invalid: 0 } }
    acc[d.rank].taxa++
    acc[d.rank].names.valid++
    acc[d.rank].names.valid_extant++
    acc[d.rank].names.invalid += (d.synonyms || []).length
    return acc
  }, {})

  return {
    ...summary(t),
    timeline,
    sources: t.author ? [{ cached: referenceFor(t), url: null }] : [],
    stats: Object.values(ranks).filter((r) => r.rank !== 'root'),
    repositories: [[]]
  }
}

function taxonomy(t, depth) {
  return {
    otu_id: otuId(t),
    name: labelHtml(t),
    otu_clones: [],
    similar_otus: {},
    nomenclatural_synonyms: t.synonyms || [],
    common_names: [],
    descendants: depth > 0 ? children(t).map((c) => taxonomy(c, depth - 1)) : [],
    leaf_node: children(t).length === 0
  }
}

function occurrencesFor(t) {
  const otus = new Set([t, ...descendants(t)].map((d) => d.id))
  return OCCURRENCES.filter((o) => otus.has(o.otu))
}

function dwc(o, i) {
  const t = byId.get(o.otu)
  const genus = byId.get(t.parent)
  const family = byId.get(genus.parent)
  const [year, month, day] = (o.date || '').split('-')
  return {
    id: 50000 + i,
    basisOfRecord: o.basis === 'FieldOccurrence' ? 'HumanObservation' : 'PreservedSpecimen',
    catalogNumber: o.catalog,
    institutionCode: o.basis === 'CollectionObject' ? 'EXAMPLE' : undefined,
    country: o.country,
    stateProvince: o.state,
    verbatimLocality: o.locality,
    decimalLatitude: String(o.lat),
    decimalLongitude: String(o.lon),
    verbatimCoordinates: `${o.lat} ${o.lon}`,
    eventDate: o.date,
    year,
    month,
    day,
    individualCount: o.count,
    sex: o.sex,
    recordedBy: 'Example collector',
    order: 'Trichoptera',
    family: family.name,
    genus: genus.name,
    specificEpithet: t.name,
    scientificName: labelText(t),
    scientificNameAuthorship: authorYear(t),
    taxonRank: t.rank,
    typeStatus: o.typeStatus,
    occurrenceStatus: 'present',
    dwc_occurrence_object_id: 60000 + i,
    dwc_occurrence_object_type: o.basis,
    project_id: PROJECT_ID,
    otu_id: otuId(t)
  }
}

function pointFeatures(t) {
  return OCCURRENCES.map((o, i) => ({ o, i }))
    .filter(({ o }) => occurrencesFor(t).includes(o))
    .map(({ o, i }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [o.lon, o.lat, 0] },
      properties: {
        target: { id: otuId(t), label: labelText(t), type: 'Otu' },
        base: { type: o.basis, id: 60000 + i, label: `${o.basis} ${60000 + i} (example)` },
        shape: { type: 'Georeference', id: 70000 + i }
      }
    }))
}

// Higher ranks show one aggregate shape: a small square around each record.
function aggregateGeometry(t) {
  const d = 0.75
  return {
    type: 'MultiPolygon',
    coordinates: occurrencesFor(t).map(({ lon, lat }) => [
      [[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]
    ])
  }
}

const imagesFor = (t) => Array.from({ length: t.images || 0 }, (_, i) => IMAGE_OFFSET + t.id * 10 + i)
const imageTaxon = (imageId) => byId.get(Math.floor((imageId - IMAGE_OFFSET) / 10))

function imageInventory(t, base) {
  const ids = [t, ...descendants(t)].flatMap(imagesFor)
  return {
    image_order: ids,
    images: Object.fromEntries(
      ids.map((id) => {
        const url = `${base}/mock-images/${id}.svg`
        return [
          id,
          {
            // Relative like the real API: TaxonPages strips "/api/v1/" and prepends its url
            original_png: `/api/v1/mock-images/${id}.svg`,
            content_type: 'image/svg+xml',
            thumb: url,
            medium: url,
            depictions: [{ id: id + 100000, label: `Example depiction of ${labelText(imageTaxon(id))}`, depiction_type: 'Otu', depiction_object_id: otuId(imageTaxon(id)) }],
            attribution: { label: 'Example image. Placeholder for the mock API', license: null }
          }
        ]
      })
    )
  }
}

function placeholderSvg(imageId) {
  const t = imageTaxon(imageId)
  const n = (imageId % 10) + 1
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#e7ece9"/>
  <g fill="none" stroke="#5b7f6e" stroke-width="6" stroke-linecap="round">
    <path d="M250 260 C 380 170, 560 170, 640 250 C 560 300, 380 320, 250 260 Z" fill="#c9d8cf"/>
    <path d="M250 260 L 150 200 M250 262 L 140 240"/>
    <path d="M330 280 L 300 360 M400 290 L 390 370 M470 290 L 490 370"/>
  </g>
  <text x="400" y="430" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#2f4b3e">Example image ${n}: ${fullName(t)}</text>
  <text x="400" y="465" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#2f4b3e">Placeholder, not real data</text>
</svg>`
}

function stats() {
  const names = TAXA.filter((t) => t.rank !== 'root')
  return {
    data: {
      'Taxon names': names.length + names.reduce((n, t) => n + (t.synonyms || []).length, 0),
      Otus: names.length,
      'Project sources': names.filter((t) => t.author).length,
      Citations: names.filter((t) => t.author).length,
      Images: TAXA.reduce((n, t) => n + (t.images || 0), 0),
      Sounds: 0,
      'Collection objects': OCCURRENCES.filter((o) => o.basis === 'CollectionObject').length,
      'Field occurrences': OCCURRENCES.filter((o) => o.basis === 'FieldOccurrence').length
    },
    metadata: {}
  }
}

function paginated(res, list, query) {
  const per = Number(query.get('per') || 50)
  const page = Number(query.get('page') || 1)
  const headers = { 'pagination-total': list.length, 'pagination-page': page, 'pagination-per-page': per }
  return send(res, 200, list.slice((page - 1) * per, page * per), headers)
}

function taxonNamesQuery(query) {
  if (query.getAll('taxon_name_classification[]').some((c) => c.includes('Fossil'))) return []
  const ranks = query.getAll('rank[]')
  const list = TAXA.filter((t) => t.rank !== 'root')
    .filter((t) => !ranks.length || ranks.includes(RANK_STRINGS[t.rank]))
    .map(taxonName)
  return query.get('recent') === 'true' ? list.toSorted((a, b) => b.created_at.localeCompare(a.created_at)) : list
}

// One example source per authored taxon, newest first when recent=true
function sourcesQuery(query) {
  const list = TAXA.filter((t) => t.author).map((t) => ({
    id: 8000 + t.id,
    type: 'Source::Bibtex',
    cached: referenceFor(t),
    created_at: createdAt(t)
  }))
  return query.get('recent') === 'true' ? list.toSorted((a, b) => b.created_at.localeCompare(a.created_at)) : list
}

function autocomplete(term) {
  const q = term.toLowerCase()
  return TAXA.filter((t) => t.rank !== 'root' && labelText(t).toLowerCase().includes(q)).map((t) => ({
    id: otuId(t),
    gid: `gid://taxon-works/Otu/${otuId(t)}`,
    otu_valid_id: otuId(t),
    label: labelText(t),
    label_html: `<span class="otu_tag"><span class="otu_tag_taxon_name" title="${nameId(t)}">${labelHtml(t)}</span></span>`
  }))
}

function newsItem(n) {
  const date = new Date(`${n.date}T12:00:00Z`).toISOString()
  return {
    id: n.id,
    title: n.title,
    body_html: n.body,
    type: n.type,
    creator: n.creator,
    updater: n.creator,
    project_id: PROJECT_ID,
    created_at: date,
    updated_at: date
  }
}

// Newest first; news_id[] limits to pinned items
function newsQuery(query) {
  const ids = query.getAll('news_id[]').map(Number)
  return NEWS.filter((n) => !ids.length || ids.includes(n.id))
    .toSorted((a, b) => b.date.localeCompare(a.date))
    .map(newsItem)
}

const EXPOSED ='pagination-total,pagination-page,pagination-per-page'

function send(res, status, body, headers = {}, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'content-type': type,
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-expose-headers': EXPOSED,
    ...headers
  })
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

function route(req, res, base) {
  const url = new URL(req.url, base)
  const q = url.searchParams
  const p = url.pathname.replace(/^\/api\/v1/, '')
  let m

  if ((m = p.match(/^\/mock-images\/(\d+)\.svg$/))) return send(res, 200, placeholderSvg(Number(m[1])), {}, 'image/svg+xml')
  if (p === '/stats') return send(res, 200, stats())
  if (p === '/taxon_names.json' || p === '/taxon_names') return paginated(res, taxonNamesQuery(q), q)
  if (p === '/otus/autocomplete') return send(res, 200, autocomplete(q.get('term') || ''))
  if (p === '/sources' || p === '/sources.json') return paginated(res, sourcesQuery(q), q)
  if (p === '/news' || p === '/news.json') return paginated(res, newsQuery(q), q)
  if ((m = p.match(/^\/news\/(\d+)$/))) {
    const n = NEWS.find((item) => item.id === Number(m[1]))
    return n ? send(res, 200, newsItem(n)) : send(res, 404, { error: 'Example news item not found' })
  }
  if (p === '/otus' || p === '/otus.json') {
    const ids = q.getAll('taxon_name_id[]').map(Number)
    return send(res, 200, TAXA.filter((t) => ids.includes(nameId(t))).map(otu))
  }

  if ((m = p.match(/^\/taxon_name_classifications$/))) {
    const t = taxonFromName(q.get('taxon_name_id[]'))
    return send(res, 200, t?.partOfSpeech ? [{
      id: nameId(t) + 5000,
      taxon_name_id: nameId(t),
      type: `TaxonNameClassification::Latinized::PartOfSpeech::${t.partOfSpeech.replace(/ (\w)/g, (_, c) => c.toUpperCase())}`,
      object_tag: `${labelHtml(t)} (${t.partOfSpeech.toLowerCase()})`
    }] : [])
  }

  if ((m = p.match(/^\/taxon_names\/(\d+)(\/inventory\/(summary|catalog))?$/))) {
    const t = taxonFromName(m[1])
    if (!t) return send(res, 404, { error: 'Example taxon name not found' })
    return send(res, 200, m[3] === 'summary' ? summary(t) : m[3] === 'catalog' ? catalog(t) : taxonName(t))
  }

  if ((m = p.match(/^\/otus\/(\d+)(\/.*)?$/))) {
    const t = taxonFromOtu(m[1])
    if (!t) return send(res, 404, { error: 'Example OTU not found' })
    const sub = m[2] || ''

    if (sub === '') {
      const body = otu(t)
      if (q.getAll('extend[]').includes('parents')) {
        body.parents = Object.fromEntries(ancestors(t).map((a) => [fullName(a), [otu(a)]]))
      }
      return send(res, 200, body)
    }
    if (sub === '/inventory/taxonomy.json') return send(res, 200, taxonomy(t, Number(q.get('max_descendants_depth') ?? 1)))
    if (sub === '/inventory/content') {
      return send(res, 200, (t.content || []).map((c, i) => ({ content_id: t.id * 100 + i, public_content_id: t.id * 100 + i, ...c })))
    }
    if (sub === '/inventory/type_material.json') {
      return send(res, 200, { type_materials_catalog_labels: t.type ? [{ type_type: t.type.type, label: t.type.label }] : [] })
    }
    if (sub === '/inventory/images.json') return send(res, 200, imageInventory(t, `${base.origin}/api/v1`))
    if (sub === '/inventory/dwc.json') {
      return send(res, 200, OCCURRENCES.map((o, i) => [o, i]).filter(([o]) => occurrencesFor(t).includes(o)).map(([o, i]) => dwc(o, i)))
    }
    const target = { id: otuId(t), label: labelText(t), type: 'Otu' }
    if (sub === '/inventory/distribution.geojson') {
      return send(res, 200, { type: 'FeatureCollection', features: pointFeatures(t), properties: { target } })
    }
    if (sub === '/inventory/distribution_is_absent.geojson') {
      return send(res, 200, { type: 'FeatureCollection', features: [], properties: { target } })
    }
    if (sub === '/inventory/distribution.json') {
      return send(res, 200, { otu_id: otuId(t), cached_map: { id: otuId(t), geo_json: JSON.stringify(aggregateGeometry(t)) } })
    }
  }

  if ((m = p.match(/^\/cached_maps\/(\d+)$/))) {
    const t = taxonFromOtu(m[1])
    return send(res, 200, {
      id: Number(m[1]),
      cached_map_type: 'CachedMapItem::WebLevel1',
      synced: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      latest_cached_map_item_created_at: new Date().toISOString(),
      reference_count: t ? occurrencesFor(t).length : 0,
      cached_map_item_reference_total: t ? occurrencesFor(t).length : 0,
      source_scope: { collection_objects: t ? occurrencesFor(t).length : 0, asserted_distributions: 0 }
    })
  }

  console.log(`[mock-api] not mocked: ${req.method} ${url.pathname}${url.search}`)
  return send(res, 404, { error: 'Not mocked' })
}

export function startMockApi(port = 4010) {
  const base = new URL(`http://localhost:${port}`)
  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, '')
    try {
      route(req, res, base)
    } catch (e) {
      console.error('[mock-api]', e)
      send(res, 500, { error: String(e) })
    }
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => resolve(server))
  })
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2] || 4010)
  startMockApi(port).then(() => console.log(`[mock-api] example TaxonWorks API on http://localhost:${port}/api/v1`))
}
