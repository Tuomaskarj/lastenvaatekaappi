'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Child = {
  id: string
  name: string
  date_of_birth: string | null
  is_expected: boolean
}

export default function ChildrenList({ initialChildren, userId }: { initialChildren: Child[], userId: string }) {
  const [children, setChildren] = useState<Child[]>(initialChildren)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [isExpected, setIsExpected] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const addChild = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('children')
      .insert({ name, date_of_birth: dob || null, is_expected: isExpected, user_id: userId })
      .select()
      .single()

    if (!error && data) {
      setChildren(prev => [...prev, data])
      setName('')
      setDob('')
      setIsExpected(false)
      setAdding(false)
    }
    setLoading(false)
  }

  const inputStyle = {
    padding: '10px 13px', borderRadius: 10, border: '1.5px solid #1a2e18',
    fontSize: 14, background: '#fafffe', width: '100%', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', outline: 'none',color: '#1a2e18',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1a2e18', margin: 0 }}>Lapset</h2>
        <button onClick={() => setAdding(true)} style={{
          padding: '8px 16px', borderRadius: 20, background: '#2d5a27', color: 'white',
          border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13,
        }}>+ Lisää lapsi</button>
      </div>

      {adding && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '2px solid #2d5a27' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>Uusi lapsi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5a7a58', display: 'block', marginBottom: 3 }}>NIMI</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="esim. Aino" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#5a7a58', display: 'block', marginBottom: 3 }}>SYNTYMÄPÄIVÄ / LASKETTU AIKA</label>
              <input type="date" style={inputStyle} value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="expected" checked={isExpected} onChange={e => setIsExpected(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#2d5a27' }} />
              <label htmlFor="expected" style={{ fontSize: 13, color: '#5a7a58', cursor: 'pointer' }}>Lapsi ei ole vielä syntynyt</label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addChild} disabled={loading} style={{
                flex: 1, padding: '11px', borderRadius: 10, background: '#2d5a27', color: 'white',
                border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14,
              }}>{loading ? 'Tallennetaan...' : 'Tallenna'}</button>
              <button onClick={() => setAdding(false)} style={{
                padding: '11px 16px', borderRadius: 10, background: 'white', color: '#888',
                border: '1.5px solid #ddd', cursor: 'pointer', fontSize: 14,
              }}>Peruuta</button>
            </div>
          </div>
        </div>
      )}

      {children.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👶</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Ei lapsia vielä</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Lisää ensimmäinen lapsi yllä olevasta napista</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children.map(child => (
          <button key={child.id} onClick={() => router.push(`/dashboard/${child.id}`)} style={{
            background: 'white', borderRadius: 16, padding: '16px 20px',
            border: '1.5px solid #e8f0e7', cursor: 'pointer', textAlign: 'left',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 1px 6px #0001', fontFamily: 'inherit',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>👶</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a2e18' }}>{child.name}</div>
                <div style={{ fontSize: 12, color: '#7a9a78' }}>
                  {child.is_expected ? '🤰 Odotetaan' : child.date_of_birth ? `Syntynyt ${new Date(child.date_of_birth).toLocaleDateString('fi-FI')}` : 'Ei syntymäpäivää'}
                </div>
              </div>
            </div>
            <span style={{ color: '#aaa', fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}