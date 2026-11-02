# Mock TaxonWorks API (example data)

A stand-in for the TaxonWorks API so the site can be previewed locally before
the real project token is available. **All data here is invented example
data** (references, synonyms, specimens, texts); only the higher taxon
and species names are real caddisfly names. Do not cite it.

## Use

```bash
npm run dev:mock
```

Then open http://localhost:5173/trichoptera-taxonpages/. Stop with Ctrl+C.

Example pages:

| Page | URL |
|---|---|
| Order *Trichoptera* | `#/otus/1002/overview` |
| Genus *Hydropsyche* | `#/otus/1004/overview` |
| *Hydropsyche angustipennis* (synonym, etymology) | `#/otus/1005/overview` |
| *Hydropsyche pellucidula* (specimen records) | `#/otus/1006/specimen_records` |
| *Hydropsyche betteni* (field occurrences) | `#/otus/1007/field_occurrences` |
| *Rhyacophila fasciata* | `#/otus/1010/overview` |
| Recent taxon names and sources | `#/recent` |
| News (example announcements) | `#/news` |

## How it stays local

- `npm run dev:mock` writes `config/api.development.yml` pointing at the mock
  (port 4010) and deletes it on exit. TaxonPages reads `*.development.yml`
  only in dev, never in `npm run build`, and the file is git-ignored.
- `npm run dev` first runs `predev`, which removes a leftover mock config (for
  example after a force-quit), so a normal preview always uses `config/api.yml`.
- The deploy workflow only runs `npm run build`, so the published site never
  sees the mock.

## Files

- `data.mjs`: the example taxa, occurrences and texts. Edit this to change what the preview shows.
- `server.mjs`: builds TaxonWorks-shaped responses from `data.mjs` (Node built-ins only). Requests it does not handle are logged as `not mocked`.
- `dev.mjs`: starts the mock and `taxonpages dev` together.

Delete this folder, the `dev:mock` and `predev` scripts in `package.json`, and
the `config/*.development.yml` line in `.gitignore` once the real API is in use.
