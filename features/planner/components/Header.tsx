import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, Undo2Icon } from 'lucide-react'
import { navigate, type Route } from '../lib/route'
import { currentWeekStart, formatRange, shiftWeek, weekLabel } from '../lib/week'
import { selectWeekStart, usePlanner } from '../store/usePlanner'
import SettingsMenu from './SettingsMenu'
import { useUI } from '../store/useUI'

export default function Header({ route }: { route: Route }) {
  const weekStart = usePlanner(selectWeekStart)
  const setWeekStart = usePlanner((s) => s.setWeekStart)
  const setFocusDay = useUI((s) => s.setFocusDay)
  const isCurrent = weekStart === currentWeekStart()

  const go = (ws: string) => {
    setWeekStart(ws)
    setFocusDay(null)
  }

  return (
    <header className="header">
      {/* Brainrot: bỏ logo "weekly." — tiêu đề "Planner" nằm ở PageHeader của trang */}
      {route === 'plan' && (
        <div className="week-picker">
          <span className="label row"><CalendarDaysIcon size={14} aria-hidden />{weekLabel(weekStart)}</span>
          <button className="icon-btn" onClick={() => go(shiftWeek(weekStart, -1))} aria-label="Previous week"><ChevronLeftIcon size={15} aria-hidden /></button>
          <span className="range">{formatRange(weekStart)}</span>
          <button className="icon-btn" onClick={() => go(shiftWeek(weekStart, 1))} aria-label="Next week"><ChevronRightIcon size={15} aria-hidden /></button>
          {!isCurrent && (
            <button className="icon-btn" onClick={() => go(currentWeekStart())} aria-label="Back to this week" title="Back to this week"><Undo2Icon size={15} aria-hidden /></button>
          )}
        </div>
      )}

      <nav className="header-nav">
        <SettingsMenu />
        {/* Brainrot: không có đồng bộ Supabase — dữ liệu chỉ ở trình duyệt này */}
        <span className="status">Saved in this browser</span>
        {route === 'plan' ? (
          <>
            <button className="btn" onClick={() => navigate('stats')}>Stats</button>
            <button className="btn" onClick={() => navigate('archive')}>Archive</button>
          </>
        ) : (
          <button className="btn" onClick={() => navigate('plan')}>‹ Back to plan</button>
        )}
      </nav>
    </header>
  )
}
