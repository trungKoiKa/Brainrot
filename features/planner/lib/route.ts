import { useSyncExternalStore } from 'react'

// Trang con của planner, điều hướng bằng #hash bên trong /planner. Đã bỏ 'auth' (Supabase) khi tích hợp vào Brainrot.
export type Route = 'plan' | 'stats' | 'archive'
const ROUTES: Route[] = ['plan', 'stats', 'archive']

const read = (): Route => {
  const r = window.location.hash.replace(/^#\/?/, '') as Route
  return ROUTES.includes(r) ? r : 'plan'
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

// Giá trị phía server ('plan') chỉ để thỏa API; planner luôn render ở client (ssr: false)
export const useRoute = () => useSyncExternalStore(subscribe, read, () => 'plan' as Route)

export const navigate = (r: Route) => {
  window.location.hash = r === 'plan' ? '' : `/${r}`
  window.scrollTo(0, 0)
}
