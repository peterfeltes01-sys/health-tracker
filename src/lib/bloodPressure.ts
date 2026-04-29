import type { BPCategory } from '../types'

export function classifyBP(sys: number, dia: number): BPCategory {
  if (sys >= 140 && dia < 90) return 'isolated-systolic'
  if (sys >= 180 || dia >= 110) return 'grade-3'
  if (sys >= 160 || dia >= 100) return 'grade-2'
  if (sys >= 140 || dia >= 90) return 'grade-1'
  if (sys >= 130 || dia >= 85) return 'high-normal'
  if (sys >= 120 || dia >= 80) return 'normal'
  return 'optimal'
}

export const BP_CATEGORY_META: Record<BPCategory, { label: string; color: string; bg: string }> = {
  optimal: { label: 'Optimal', color: '#16a34a', bg: '#dcfce7' },
  normal: { label: 'Normal', color: '#65a30d', bg: '#ecfccb' },
  'high-normal': { label: 'Hoch-normal', color: '#eab308', bg: '#fef9c3' },
  'grade-1': { label: 'Hypertonie Grad 1', color: '#f97316', bg: '#ffedd5' },
  'grade-2': { label: 'Hypertonie Grad 2', color: '#dc2626', bg: '#fee2e2' },
  'grade-3': { label: 'Hypertonie Grad 3', color: '#7f1d1d', bg: '#fecaca' },
  'isolated-systolic': { label: 'Isol. syst. Hypertonie', color: '#ea580c', bg: '#fed7aa' },
}
