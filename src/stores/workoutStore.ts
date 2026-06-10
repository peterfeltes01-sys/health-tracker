import { create } from 'zustand'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import type {
  Exercise,
  ExerciseMode,
  PerformedExercise,
  ActiveSession,
  WorkoutSession,
  WorkoutStats,
  WeeklyGoal,
  Achievement,
  ExerciseMediaOverride,
  CustomExercise,
  MediaItem,
} from '../types/workout'
import type { MovementFamily, LoggedSet } from '../types/training'
import { DEFAULT_WORKOUT_STATS, DEFAULT_WEEKLY_TARGET_DAYS, DEFAULT_WEEKLY_TARGET_POINTS } from '../types/workout'
import { getWorkoutRepository } from '../lib/workoutRepositoryRegistry'
import { getMovementFamilyRepository } from '../lib/movementFamilyRepositoryRegistry'
import { compressImage } from '../lib/mediaUploader'
import { getMediaUploader } from '../lib/mediaUploaderRegistry'
import { buildTodayRoutine, buildBonusRoutine } from '../utils/workout/routineBuilder'
import { sessionTotals, sessionTargetPoints, applyBalanceToCover } from '../utils/workout/scoring'
import { computeSessionQuality } from '../utils/training/sessionQuality'
import { getWeekId, buildEmptyWeeklyGoal, applySessionToWeeklyGoal, weeklyGoalBonus } from '../utils/workout/weeklyGoal'
import { evaluateAchievements } from '../utils/workout/achievements'
import { toISODate } from '../utils/calculations'
import { EXERCISES } from '../data/exercises'
import { computeWeeklyVolume } from '../features/workout/logic/volume'
import { analyzeBalance } from '../features/workout/logic/balance'
import { computeRecovery } from '../features/workout/logic/recovery'
import type { MuscleVolume, BucketVolume } from '../features/workout/logic/volume'
import type { BalanceWarning } from '../features/workout/logic/balance'
import type { RecoveryStatus } from '../features/workout/logic/recovery'
import type { ProgressionSuggestion } from '../features/workout/logic/progression'
import { evaluateProgression } from '../features/workout/logic/progression'
import type { SessionSetsForExercise } from '../features/workout/logic/progression'

interface RestTimerState {
  activeExerciseId: string | null
  totalSeconds: number
  secondsRemaining: number
  isRunning: boolean
  isPaused: boolean
}

interface WorkoutStoreState {
  uid: string | null
  todayRoutine: Exercise[]
  todaySession: WorkoutSession | null
  stats: WorkoutStats
  currentWeekGoal: WeeklyGoal | null
  achievements: Achievement[]
  activeSession: ActiveSession | null
  preferredMode: ExerciseMode
  targetDays: number
  targetPoints: number
  recentSessions: WorkoutSession[]
  weeklyHistory: WeeklyGoal[]
  mediaOverrides: ExerciseMediaOverride[]
  customExercises: CustomExercise[]
  loading: boolean
  error: string | null

  // Progression & families
  movementFamilies: MovementFamily[]
  progressionSuggestion: ProgressionSuggestion | null
  progressionOverrides: Record<string, string> // fromExerciseId → toExerciseId

  // Logged sets (per-set data)
  loggedSetsBuffer: LoggedSet[] // accumulated during active session

  // Rest timer
  restTimer: RestTimerState

  load(uid: string): Promise<void>
  buildRoutine(mode?: ExerciseMode): void
  startSession(mode?: ExerciseMode): void
  recordExercise(performed: PerformedExercise): void
  finishSession(): Promise<{ newAchievements: Achievement[] }>
  applyBalanceToday(): Promise<void>
  updateGoalSettings(targetDays: number, targetPoints: number, mode?: ExerciseMode): void
  buildBonusRound(): void

  // Logged sets
  addLoggedSet(set: LoggedSet): void

  // Progression
  computeProgressionForExercise(exercise: Exercise): void
  acceptProgression(fromExerciseId: string, toExerciseId: string): void

  // Rest timer
  startRest(exerciseId: string, seconds: number): void
  tickRest(): void
  addRestTime(delta: number): void
  pauseRest(): void
  resumeRest(): void
  skipRest(): void

  // Volume / Balance / Recovery selectors (derived, no persistence needed)
  selectWeeklyVolume(): { byMuscle: MuscleVolume[]; byBucket: BucketVolume[] }
  selectBalanceWarnings(): BalanceWarning[]
  selectRecovery(): RecoveryStatus[]

  // Media & Custom Exercises
  uploadExerciseMedia(
    exerciseId: string,
    file: File,
    strategy: 'append' | 'replace',
    onProgress: (pct: number) => void
  ): Promise<void>
  deleteExerciseMediaItem(exerciseId: string, storagePath: string): Promise<void>
  addCustomExercise(data: Omit<CustomExercise, 'id' | 'ownerUid' | 'createdAt' | 'isCustom'>): Promise<string>
  updateCustomExercise(e: CustomExercise): Promise<void>
  deleteCustomExercise(id: string): Promise<void>

  reset(): void
}

const DEFAULT_REST_TIMER: RestTimerState = {
  activeExerciseId: null,
  totalSeconds: 0,
  secondsRemaining: 0,
  isRunning: false,
  isPaused: false,
}

function deriveLoggedSetsFromSessions(sessions: WorkoutSession[]): LoggedSet[] {
  return sessions.flatMap((s) => s.loggedSets ?? [])
}

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => ({
  uid: null,
  todayRoutine: [],
  todaySession: null,
  stats: { ...DEFAULT_WORKOUT_STATS },
  currentWeekGoal: null,
  achievements: [],
  activeSession: null,
  preferredMode: 'bodyweight',
  targetDays: DEFAULT_WEEKLY_TARGET_DAYS,
  targetPoints: DEFAULT_WEEKLY_TARGET_POINTS,
  recentSessions: [],
  weeklyHistory: [],
  mediaOverrides: [],
  customExercises: [],
  loading: false,
  error: null,

  movementFamilies: [],
  progressionSuggestion: null,
  progressionOverrides: {},
  loggedSetsBuffer: [],
  restTimer: { ...DEFAULT_REST_TIMER },

  load: async (uid) => {
    set({ loading: true, error: null, uid })
    try {
      const repo = getWorkoutRepository()
      const familyRepo = getMovementFamilyRepository()
      const today = toISODate(new Date())
      const weekStart = format(new Date(), 'yyyy-MM-01')
      const range = { from: weekStart, to: today }

      const [
        stats,
        weekGoal,
        achievements,
        recentSessions,
        weeklyHistory,
        todaySession,
        mediaOverrides,
        customExercises,
        movementFamilies,
      ] = await Promise.all([
        repo.getStats(),
        repo.getWeeklyGoal(getWeekId(new Date())),
        repo.getAchievements(),
        repo.getSessions(range),
        repo.getAllWeeklyGoals(),
        repo.getSessionByDate(today),
        repo.getMediaOverrides(),
        repo.getCustomExercises(),
        familyRepo.getAll(),
      ])

      const mode = (stats as WorkoutStats & { preferredMode?: ExerciseMode }).preferredMode ?? 'bodyweight'
      const targetDays = (stats as WorkoutStats & { targetDays?: number }).targetDays ?? DEFAULT_WEEKLY_TARGET_DAYS
      const targetPoints_ = (stats as WorkoutStats & { targetPoints?: number }).targetPoints ?? DEFAULT_WEEKLY_TARGET_POINTS

      const { progressionOverrides } = get()
      const routine = buildTodayRoutine(mode, undefined, customExercises)
      const currentWeekGoal = weekGoal ?? buildEmptyWeeklyGoal(getWeekId(new Date()), targetDays, targetPoints_)

      set({
        stats,
        currentWeekGoal,
        achievements,
        recentSessions,
        weeklyHistory,
        todaySession,
        todayRoutine: routine,
        preferredMode: mode,
        targetDays,
        targetPoints: targetPoints_,
        mediaOverrides,
        customExercises,
        movementFamilies,
        loading: false,
      })
      // Apply any pending progression overrides
      if (Object.keys(progressionOverrides).length > 0) {
        get().buildRoutine(mode)
      }
    } catch (e) {
      set({ loading: false, error: String(e) })
    }
  },

  buildRoutine: (mode) => {
    const { preferredMode, customExercises, progressionOverrides } = get()
    const effectiveMode = mode ?? preferredMode
    let routine = buildTodayRoutine(effectiveMode, undefined, customExercises)

    // Apply pending progression overrides (substitute exercise with preferred variation)
    if (Object.keys(progressionOverrides).length > 0) {
      const allExercises: Exercise[] = [
        ...EXERCISES,
        ...customExercises.map((ce) => ({
          id: ce.id,
          name: ce.name,
          modes: ce.modes,
          primaryMuscles: ce.primaryMuscles,
          secondaryMuscles: ce.secondaryMuscles,
          difficulty: ce.difficulty,
          target: ce.target,
          basePoints: ce.basePoints,
          mediaUrls: ce.media.map((m) => m.url),
          instructions: ce.instructions,
          chairVariantNote: ce.chairVariantNote,
        })),
      ]
      const exerciseMap = new Map(allExercises.map((e) => [e.id, e]))
      routine = routine.map((ex) => {
        const overrideId = progressionOverrides[ex.id]
        return overrideId && exerciseMap.has(overrideId) ? exerciseMap.get(overrideId)! : ex
      })
    }

    set({ todayRoutine: routine, preferredMode: effectiveMode })
  },

  startSession: (mode) => {
    const { todayRoutine, preferredMode } = get()
    const effectiveMode = mode ?? preferredMode
    set({
      activeSession: {
        mode: effectiveMode,
        exercises: todayRoutine,
        currentIndex: 0,
        startedAt: Date.now(),
        performed: [],
      },
    })
  },

  recordExercise: (performed) => {
    const { activeSession } = get()
    if (!activeSession) return
    set({
      activeSession: {
        ...activeSession,
        performed: [...activeSession.performed, performed],
        currentIndex: activeSession.currentIndex + 1,
      },
    })
  },

  addLoggedSet: (loggedSet) => {
    set((s) => ({ loggedSetsBuffer: [...s.loggedSetsBuffer, loggedSet] }))
  },

  computeProgressionForExercise: (exercise) => {
    const { recentSessions, movementFamilies } = get()
    const family = movementFamilies.find((f) => f.levels.includes(exercise.id)) ?? null

    // Build SessionSetsForExercise from historical loggedSets
    const sessionMap = new Map<string, SessionSetsForExercise>()
    for (const session of recentSessions) {
      for (const ls of session.loggedSets ?? []) {
        if (ls.exerciseId !== exercise.id) continue
        const existing = sessionMap.get(session.date)
        if (existing) {
          existing.sets.push({ reps: ls.reps, rir: ls.rir })
        } else {
          sessionMap.set(session.date, {
            sessionDate: session.date,
            sets: [{ reps: ls.reps, rir: ls.rir }],
          })
        }
      }
    }
    const recent = Array.from(sessionMap.values()).sort((a, b) =>
      a.sessionDate.localeCompare(b.sessionDate)
    )

    const suggestion = evaluateProgression(exercise, family, recent)
    set({ progressionSuggestion: suggestion })
  },

  acceptProgression: (fromExerciseId, toExerciseId) => {
    set((s) => ({
      progressionOverrides: { ...s.progressionOverrides, [fromExerciseId]: toExerciseId },
    }))
  },

  startRest: (exerciseId, seconds) => {
    set({
      restTimer: {
        activeExerciseId: exerciseId,
        totalSeconds: seconds,
        secondsRemaining: seconds,
        isRunning: true,
        isPaused: false,
      },
    })
  },

  tickRest: () => {
    set((s) => {
      const t = s.restTimer
      if (!t.isRunning || t.isPaused || t.secondsRemaining <= 0) return s
      const next = t.secondsRemaining - 1
      return { restTimer: { ...t, secondsRemaining: next, isRunning: next > 0 } }
    })
  },

  addRestTime: (delta) => {
    set((s) => ({
      restTimer: {
        ...s.restTimer,
        secondsRemaining: Math.max(0, s.restTimer.secondsRemaining + delta),
        totalSeconds: Math.max(0, s.restTimer.totalSeconds + delta),
      },
    }))
  },

  pauseRest: () => {
    set((s) => ({ restTimer: { ...s.restTimer, isPaused: true } }))
  },

  resumeRest: () => {
    set((s) => ({ restTimer: { ...s.restTimer, isPaused: false } }))
  },

  skipRest: () => {
    set({ restTimer: { ...DEFAULT_REST_TIMER } })
  },

  selectWeeklyVolume: () => {
    const { recentSessions } = get()
    const allLoggedSets = deriveLoggedSetsFromSessions(recentSessions)
    const now = new Date()
    const windowStart = startOfDay(subDays(now, 6))
    const windowEnd = endOfDay(now)
    return computeWeeklyVolume(allLoggedSets, windowStart, windowEnd)
  },

  selectBalanceWarnings: () => {
    const { byMuscle, byBucket } = get().selectWeeklyVolume()
    return analyzeBalance(byBucket, byMuscle)
  },

  selectRecovery: () => {
    const { recentSessions } = get()
    const allLoggedSets = deriveLoggedSetsFromSessions(recentSessions)
    return computeRecovery(allLoggedSets, new Date())
  },

  finishSession: async () => {
    const { activeSession, stats, currentWeekGoal, todayRoutine, recentSessions, weeklyHistory, achievements, targetDays, targetPoints, loggedSetsBuffer } = get()
    if (!activeSession) return { newAchievements: [] }

    const now = Date.now()
    const today = toISODate(new Date())
    const durationSeconds = Math.round((now - activeSession.startedAt) / 1000)

    const { totalPoints, bonusPoints } = sessionTotals(activeSession.performed)
    const targetPts = sessionTargetPoints(todayRoutine)

    // PR bonus: unique exercises with a PR in this session
    const PR_BONUS_POINTS = 50
    const prExerciseIds = new Set(loggedSetsBuffer.filter((ls) => ls.isPR).map((ls) => ls.exerciseId))
    const prBonusTotal = prExerciseIds.size * PR_BONUS_POINTS

    const surplus = Math.max(0, totalPoints + prBonusTotal - targetPts)
    const newBalance = stats.pointBalance + surplus

    const yesterday = toISODate(new Date(Date.now() - 86400000))
    let newStreak = stats.currentStreakDays
    if (stats.lastSessionDate === yesterday) {
      newStreak = stats.currentStreakDays + 1
    } else if (stats.lastSessionDate !== today) {
      newStreak = 1
    }

    const newLongest = Math.max(stats.longestStreakDays, newStreak)
    const newStats: WorkoutStats = {
      totalPoints: stats.totalPoints + totalPoints + prBonusTotal,
      pointBalance: newBalance,
      currentStreakDays: newStreak,
      longestStreakDays: newLongest,
      totalSessions: stats.totalSessions + 1,
      totalMinutes: stats.totalMinutes + Math.round(durationSeconds / 60),
      lastSessionDate: today,
    }

    const qualityScore = computeSessionQuality({
      id: 'tmp',
      date: today,
      startedAt: activeSession.startedAt,
      completedAt: now,
      durationSeconds,
      mode: activeSession.mode,
      performed: activeSession.performed,
      totalPoints: totalPoints + prBonusTotal,
      bonusPoints: bonusPoints + prBonusTotal,
      loggedSets: loggedSetsBuffer.length > 0 ? loggedSetsBuffer : undefined,
    } as WorkoutSession)

    const sessionObj: Omit<WorkoutSession, 'id'> = {
      date: today,
      startedAt: activeSession.startedAt,
      completedAt: now,
      durationSeconds,
      mode: activeSession.mode,
      performed: activeSession.performed,
      totalPoints: totalPoints + prBonusTotal,
      bonusPoints: bonusPoints + prBonusTotal,
      loggedSets: loggedSetsBuffer.length > 0 ? loggedSetsBuffer : undefined,
      sessionType: 'NORMAL',
      sessionQualityScore: qualityScore,
    }

    const weekId = getWeekId(new Date())
    const base = currentWeekGoal ?? buildEmptyWeeklyGoal(weekId, targetDays, targetPoints)
    // Pass ALL recentSessions so multi-session days don't double-count training days
    const updatedGoal = applySessionToWeeklyGoal(base, sessionObj, recentSessions)

    if (updatedGoal.achieved && !base.achieved) {
      const bonus = weeklyGoalBonus(targetPoints)
      newStats.totalPoints += bonus
      newStats.pointBalance += bonus
    }

    const earnedIds = new Set(achievements.map((a) => a.id))
    const newAchievements = evaluateAchievements(newStats, [...weeklyHistory, updatedGoal], earnedIds)

    const repo = getWorkoutRepository()
    const sessionId = await repo.finishSessionAtomic({
      session: sessionObj,
      stats: newStats,
      weeklyGoal: updatedGoal,
      newAchievements,
    })

    const completedSession: WorkoutSession = { ...sessionObj, id: sessionId }

    set({
      activeSession: null,
      todaySession: completedSession,
      stats: newStats,
      currentWeekGoal: updatedGoal,
      achievements: [...achievements, ...newAchievements],
      recentSessions: [...recentSessions, completedSession],
      loggedSetsBuffer: [],
    })

    return { newAchievements }
  },

  applyBalanceToday: async () => {
    const { todaySession, stats, currentWeekGoal, todayRoutine, targetDays, targetPoints } = get()
    if (!todaySession || stats.pointBalance <= 0) return

    const dailyTarget = sessionTargetPoints(todayRoutine)
    const gap = Math.max(0, dailyTarget - todaySession.totalPoints)
    if (gap <= 0) return

    const { used, remaining } = applyBalanceToCover(gap, stats.pointBalance)
    if (used <= 0) return

    const newStats: WorkoutStats = { ...stats, pointBalance: remaining }
    const weekId = getWeekId(new Date())
    const base = currentWeekGoal ?? buildEmptyWeeklyGoal(weekId, targetDays, targetPoints)
    const updatedGoal: WeeklyGoal = { ...base, earnedPoints: base.earnedPoints + used }
    if (!updatedGoal.achieved && updatedGoal.trainedDays >= updatedGoal.targetDays && updatedGoal.earnedPoints >= updatedGoal.targetPoints) {
      updatedGoal.achieved = true
      updatedGoal.achievedAt = Date.now()
    }

    const repo = getWorkoutRepository()
    await Promise.all([repo.updateStats(newStats), repo.upsertWeeklyGoal(updatedGoal)])
    set({ stats: newStats, currentWeekGoal: updatedGoal })
  },

  updateGoalSettings: (targetDays, targetPoints, mode) => {
    const { preferredMode, customExercises } = get()
    const effectiveMode = mode ?? preferredMode
    const routine = buildTodayRoutine(effectiveMode, undefined, customExercises)
    set({ targetDays, targetPoints, preferredMode: effectiveMode, todayRoutine: routine })
  },

  // ── Media & Custom Exercises ────────────────────────────────────────────────

  uploadExerciseMedia: async (exerciseId, file, strategy, onProgress) => {
    const { uid, mediaOverrides } = get()
    if (!uid) throw new Error('MEDIA_UPLOAD_REQUIRES_LOGIN')

    const LIMIT_IMAGE = 5 * 1024 * 1024
    const LIMIT_VIDEO = 50 * 1024 * 1024
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) throw new Error('INVALID_FILE_TYPE')
    if (isImage && file.size > LIMIT_IMAGE) throw new Error('IMAGE_TOO_LARGE')
    if (isVideo && file.size > LIMIT_VIDEO) throw new Error('VIDEO_TOO_LARGE')

    const processedFile = isImage ? await compressImage(file) : file
    const ext = processedFile.name.split('.').pop() ?? (isImage ? 'jpg' : 'mp4')
    const filename = `${Date.now()}.${ext}`
    const storagePath = `users/${uid}/exerciseMedia/${exerciseId}/${filename}`

    const uploader = getMediaUploader()
    const { url } = await uploader.uploadFile(processedFile, storagePath, onProgress)

    const newItem: MediaItem = {
      type: isImage ? 'image' : 'video',
      url,
      storagePath,
      sizeBytes: processedFile.size,
      uploadedAt: Date.now(),
    }

    const existing = mediaOverrides.find((o) => o.exerciseId === exerciseId)
    const updated: ExerciseMediaOverride = {
      exerciseId,
      strategy,
      customMedia: [...(existing?.customMedia ?? []), newItem],
      updatedAt: Date.now(),
    }

    await getWorkoutRepository().upsertMediaOverride(updated)
    set({
      mediaOverrides: [
        ...mediaOverrides.filter((o) => o.exerciseId !== exerciseId),
        updated,
      ],
    })
  },

  deleteExerciseMediaItem: async (exerciseId, storagePath) => {
    const { mediaOverrides } = get()
    try {
      await getMediaUploader().deleteFile(storagePath)
    } catch {
      // If storage delete fails (e.g. already deleted), still clean up Firestore
    }
    await getWorkoutRepository().deleteMediaItem(exerciseId, storagePath)
    set({
      mediaOverrides: mediaOverrides
        .map((o) =>
          o.exerciseId === exerciseId
            ? { ...o, customMedia: o.customMedia.filter((m) => m.storagePath !== storagePath) }
            : o
        )
        .filter((o) => o.customMedia.length > 0),
    })
  },

  addCustomExercise: async (data) => {
    const { uid, customExercises, preferredMode } = get()
    if (!uid) throw new Error('NOT_AUTHENTICATED')
    const repo = getWorkoutRepository()
    const full: Omit<CustomExercise, 'id'> = {
      ...data,
      isCustom: true,
      ownerUid: uid,
      media: [],
      createdAt: Date.now(),
    }
    const id = await repo.addCustomExercise(full)
    const created: CustomExercise = { ...full, id } as CustomExercise
    const updated = [...customExercises, created]
    const routine = buildTodayRoutine(preferredMode, undefined, updated)
    set({ customExercises: updated, todayRoutine: routine })
    return id
  },

  updateCustomExercise: async (e) => {
    const { customExercises, preferredMode } = get()
    await getWorkoutRepository().updateCustomExercise(e)
    const updated = customExercises.map((x) => (x.id === e.id ? e : x))
    const routine = buildTodayRoutine(preferredMode, undefined, updated)
    set({ customExercises: updated, todayRoutine: routine })
  },

  deleteCustomExercise: async (id) => {
    const { customExercises, preferredMode } = get()
    await getWorkoutRepository().deleteCustomExercise(id)
    const updated = customExercises.filter((x) => x.id !== id)
    const routine = buildTodayRoutine(preferredMode, undefined, updated)
    set({ customExercises: updated, todayRoutine: routine })
  },

  buildBonusRound: () => {
    const { preferredMode, recentSessions, customExercises } = get()
    const today = toISODate(new Date())
    const todaySessions = recentSessions.filter((s) => s.date === today)
    const doneIds = todaySessions.flatMap((s) => s.performed.map((p) => p.exerciseId))
    const roundIndex = todaySessions.length + 1
    const bonusRoutine = buildBonusRoutine(preferredMode, doneIds, roundIndex, customExercises)
    set({ todayRoutine: bonusRoutine })
  },

  reset: () =>
    set({
      uid: null,
      todayRoutine: [],
      todaySession: null,
      stats: { ...DEFAULT_WORKOUT_STATS },
      currentWeekGoal: null,
      achievements: [],
      activeSession: null,
      recentSessions: [],
      weeklyHistory: [],
      mediaOverrides: [],
      customExercises: [],
      loading: false,
      error: null,
      movementFamilies: [],
      progressionSuggestion: null,
      progressionOverrides: {},
      loggedSetsBuffer: [],
      restTimer: { ...DEFAULT_REST_TIMER },
    }),
}))
