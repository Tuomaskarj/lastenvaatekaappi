'use client'

import { useState } from 'react'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Measurement = {
  id: string
  measured_at: string
  height_cm: number | null
  weight_kg: number | null
  head_circ_cm: number | null
  foot_length_cm: number | null
}

// WHO:n kasvukäyrän viitearvot (tytöt + pojat keskiarvo)
const WHO_HEIGHT = [
  { month: 0, p10: 47.5, p50: 50.0, p90: 52.5 },
  { month: 1, p10: 51.5, p50: 54.0, p90: 56.5 },
  { month: 2, p10: 54.5, p50: 57.5, p90: 60.0 },
  { month: 3, p10: 57.5, p50: 60.5, p90: 63.0 },
  { month: 4, p10: 60.0, p50: 63.0, p90: 65.5 },
  { month: 6, p10: 63.5, p50: 67.0, p90: 70.0 },
  { month: 9, p10: 68.0, p50: 71.5, p90: 74.5 },
  { month: 12, p10: 71.5, p50: 75.5, p90: 78.5 },
  { month: 18, p10: 77.5, p50: 82.0, p90: 85.5 },
  { month: 24, p10: 82.5, p50: 87.5, p90: 91.5 },
  { month: 36, p10: 89.5, p50: 95.5, p90: 100.0 },
  { month: 48, p10: 96.0, p50: 102.5, p90: 108.0 },
  { month: 60, p10: 102.0, p50: 109.0, p90: 115.0 },
]

const WHO_WEIGHT = [
  { month: 0, p10: 2.9, p50: 3.5, p90: 4.2 },
  { month: 1, p10: 3.6, p50: 4.5, p90: 5.3 },
  { month: 2, p10: 4.4, p50: 5.5, p90: 6.5 },
  { month: 3, p10: 5.1, p50: 6.3, p90: 7.4 },
  { month: 4, p10: 5.6, p50: 7.0, p90: 8.2 },
  { month: 6, p10: 6.5, p50: 8.0, p90: 9.4 },
  { month: 9, p10: 7.5, p50: 9.2, p90: 10.8 },
  { month: 12, p10: 8.2, p50: 10.1, p90: 11.8 },
  { month: 18, p10: 9.4, p50: 11.5, p90: 13.4 },
  { month: 24, p10: 10.3, p50: 12.7, p90: 14.9 },
  { month: 36, p10: 12.0, p50: 14.8, p90: 17.5 },
  { month: 48, p10: 13.5, p50: 16.8, p90: 20.0 },
  { month: 60, p10: 15.0, p50: 18.9, p90: 22.8 },
]

function getMonthsOld(dob: string | null, measuredAt: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  const measured = new Date(measuredAt)
  return Math.round((measured.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
}

export default function GrowthChart({ measurements, dateOfBirth }: { measurements: Measurement[], dateOfBirth: string | null }) {
  const [metric, setMetric] = useState<'height' | 'weight'>('height')

  const childData = measurements
    .filter(m => metric === 'height' ? m.height_cm : m.weight_kg)
    .map(m => ({
      month: getMonthsOld(dateOfBirth, m.measured_at),
      value: metric === 'height' ? m.height_cm : m.weight_kg,
      date: new Date(m.measured_at).toLocaleDateString('fi-FI'),
    }))
    .sort((a, b) => a.month - b.month)

  const whoData = metric === 'height' ? WHO_HEIGHT : WHO_WEIGHT
  const maxMonth = Math.max(...childData.map(d => d.month), 24)
  const filteredWho = whoData.filter(d => d.month <= maxMonth + 6)

  // Yhdistetään WHO-data ja lapsen data
  const chartData = filteredWho.map(who => {
    const child = childData.find(d => Math.abs(d.month - who.month) <= 1)
    return {
      month: who.month,
      p10: who.p10,
      p50: who.p50,
      p90: who.p90,
      lapsi: child?.value ?? null,
      label: who.month < 24 ? `${who.month} kk` : `${Math.round(who.month / 12)} v`,
    }
  })

  // Lisätään lapsen mittaukset jotka eivät osu WHO-pisteisiin
  childData.forEach(cd => {
    const exists = chartData.find(d => Math.abs(d.month - cd.month) <= 1)
    if (!exists) {
      chartData.push({
        month: cd.month,
        p10: 0, p50: 0, p90: 0,
        lapsi: cd.value,
        label: cd.month < 24 ? `${cd.month} kk` : `${Math.round(cd.month / 12)} v`,
      })
    }
  })
  chartData.sort((a, b) => a.month - b.month)

  const unit = metric === 'height' ? 'cm' : 'kg'

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1.5px solid #e8f0e7' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a2e18' }}>📈 Kasvukäyrä</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['height', 'weight'] as const).map(m => (
            <button key={m} onClick={() => setMetric(m)} style={{
              padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
              borderColor: metric === m ? '#2d5a27' : '#ddd',
              background: metric === m ? '#2d5a27' : 'white',
              color: metric === m ? 'white' : '#888',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              {m === 'height' ? 'Pituus' : 'Paino'}
            </button>
          ))}
        </div>
      </div>

      {childData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#bbb', fontSize: 13 }}>
          Lisää mittauksia nähdäksesi kasvukäyrän
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999' }} />
              <YAxis tick={{ fontSize: 10, fill: '#999' }} />
              <Tooltip
                formatter={(value: number, name: string) => {
                    if (name === 'lapsi') return [`${value} ${unit}`, 'Lapsi']
                  if (name === 'p50') return [`${value} ${unit}`, 'Keskiarvo (WHO)']
                  if (name === 'p10') return [`${value} ${unit}`, 'P10 (WHO)']
                  if (name === 'p90') return [`${value} ${unit}`, 'P90 (WHO)']
                  return [value, name]
                }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="p10" stroke="#e0e0e0" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="p50" stroke="#a8d8a4" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="p90" stroke="#e0e0e0" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="lapsi" stroke="#2d5a27" strokeWidth={2.5} dot={{ fill: '#2d5a27', r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 20, height: 2, background: '#2d5a27', borderRadius: 2 }} /> Lapsi
            </span>
            <span style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 20, height: 2, background: '#a8d8a4', borderRadius: 2 }} /> Keskiarvo WHO
            </span>
            <span style={{ fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 20, height: 2, background: '#e0e0e0', borderRadius: 2 }} /> P10/P90
            </span>
          </div>
        </>
      )}
    </div>
  )
}