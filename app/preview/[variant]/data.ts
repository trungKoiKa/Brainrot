// Route TẠM để Trung chọn hướng thiết kế (redesign giai đoạn 2). Xoá ở giai đoạn 5. Chỉ đọc, không ghi.
import { connection } from "next/server";
import { getGoals, getHabits, getProfile, getRecentDailyLogs, getTaskProjects, getTasks } from "@/lib/db/data";
import { addDays, daysBetween, formatDay, greetingVN, longDateVN, weekdayShort, workdayClock, workdayVN } from "@/lib/date";
import { doneHabits, habitsForMonth } from "@/lib/habits";
import { monthOf, periodOf } from "@/lib/period";
import { planToday, todayProgress, upcomingDeadlines } from "@/lib/today";

export async function loadToday() {
  await connection();
  const now = new Date();
  const today = workdayVN(now);
  const [profile, habits, goals, tasks, logs, projects] = await Promise.all([
    getProfile(),
    getHabits(),
    getGoals(),
    getTasks(),
    getRecentDailyLogs(),
    getTaskProjects(),
  ]);
  const plan = planToday(today, tasks.data);
  const doneToday = tasks.data.filter((t) => t.status === "Xong" && t.doneOn === today);
  const week = periodOf("week", today);
  const weekGoals = goals.data.filter((g) => g.level === "week" && g.start === week.start && g.type === "Ưu tiên" && g.title.trim());
  const habitNames = habitsForMonth(habits.data, monthOf(today)).map((h) => h.name);
  const byDay = new Map(logs.data.filter((l) => l.date).map((l) => [l.date as string, doneHabits(l)]));
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const target = profile.target.date ? { days: daysBetween(today, profile.target.date), label: profile.target.label, date: formatDay(profile.target.date, true) } : null;
  return {
    today,
    greeting: `${greetingVN(now)}, ${profile.name.trim().split(/\s+/).at(-1) || "bạn"}`,
    dateLong: longDateVN(workdayClock(now)),
    target,
    plan,
    doneToday,
    progress: todayProgress(today, tasks.data),
    deadlines: upcomingDeadlines(today, tasks.data),
    weekGoals: weekGoals.map((g) => ({ id: g.id, title: g.title, done: g.done })),
    habits: habitNames.map((name) => ({
      name,
      today: (byDay.get(today) ?? []).includes(name),
      week: last7.map((d) => ({ day: d, label: weekdayShort(d), done: (byDay.get(d) ?? []).includes(name) })),
    })),
    projectSlot: (p: string | null) => {
      const i = p ? projects.indexOf(p) : -1;
      return i >= 0 && i < 4 ? i + 1 : 0;
    },
    fmt: (d: string) => formatDay(d, true),
    dayLabel: (d: string) => `${weekdayShort(d)} ${formatDay(d, true)}`,
  };
}

export type TodayData = Awaited<ReturnType<typeof loadToday>>;
