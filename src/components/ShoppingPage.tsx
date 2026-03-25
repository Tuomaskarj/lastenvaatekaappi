'use client'

import { useState } from 'react'
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

function getNeeded(wardrobe: WardrobeItem[], sizeLabel: string, categoryId: string, targets: Record<string, number>): number {
  const owned = wardrobe
    .filter(w => w.size_label === sizeLabel && w.category_id === categoryId)
    .reduce((sum, w) => sum + w.quantity, 0)
  const target = targets[categoryId] ?? DEFAULT_TARGETS[categoryId] ?? 3
  return Math.max(0, target - owned)
}

function ProductCarousel({ categoryId, categoryLabel, size, needed }: {
  categoryId: string
  categoryLabel: string
  size: string
  needed: number
}) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [selectedSize, setSelectedSize] = useState(size)
  const cat = CATEGORIES.find(c => c.id === categoryId)

  const search = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${categoryLabel} lapsi`,
          size: selectedSize,
          needed,
        })
      })
      const results = await response.json()
      setResults(Array.isArray(results) ? results : [])
    } catch (err) {
      setResults([])
    }
    setLoading(false)
  }

  if (!searched) return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <select
        value={selectedSize}
        onChange={e => setSelectedSize(e.target.value)}
        style={{
          padding: '5px 10px', borderRadius: 20, border: '1.5px solid #d0dece',
          background: 'white', fontSize: 12, fontWeight: 700, color: '#1a2e18',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {SIZE_STAGES.map(s => (
          <option key={s.id} value={s.label}>Koko {s.label}</option>
        ))}
      </select>
      <button onClick={search} style={{
        padding: '7px 16px', borderRadius: 20, border: '1.5px solid #2d5a27',
        background: 'white', color: '#2d5a27', cursor: 'pointer', fontSize: 12,
        fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        🛍️ Hae tarjouksia
      </button>
    </div>
  )

  if (loading) return (
    <div style={{ marginTop: 8, color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
      Haetaan tarjouksia...
    </div>
  )

  if (!results.length) return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ color: '#aaa', fontSize: 12 }}>Ei tuloksia löytyi.</div>
      <button onClick={() => { setSearched(false); setResults([]) }} style={{
        padding: '5px 12px', borderRadius: 20, border: '1.5px solid #ddd',
        background: 'white', color: '#888', cursor: 'pointer', fontSize: 12, fontWeight: 600, width: 'fit-content',
      }}>
        Kokeile uudelleen
      </button>
    </div>
  )

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ overflow: 'hidden', borderRadius: 12 }}>
        <div style={{ display: 'flex', transform: `translateX(-${activeIdx * 100}%)`, transition: 'transform 0.3s ease' }}>
          {results.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ minWidth: '100%', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#f8fdf8', border: '1px solid #d4e6d1', borderRadius: 12, padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: '#e8f5e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {cat?.icon || '👕'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a2e18', marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#7a9a78', marginBottom: 4 }}>{r.brand} · {r.store}</div>
                  {r.description && <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{r.description}</div>}
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#2d5a27' }}>{r.price}</div>
                </div>
                <div style={{ fontSize: 18, color: '#aaa' }}>›</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {results.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button onClick={() => setActiveIdx(i => Math.max(0, i - 1))} disabled={activeIdx === 0} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #d4e6d1', background: 'white', cursor: 'pointer', fontSize: 14, color: activeIdx === 0 ? '#ccc' : '#2d5a27' }}>‹</button>
          {results.map((_, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', padding: 0, background: i === activeIdx ? '#2d5a27' : '#d4e6d1', cursor: 'pointer' }} />
          ))}
          <button onClick={() => setActiveIdx(i => Math.min(results.length - 1, i + 1))} disabled={activeIdx === results.length - 1} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #d4e6d1', background: 'white', cursor: 'pointer', fontSize: 14, color: activeIdx === results.length - 1 ? '#ccc' : '#2d5a27' }}>›</button>
        </div>
      )}

      <button onClick={() => { setSearched(false); setResults([]); setActiveIdx(0) }} style={{
        marginTop: 8, padding: '5px 12px', borderRadius: 20, border: '1.5px solid #ddd',
        background: 'white', color: '#888', cursor: 'pointer', fontSize: 11, fontWeight: 600,
      }}>
        🔄 Hae uudelleen
      </button>
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
  const [targets, setTargets] = useState<Record<string, number>>(initialSettings?.clothing_targets || DEFAULT_TARGETS)
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

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 80px' }}>

        {/* Asetukset */}
        {showSettings && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>⚙️ Vaatemäärätavoitteet</h3>
            <p style={{ fontSize: 12, color: '#7a9a78', margin: '0 0 14px' }}>Kuinka monta kutakin vaatetta haluat per koko?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CATEGORIES.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <label style={{ fontSize: 13, color: '#1a2e18' }}>{cat.icon} {cat.label}</label>
                  <input
                    type="number" min="0" max="20"
                    style={{ ...inputStyle, width: 56, textAlign: 'center' }}
                    value={targets[cat.id] ?? DEFAULT_TARGETS[cat.id]}
                    onChange={e => setTargets(p => ({ ...p, [cat.id]: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            <button onClick={saveSettings} disabled={savingSettings} style={{
              marginTop: 16, width: '100%', padding: '11px', borderRadius: 10,
              background: '#2d5a27', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14,
            }}>
              {savingSettings ? 'Tallennetaan...' : 'Tallenna tavoitteet'}
            </button>
          </div>
        )}

        {/* Koot */}
        {stagesToShow.map((stage, si) => {
          const isCurrent = si === 0
          const needs = CATEGORIES.map(cat => ({
            cat,
            needed: getNeeded(wardrobe, stage.label, cat.id, targets),
            owned: wardrobe.filter(w => w.size_label === stage.label && w.category_id === cat.id).reduce((s, w) => s + w.quantity, 0),
            target: targets[cat.id] ?? DEFAULT_TARGETS[cat.id],
          })).filter(n => n.needed > 0)

          return (
            <div key={stage.id} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18' }}>Koko {stage.label}</div>
                {isCurrent
                  ? <span style={{ fontSize: 10, background: '#2d5a27', color: 'white', padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>NYKYKOKO</span>
                  : <span style={{ fontSize: 10, background: '#e8f0e7', color: '#5a7a58', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>TULEVA</span>
                }
              </div>

              {needs.length === 0 ? (
                <div style={{ background: '#f0f9ee', border: '1.5px solid #c8e6c4', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#2d5a27', fontWeight: 700 }}>
                  ✅ Kaappi täynnä tälle koolle!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {needs.map(({ cat, needed, owned, target }) => (
                    <div key={cat.id} style={{ background: 'white', border: '1.5px solid #e8f0e7', borderRadius: 14, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 22 }}>{cat.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a2e18' }}>{cat.label}</div>
                            <div style={{ fontSize: 11, color: '#7a9a78' }}>{owned}/{target} kpl · tarvitset {needed} lisää</div>
                          </div>
                        </div>
                        <div style={{ width: 60 }}>
                          <div style={{ height: 6, borderRadius: 3, background: '#e8f0e7', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: '#2d5a27', width: `${Math.min(100, (owned / target) * 100)}%`, transition: '0.3s' }} />
                          </div>
                          <div style={{ fontSize: 9, color: '#aaa', textAlign: 'right', marginTop: 2 }}>{Math.round((owned / target) * 100)}%</div>
                        </div>
                      </div>
                      <ProductCarousel
                        categoryId={cat.id}
                        categoryLabel={cat.label}
                        size={stage.label}
                        needed={needed}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e8f0e7', display: 'flex', justifyContent: 'center', boxShadow: '0 -4px 20px #0001' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 480 }}>
          {[
            { id: 'timeline', label: 'Aikajana', icon: '📅', href: `/dashboard/${child.id}` },
            { id: 'wardrobe', label: 'Kaappi', icon: '👗', href: `/dashboard/${child.id}?tab=wardrobe` },
            { id: 'measurements', label: 'Mitat', icon: '📏', href: `/dashboard/${child.id}?tab=measurements` },
            { id: 'shopping', label: 'Ostokset', icon: '🛍️', href: `/dashboard/${child.id}/shopping` },
          ].map(t => (
            <a key={t.id} href={t.href} style={{
              flex: 1, padding: '12px 4px 10px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, textDecoration: 'none',
              borderTop: t.id === 'shopping' ? '2.5px solid #2d5a27' : '2.5px solid transparent',
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: t.id === 'shopping' ? 800 : 600, color: t.id === 'shopping' ? '#2d5a27' : '#9aaa98' }}>{t.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}