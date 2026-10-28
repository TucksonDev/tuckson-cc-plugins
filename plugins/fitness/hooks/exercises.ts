import type { Posture } from '../types'

export type Exercise = {
  id: string
  name: string
  posture: Posture
  met: number
  seconds: number
  reps?: number
}

export const EXERCISES: Exercise[] = [
  { id: 'neck-rolls', name: 'Neck rolls', posture: 'seated', met: 2.3, seconds: 30, reps: 10 },
  { id: 'shoulder-rolls', name: 'Shoulder rolls', posture: 'seated', met: 2.3, seconds: 30, reps: 20 },
  { id: 'shoulder-blade-squeezes', name: 'Shoulder blade squeezes', posture: 'seated', met: 2.5, seconds: 30, reps: 15 },
  { id: 'seated-torso-twists', name: 'Seated torso twists', posture: 'seated', met: 2.5, seconds: 40, reps: 20 },
  { id: 'seated-knee-lifts', name: 'Seated knee lifts', posture: 'seated', met: 3.0, seconds: 45, reps: 30 },
  { id: 'seated-leg-extensions', name: 'Seated leg extensions', posture: 'seated', met: 3.0, seconds: 45, reps: 24 },
  { id: 'seated-calf-raises', name: 'Seated calf raises', posture: 'seated', met: 2.5, seconds: 30, reps: 25 },
  { id: 'chair-dips', name: 'Chair tricep dips', posture: 'seated', met: 4.0, seconds: 30, reps: 10 },
  { id: 'wrist-stretches', name: 'Wrist and forearm stretch', posture: 'seated', met: 2.0, seconds: 30 },
  { id: 'seated-march', name: 'Fast seated march', posture: 'seated', met: 3.5, seconds: 45 },
  { id: 'squats', name: 'Bodyweight squats', posture: 'standing', met: 5.0, seconds: 45, reps: 15 },
  { id: 'chair-squats', name: 'Sit-to-stand', posture: 'standing', met: 5.0, seconds: 40, reps: 12 },
  { id: 'calf-raises', name: 'Standing calf raises', posture: 'standing', met: 3.0, seconds: 40, reps: 25 },
  { id: 'lunges', name: 'Alternating lunges', posture: 'standing', met: 5.0, seconds: 60, reps: 20 },
  { id: 'wall-sit', name: 'Wall sit', posture: 'standing', met: 4.0, seconds: 30 },
  { id: 'jumping-jacks', name: 'Jumping jacks', posture: 'standing', met: 8.0, seconds: 45, reps: 30 },
  { id: 'high-knees', name: 'High knees', posture: 'standing', met: 8.0, seconds: 30 },
  { id: 'standing-side-bends', name: 'Standing side bends', posture: 'standing', met: 2.5, seconds: 40, reps: 20 },
  { id: 'wall-push-ups', name: 'Wall push-ups', posture: 'standing', met: 3.5, seconds: 40, reps: 15 },
  { id: 'hip-circles', name: 'Standing hip circles', posture: 'standing', met: 2.5, seconds: 30, reps: 20 },
  { id: 'push-ups', name: 'Push-ups', posture: 'floor', met: 8.0, seconds: 30, reps: 10 },
  { id: 'plank', name: 'Plank', posture: 'floor', met: 3.8, seconds: 30 },
  { id: 'glute-bridges', name: 'Glute bridges', posture: 'floor', met: 3.8, seconds: 45, reps: 15 },
  { id: 'mountain-climbers', name: 'Mountain climbers', posture: 'floor', met: 8.0, seconds: 30 },
  { id: 'bird-dogs', name: 'Bird dogs', posture: 'floor', met: 3.0, seconds: 60, reps: 16 },
  { id: 'superman-hold', name: 'Superman hold', posture: 'floor', met: 3.0, seconds: 20 },
  { id: 'bicycle-crunches', name: 'Bicycle crunches', posture: 'floor', met: 4.0, seconds: 40, reps: 20 },
  { id: 'burpees', name: 'Burpees', posture: 'floor', met: 8.0, seconds: 45, reps: 8 },
]
