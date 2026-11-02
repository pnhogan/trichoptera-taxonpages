// EXAMPLE DATA for local previews only (npm run dev:mock).
//
// Higher taxa and species names are real caddisfly names, but every reference,
// synonym, specimen, image, text and count here is an invented placeholder
// marked "example". Nothing in this file is from the Trichoptera World
// Checklist project and none of it should be cited.

export const PROJECT_ID = 9999

// parent: id of the parent taxon (null for Root)
// synonyms: invalid names listed under the valid name
// typeSpecies: genus-group only, id of the type species
// images: optional number of placeholder gallery images (none at present)
export const TAXA = [
  { id: 1, rank: 'root', name: 'Root', parent: null },
  { id: 2, rank: 'order', name: 'Trichoptera', author: 'Kirby', year: 1813, parent: 1 },
  { id: 3, rank: 'family', name: 'Hydropsychidae', author: 'Curtis', year: 1835, parent: 2 },
  { id: 4, rank: 'genus', name: 'Hydropsyche', author: 'Pictet', year: 1834, parent: 3, typeSpecies: 6 },
  {
    id: 5,
    rank: 'species',
    name: 'angustipennis',
    author: 'Curtis',
    year: 1834,
    parenthetical: true,
    original: 'Philopotamus angustipennis',
    parent: 4,
    gender: { masculine: 'angustipennis', feminine: 'angustipennis', neuter: 'angustipenne' },
    partOfSpeech: 'Adjective',
    etymology: 'Example etymology: Latin angustus (narrow) + penna (wing).',
    synonyms: ['<i>Hydropsyche exemplaris</i> Example, 1900'],
    type: { type: 'lectotype', label: 'Lectotype; male; EXAMPLE-0001; England (example record)' },
    content: [
      { name: 'Life zone and ecology data', text: '<p>Freshwater (example)</p>' },
      { name: 'Biology', text: '<p>Example text. Larvae build capture nets in running water. Replace with TaxonWorks content.</p>' }
    ]
  },
  {
    id: 6,
    rank: 'species',
    name: 'pellucidula',
    author: 'Curtis',
    year: 1834,
    parenthetical: true,
    original: 'Philopotamus pellucidulus',
    parent: 4,
    gender: { masculine: 'pellucidulus', feminine: 'pellucidula', neuter: 'pellucidulum' },
    partOfSpeech: 'Adjective',
    etymology: 'Example etymology: Latin pellucidus (transparent), diminutive.',
    type: { type: 'holotype', label: 'Holotype; female; EXAMPLE-0002; England (example record)' },
    content: [{ name: 'Life zone and ecology data', text: '<p>Freshwater (example)</p>' }]
  },
  {
    id: 7,
    rank: 'species',
    name: 'betteni',
    author: 'Ross',
    year: 1938,
    parent: 4,
    partOfSpeech: 'Noun in genitive case',
    etymology: 'Example etymology: named for a person.',
    type: { type: 'holotype', label: 'Holotype; male; EXAMPLE-0003; USA: Illinois (example record)' },
    content: [{ name: 'Life zone and ecology data', text: '<p>Freshwater (example)</p>' }]
  },
  { id: 8, rank: 'family', name: 'Rhyacophilidae', author: 'Stephens', year: 1836, parent: 2 },
  { id: 9, rank: 'genus', name: 'Rhyacophila', author: 'Pictet', year: 1834, parent: 8, typeSpecies: 10 },
  {
    id: 10,
    rank: 'species',
    name: 'fasciata',
    author: 'Hagen',
    year: 1859,
    parent: 9,
    gender: { masculine: 'fasciatus', feminine: 'fasciata', neuter: 'fasciatum' },
    partOfSpeech: 'Adjective',
    etymology: 'Example etymology: Latin fasciatus (banded).',
    content: [{ name: 'Life zone and ecology data', text: '<p>Freshwater (example)</p>' }]
  }
]

// One placeholder reference per taxon is generated from its author and year.
export function referenceFor(taxon) {
  return `${taxon.author}, X. (${taxon.year}) Example reference for the mock API. <i>Example Journal of Trichopterology</i>, 1, 1–10.`
}

// basis: 'CollectionObject' (specimen) or 'FieldOccurrence' (observation)
export const OCCURRENCES = [
  { otu: 5, basis: 'CollectionObject', country: 'United Kingdom', state: 'England', locality: 'River Thames (example)', lat: 51.75, lon: -1.26, sex: 'male', count: 1, catalog: 'EXAMPLE-0001', typeStatus: 'lectotype of Philopotamus angustipennis Curtis, 1834', date: '1834-06-01' },
  { otu: 5, basis: 'CollectionObject', country: 'Germany', state: 'Bavaria', locality: 'Isar River (example)', lat: 48.13, lon: 11.6, sex: 'female', count: 3, catalog: 'EXAMPLE-0101', date: '2019-07-14' },
  { otu: 6, basis: 'CollectionObject', country: 'United Kingdom', state: 'England', locality: 'Example stream', lat: 52.2, lon: 0.12, sex: 'female', count: 1, catalog: 'EXAMPLE-0002', typeStatus: 'holotype of Philopotamus pellucidulus Curtis, 1834', date: '1834-05-20' },
  { otu: 6, basis: 'CollectionObject', country: 'France', state: 'Centre-Val de Loire', locality: 'Loire (example)', lat: 47.4, lon: 0.7, sex: 'male', count: 2, catalog: 'EXAMPLE-0102', date: '2015-08-03' },
  { otu: 6, basis: 'CollectionObject', country: 'Czech Republic', state: 'Prague', locality: 'Vltava (example)', lat: 50.05, lon: 14.41, sex: 'male', count: 5, catalog: 'EXAMPLE-0103', date: '2012-06-22' },
  { otu: 7, basis: 'CollectionObject', country: 'United States', state: 'Illinois', locality: 'Salt Fork (example)', lat: 40.1, lon: -87.9, sex: 'male', count: 1, catalog: 'EXAMPLE-0003', typeStatus: 'holotype of Hydropsyche betteni Ross, 1938', date: '1936-06-10' },
  { otu: 7, basis: 'CollectionObject', country: 'United States', state: 'Wisconsin', locality: 'Example creek', lat: 43.07, lon: -89.4, sex: 'female', count: 4, catalog: 'EXAMPLE-0104', date: '2021-07-01' },
  { otu: 7, basis: 'FieldOccurrence', country: 'United States', state: 'Indiana', locality: 'Example river survey', lat: 39.77, lon: -86.16, count: 12, date: '2023-06-18' },
  { otu: 10, basis: 'CollectionObject', country: 'Austria', state: 'Tyrol', locality: 'Example alpine brook', lat: 47.27, lon: 11.4, sex: 'male', count: 1, catalog: 'EXAMPLE-0105', date: '2018-07-25' },
  { otu: 10, basis: 'FieldOccurrence', country: 'Slovakia', state: 'Prešov', locality: 'Example stream survey', lat: 49.1, lon: 20.2, count: 3, date: '2022-08-09' }
]

// Project news (TaxonWorks News). type is a TaxonWorks News class name.
export const NEWS = [
  { id: 1, type: 'News::Project::Notice', title: 'Example: Website preview available', creator: 'Example curator', date: '2026-10-05', body: '<p>Example announcement. A preview of the checklist website is available to the team for feedback.</p>' },
  { id: 2, type: 'News::Project::Blog', title: 'Example: Data import from the Trichoptera World Checklist', creator: 'Example curator', date: '2026-10-19', body: '<p>Example announcement. Names, references and specimen records are being imported into TaxonWorks.</p><p>Placeholder text, not real news.</p>' },
  { id: 3, type: 'News::Project::Notice', title: 'Example: Team meeting', creator: 'Example curator', date: '2026-11-01', body: '<p>Example announcement about an upcoming team meeting. Replace with real TaxonWorks News items.</p>' }
]
