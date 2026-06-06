import type { MovementFamily } from '../types/training'

export const SEED_MOVEMENT_FAMILIES: MovementFamily[] = [
  {
    id: 'fam-horizontal-push',
    name: 'Horizontaler Druck',
    bucket: 'push',
    primaryMuscles: ['chest', 'triceps', 'shoulders'],
    levels: [
      'bw-incline-pushup',  // Schräge Liegestütz
      'bw-pushup',          // Liegestütz
      'bw-diamond-pushup',  // Diamant-Liegestütz
    ],
  },
  {
    id: 'fam-squat',
    name: 'Kniebeuge',
    bucket: 'legs',
    primaryMuscles: ['quads', 'glutes'],
    levels: [
      'bw-squat',        // Kniebeuge
      'bw-lunge',        // Ausfallschritt
      'bw-split-squat',  // Bulgarian Split Squat
    ],
  },
  {
    id: 'fam-hip-hinge',
    name: 'Hüftstreckung',
    bucket: 'legs',
    primaryMuscles: ['glutes', 'hamstrings'],
    levels: [
      'bw-glute-bridge',        // Glute Bridge
      'bw-single-leg-bridge',   // Einbeinige Glute Bridge
    ],
  },
  {
    id: 'fam-core-antiextension',
    name: 'Core Anti-Extension',
    bucket: 'core',
    primaryMuscles: ['abs', 'obliques'],
    levels: [
      'bw-dead-bug',          // Dead Bug
      'bw-plank',             // Plank
      'bw-mountain-climber',  // Mountain Climber
    ],
  },
]
