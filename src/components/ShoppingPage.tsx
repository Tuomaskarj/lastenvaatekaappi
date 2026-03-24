'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SIZE_STAGES = [
  { id: 'nb', label: '50', cm: 50 },
  { id: '56', label: '56', cm: 56 },
  { id: '62', label: '62', cm: 62 },
  { id: '68', label: '68', cm: 68 },
  { id: '74', label: '74', cm: 74 },
  { id: '80', label: '80', cm: 80 },
  { id: '86', label: '86', cm: 86 },
  { id: '92', label: '92', cm: 92 },
  { id: '98', label: '98', cm: 98 },
  { id: '104', label: '104', cm: 104 },
  { id: '110', label: '110', cm: 110 },
  { id: '116', label: '116', cm: 116 },
  { id: '122', label: '122', cm: 122 },
  { id: '128', label: '128', cm: 128 },
]

const CATEGORIES = [
  { id: 'bodysuit', label: 'Body', icon: '👶' },
  { id: 'onesie', label: 'Romppari', icon: '🐣' },
  { id: 'top', label: 'Paita', icon: '👕' },
  { id: 'pants', label: 'Housut', icon: '👖' },
  { id: 'outerwear', label: 'Takki/haalarit', icon: '🧥' },
  { id: 'sleepsuit', label: 'Unipuku', icon: '😴' },
  { id: 'socks', label: 'Sukat', icon: '🧦' },
  { id: 'shoes', label: 'Kengät', icon: '👟' },
  { id: 'hat', label: 'Pipo/hattu', icon: '🧢' },
  { id: 'mittens', label: 'Lapaset', icon: '🧤' },
  { id: 'dress', label: 'Mekko/hame', icon: '👗' },
  { id: 'swimwear', label: 'Uima-asu', icon: '🏊' },
]

const DEFAULT_TARGETS: Record<string, number> = {
  bodysuit: 6, onesie: 3, top: 5, pants: 4, outerwear: 2,
  sleepsuit: 3, socks: 8, shoes: 2, hat: 2, mittens: 2, dress: 2, swimwear: 1,
}

type SearchResult = {
  name: string
  brand: string
  price: string
  store: string
  url: string
  image?: string
  description?: string
}

type WardrobeItem = {
  id: string
  size_label: string
  category_id: string
  quantity: number
  status: string
}

type Measurement = {
  height_cm: number | null
  measured_at: string
}

function getCurrentStageIndex(heightCm: number): number {
  for (let i = SIZE_STAGES.length - 1; i >= 0; i--) {
    if (heightCm >= SIZE_STAGES[i].cm - 4) return i
  }
  return 0
}

function getNeeded(
  wardrobe: WardrobeItem[],
  sizeLabel: string,
  categoryId: string,
  targets: Record<string, number>
): number {
  const owned = wardrobe
    .filter(w => w.size_label === sizeLabel && w.category_id === categoryId)
    .reduce((sum, w) => sum + w.quantity, 0)
  const target = targets[categoryId] ?? DEFAULT_TARGETS[categoryId] ?? 3
  return Math.max(0, target - owned)
}

function ProductCarousel({ query, size, needed, categoryLabel }: {
  query: string, size: string, needed: number, categoryLabel: string
}) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const search = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          system: `Olet lastenvaatteiden asiantuntija. Etsi netistä ${needed} parasta tuotetta hakusanalla suomalaisista tai pohjoismaisista verkkokaupoista (Reima, Didriksons, Lindex, H&M, Zalando, CDON, Kidsbrandstore, Name It, Polarn O. Pyret). 
Palauta VAIN JSON-taulukko muodossa:
[{"name":"tuotteen nimi","brand":"merkki","price":"hinta €","store":"kauppa","url":"linkki","description":"lyhyt kuvaus max 10 sanaa"}]
Ei selityksiä, ei markdown, vain JSON-taulukko.`,
          messages: [{ role: 'user', content: `Etsi: ${query} koko ${size}. Tarvitaan ${needed} kpl.` }]
        })
      })
      const data = await response.json()
      const text = data.content.map((i: { type: string; text?: string }) => i.text || '').filter(Boolean).join('')
      const clean = text.replace(/```json|```/g, '').trim()
      const match = clean.match(/\[[\s\S]*\]/)
      if (match) setResults(JSON.parse(match[0]))
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  if (!searched) return (
    <button onClick={search} style={{
      padding: '7px 16px', borderRadius: 20, border: '1.5px solid #2d5a27',
      background: 'white', color: '#2d5a27', cursor: 'pointer', fontSize: 12,
      fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
    }}>
      🛍️ Hae tarjouksia — {categoryLabel} koko {size}
    </button>
  )

  if (loading) return (
    <div style={{ marginTop: 8, color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
      Haetaan parhaita tarjouksia...
    </div>
  )

  if (!results.length) return (
    <div style={{ marginTop: 8, color: '#aaa', fontSize: 12 }}>Ei tuloksia. Kokeile hakua manuaalisesti.</div>
  )

  return (
    <div style={{ marginTop: 10 }}>
      {/* Karuselli */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          transform: `translateX(-${activeIdx * 100}%)`,
          transition: 'transform 0.3s ease',
        }}>
          {results.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
              minWidth: '100%', textDecoration: 'none', color: 'inherit',
            }}>
              <div style={{
                background: '#f8fdf8', border: '1px solid #d4e6d1', borderRadius: 12,
                padding: 12, display: 'flex', gap: 12, alignItems: 'center',
              }}>
                {/* Placeholder kuva */}
                <div style={{
                  width: 64, height: 64, borderRadius: 10, background: '#e8f5e6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, flexShrink: 0,
                }}>
                  {CATEGORIES.find(c => c.label === categoryLabel)?.icon || '👕'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#7a9a78', marginBottom: 4 }}>{r.brand} · {r.store}</div>
                  {r.description && <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{r.description}</div>}
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#2d5a27' }}>{r.price}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Navigaatio */}
      {results.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button onClick={() => setActiveIdx(i => Math.max(0, i - 1))} disabled={activeIdx === 0} style={{
            width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #d4e6d1',
            background: 'white', cursor: 'pointer', fontSize: 14, color: activeIdx === 0 ? '#ccc' : '#2d5a27',
          }}>‹</button>
          <div style={{ display: 'flex', gap: 4 }}>
            {results.map((_, i) => (
              <button key={i} onClick={() => setActiveIdx(i)} style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none', padding: 0,
                background: i === activeIdx ? '#2d5a27' : '#d4e6d1', cursor: 'pointer',
              }} />
            ))}
          </div>
          <button onClick={() => setActiveIdx(i => Math.min(results.length - 1, i + 1))} disabled={activeIdx === results.length - 1} style={{
            width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #d4e6d1',
            background: 'white', cursor: 'pointer', fontSize: 14, color: activeIdx === results.length - 1 ? '#ccc' : '#2d5a27',
          }}>›</button>
        </div>
      )}
    </div>
  )
}

export default function ShoppingPage({ child, measurements, wardrobe, initialSettings, userId }: {
  child: { id: string; name: string; date_of_birth: string | null }
  measurements: Measurement[]
  wardrobe: WardrobeItem[]
  initialSettings: { clothing_targets: Record<string, number> } | null
  userId: string
}) {
  const [targets, setTargets] = useState<Record<string, number>>(
    initialSettings?.clothing_targets || DEFAULT_TARGETS
  )
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const supabase = createClient()

  const latestM = measurements[0]
  const currentIdx = latestM?.height_cm ? getCurrentStageIndex(latestM.height_cm) : 2
  const stagesToShow = SIZE_STAGES.slice(currentIdx, currentIdx + 3)

  const saveSettings = async () => {
    setSavingSettings(true)
    await supabase.from('user_settings').upsert({
      user_id: userId,
      clothing_targets: targets,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSavingSettings(false)
    setShowSettings(false)
  }

  const inputStyle = {
    padding: '8px 10px', borderRadius: 8, border: '1.5px solid #d0dece',
    fontSize: 14, background: '#fafffe', width: '100%',
    boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#1a2e18',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4faf3', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a2e18 0%, #2d5a27 100%)', padding: '20px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href={`/dashboard/${child.id}`} style={{ color: 'white', fontSize: 22, textDecoration: 'none' }}>←</a>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>🛍️ Ostosehdotukset</div>
              <div style={{ fontSize: 12, color: '#a8d8a4' }}>{child.name}</div>
            </div>
          </div>
          <button onClick={() => setShowSettings(s => !s)} style={{
            background: '#ffffff20', border: 'none', borderRadius: 20,
            padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}>
            ⚙️ Tavoitteet
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 40px' }}>

        {/* Asetukset */}
        {showSettings && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>⚙️ Vaatemäärätavoitteet</h3>
            <p style={{ fontSize: 12, color: '#7a9a78', margin: '0 0 14px' }}>Kuinka monta kutakin vaatetta haluat per koko?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CATEGORIES.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}></div>