import type { ProgressionDecision } from '../../../types/training'

export interface ProgressionDecisionRepository {
  addDecision(decision: Omit<ProgressionDecision, 'id'>): Promise<string>
  getDecisions(exerciseId?: string): Promise<ProgressionDecision[]>
}
