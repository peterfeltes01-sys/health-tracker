import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { PageWrapper } from '../components/layout/PageWrapper'
import { HabitForm } from '../components/habits/HabitForm'
import { useHabitStore } from '../stores/habitStore'
import type { Habit } from '../types/habits'

export function HabitFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { habits, addHabit, updateHabit } = useHabitStore()

  const existing = id ? habits.find((h) => h.id === id) : undefined
  const isEdit = !!existing

  async function handleSave(data: Omit<Habit, 'id' | 'createdAt' | 'archivedAt' | 'order'>) {
    if (isEdit && existing) {
      await updateHabit({ ...existing, ...data })
    } else {
      await addHabit(data)
    }
    navigate('/habits')
  }

  return (
    <>
      <Header title={isEdit ? 'Gewohnheit bearbeiten' : 'Neue Gewohnheit'} />
      <PageWrapper>
        <HabitForm
          initial={existing}
          onSave={handleSave}
          onCancel={() => navigate('/habits')}
        />
      </PageWrapper>
    </>
  )
}
