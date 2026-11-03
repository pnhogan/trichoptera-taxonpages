<template>
  <VCard>
    <VCardHeader>Described life stages</VCardHeader>
    <VCardContent class="text-sm">
      <VSpinner v-if="isLoading" />

      <div
        ref="gridRef"
        class="stages"
      >
        <div
          v-for="row in rowList"
          :key="row.label"
          class="stages-row"
        >
          <span class="stages-row-label">{{ row.label }}</span>
          <div class="stages-tiles">
            <div
              v-for="(tile, index) in row.tiles"
              :key="tile.topic"
              class="stages-cell"
            >
              <button
                type="button"
                class="stages-tile"
                :class="{
                  'stages-tile--empty': !referencesFor(tile).length,
                  'stages-tile--open': openTile === tile.topic
                }"
                :style="tileStyle(tile)"
                :disabled="!referencesFor(tile).length"
                :aria-expanded="openTile === tile.topic"
                :aria-label="tileLabel(tile)"
                :title="tileLabel(tile)"
                @click="toggle(tile)"
              >
                <span class="stages-tile-name">{{ tile.label }}</span>
                <span class="stages-tile-count">
                  {{ referencesFor(tile).length || '–' }}
                </span>
              </button>

              <div
                v-if="openTile === tile.topic"
                class="stages-bubble"
                :class="bubbleAlign(index, row.tiles.length)"
                role="dialog"
                :aria-label="`${tile.label}: describing literature`"
              >
                <div class="stages-bubble-title">
                  {{ tile.label }} described in
                </div>
                <ul class="stages-bubble-list">
                  <li
                    v-for="item in referencesFor(tile)"
                    :key="item.id"
                  >
                    <span v-html="item.source.cached" />
                    <span
                      v-if="item.pages"
                      class="stages-bubble-pages"
                    >
                      Cited at: {{ item.pages }}.
                    </span>
                    <span
                      v-if="item.is_original"
                      class="stages-bubble-badge"
                    >
                      Original description
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="stages-legend">
          <span>References</span>
          <span
            v-for="step in LEGEND"
            :key="step"
            class="stages-legend-step"
          >
            <span
              class="stages-legend-swatch"
              :class="{ 'stages-tile--empty': !step }"
              :style="step ? { background: shade(step) } : {}"
            />
            {{ step === MAX_SHADE ? `${step}+` : step }}
          </span>
        </div>
      </div>
    </VCardContent>
  </VCard>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { makeAPIRequest } from '@/utils'

// Each tile is a TaxonWorks citation Topic: a reference counts for a tile when
// one of its citations on this OTU carries that topic. Rows and tiles can be
// changed in config/taxa_page.yml with `bind: { rows: [...] }`.
const MAX_SHADE = 4
const LEGEND = [0, 1, 2, 3, MAX_SHADE]

const props = defineProps({
  otuId: {
    type: Number,
    required: true
  },

  rows: {
    type: Array,
    default: () => [
      { label: 'Life stage', tiles: ['Adult', 'Larva', 'Egg'] },
      { label: 'Sex', tiles: ['Male', 'Female'] }
    ]
  }
})

const isLoading = ref(false)
const citations = ref([])
const openTile = ref(null)
const gridRef = ref(null)

// Tiles may be written as a topic name, or as { label, topic } when the
// TaxonWorks topic name differs from the label shown on the page
const rowList = computed(() =>
  props.rows.map((row) => ({
    label: row.label,
    tiles: row.tiles.map((tile) =>
      typeof tile === 'string' ? { label: tile, topic: tile } : tile
    )
  }))
)

// One entry per source, so a reference cited twice for the same stage counts once
const referencesByTopic = computed(() => {
  const result = {}

  citations.value.forEach((citation) => {
    citation.topics.forEach(({ name }) => {
      const key = name.toLowerCase()
      const list = (result[key] ||= [])

      if (!list.some((item) => item.source.id === citation.source.id)) {
        list.push(citation)
      }
    })
  })

  Object.values(result).forEach((list) =>
    list.sort((a, b) => (a.source.year || 0) - (b.source.year || 0))
  )

  return result
})

function referencesFor(tile) {
  return referencesByTopic.value[tile.topic.toLowerCase()] || []
}

function shade(count) {
  const percent = [0, 30, 55, 78, 100][Math.min(count, MAX_SHADE)]

  return `color-mix(in srgb, var(--tp-secondary) ${percent}%, var(--tp-base-foreground))`
}

function tileStyle(tile) {
  const count = referencesFor(tile).length

  if (!count) return {}

  return {
    background: shade(count),
    color:
      count >= 3 ? 'var(--tp-secondary-content)' : 'var(--tp-base-content)'
  }
}

function tileLabel(tile) {
  const count = referencesFor(tile).length

  if (!count) return `${tile.label}: no describing reference recorded`

  return `${tile.label}: described in ${count} reference${count > 1 ? 's' : ''}`
}

function bubbleAlign(index, total) {
  if (index === 0) return 'stages-bubble--start'
  if (index === total - 1) return 'stages-bubble--end'

  return 'stages-bubble--center'
}

function toggle(tile) {
  openTile.value = openTile.value === tile.topic ? null : tile.topic
}

function closeOnOutside(event) {
  if (openTile.value && !gridRef.value?.contains(event.target)) {
    openTile.value = null
  }
}

function closeOnEscape(event) {
  if (event.key === 'Escape') openTile.value = null
}

function loadCitations() {
  isLoading.value = true
  openTile.value = null

  makeAPIRequest
    .get(`/otus/${props.otuId}/inventory/citations`)
    .then(({ data }) => {
      citations.value = data
        .flatMap((entry) => entry.citations)
        .filter((citation) => citation.source?.id && citation.topics?.length)
    })
    .catch(() => {
      citations.value = []
    })
    .finally(() => {
      isLoading.value = false
    })
}

onMounted(() => {
  loadCitations()
  document.addEventListener('click', closeOnOutside)
  document.addEventListener('keydown', closeOnEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeOnOutside)
  document.removeEventListener('keydown', closeOnEscape)
})

watch(() => props.otuId, loadCitations)
</script>

<style scoped>
.stages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stages-row {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  align-items: center;
  gap: 0.75rem;
}

.stages-row-label {
  color: var(--tp-base-soft);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stages-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
  gap: 0.375rem;
}

.stages-cell {
  position: relative;
}

.stages-tile {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: 3.5rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--tp-card-border);
  border-radius: 0.375rem;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease;
}

.stages-tile:not(:disabled):hover,
.stages-tile--open {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px var(--tp-shadow-sm);
}

.stages-tile:focus-visible {
  outline: 2px solid var(--tp-secondary);
  outline-offset: 2px;
}

.stages-tile--empty {
  background: repeating-linear-gradient(
    135deg,
    var(--tp-base-muted) 0 6px,
    var(--tp-base-foreground) 6px 12px
  );
  border-style: dashed;
  border-color: var(--tp-base-border);
  color: var(--tp-base-soft);
  cursor: default;
}

.stages-tile-name {
  font-weight: 600;
}

.stages-tile-count {
  align-self: flex-end;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.stages-bubble {
  position: absolute;
  z-index: 30;
  top: calc(100% + 0.6rem);
  box-sizing: border-box;
  width: min(20rem, 80vw);
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--tp-base-border);
  border-radius: 0.5rem;
  background: var(--tp-base-foreground);
  color: var(--tp-base-content);
  box-shadow: 0 8px 24px var(--tp-shadow-sm);
}

/* Speech-bubble arrow */
.stages-bubble::before {
  content: '';
  position: absolute;
  top: -0.4rem;
  width: 0.75rem;
  height: 0.75rem;
  border-top: 1px solid var(--tp-base-border);
  border-left: 1px solid var(--tp-base-border);
  background: inherit;
  transform: rotate(45deg);
}

.stages-bubble--start {
  left: 0;
}

.stages-bubble--start::before {
  left: 1.25rem;
}

.stages-bubble--center {
  left: 50%;
  transform: translateX(-50%);
}

.stages-bubble--center::before {
  left: calc(50% - 0.375rem);
}

.stages-bubble--end {
  right: 0;
}

.stages-bubble--end::before {
  right: 1.25rem;
}

.stages-bubble-title {
  margin-bottom: 0.4rem;
  font-weight: 600;
}

.stages-bubble-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 16rem;
  overflow-y: auto;
}

.stages-bubble-list li + li {
  padding-top: 0.5rem;
  border-top: 1px solid var(--tp-base-border);
}

.stages-bubble-pages {
  color: var(--tp-base-soft);
}

.stages-bubble-badge {
  display: inline-block;
  margin-left: 0.25rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--tp-secondary) 15%, transparent);
  color: var(--tp-secondary);
  font-size: 0.7rem;
  font-weight: 600;
}

.stages-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
  color: var(--tp-base-soft);
  font-size: 0.75rem;
}

.stages-legend-step {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.stages-legend-swatch {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 1px solid var(--tp-card-border);
  border-radius: 0.2rem;
}
</style>
