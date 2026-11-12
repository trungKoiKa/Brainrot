// Tạo / làm mới tài khoản DEMO có dữ liệu mẫu, để rà soát giao diện ở trạng thái đầy đủ (kế hoạch redesign 11/2026).
//   npm run demo:seed
// - Chỉ ghi cho đúng user có email DEMO_EMAIL; chưa có thì tạo (KHÔNG có mật khẩu → không đăng nhập được bằng form;
//   muốn đăng nhập tay thì chạy `npm run user:password -- demo@example.com`).
// - Chạy lại được: xoá sạch dữ liệu cũ của user demo rồi ghi lại theo ngày hôm nay (giờ Việt Nam).
// - Không bao giờ đụng dữ liệu của user khác. Xoá hẳn demo: Cài đặt → Xoá tài khoản, hoặc `npm run demo:seed -- --remove`.
import { neon } from "@neondatabase/serverless";

const DEMO_EMAIL = "demo@example.com";
if (!process.env.DATABASE_URL) {
  console.error("Thiếu DATABASE_URL trong .env.local.");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

// ---------- ngày (giờ Việt Nam, như lib/date.ts) ----------
const todayVN = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const mondayOf = (day) => {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = CN
  return addDays(day, dow === 0 ? -6 : 1 - dow);
};
const monthStart = (day) => `${day.slice(0, 7)}-01`;
const prevMonthStart = (day) => {
  const d = new Date(`${monthStart(day)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
};

const today = todayVN();
const monday = mondayOf(today);
const month = monthStart(today);

// ---------- user demo ----------
let [user] = await sql`select id from users where email = ${DEMO_EMAIL}`;

if (process.argv.includes("--remove")) {
  if (user) await sql`delete from users where id = ${user.id}`;
  console.log(user ? "Đã xoá tài khoản demo và toàn bộ dữ liệu của nó." : "Không có tài khoản demo.");
  process.exit(0);
}

if (!user) {
  [user] = await sql`insert into users (email, name) values (${DEMO_EMAIL}, ${"Bạn Demo"}) returning id`;
  console.log("Đã tạo tài khoản demo (chưa có mật khẩu).");
}
const uid = user.id;

// Xoá dữ liệu cũ của riêng demo (goal_tasks, habit_days đi theo nhờ ON DELETE CASCADE)
await sql`delete from goals where user_id = ${uid}`;
await sql`delete from tasks where user_id = ${uid}`;
await sql`delete from habits where user_id = ${uid}`;
await sql`delete from daily_logs where user_id = ${uid}`;
await sql`delete from reflections where user_id = ${uid}`;
await sql`delete from ideas where user_id = ${uid}`;
await sql`delete from projects where user_id = ${uid}`;
await sql`delete from knowledge where user_id = ${uid}`; // knowledge_links đi theo nhờ ON DELETE CASCADE
await sql`delete from fields where user_id = ${uid}`;
await sql`delete from login_attempts where email = ${DEMO_EMAIL}`;
await sql`update users set name = ${"Bạn Demo"}, target_date = ${addDays(today, 26)}, target_label = ${"hạn nộp đồ án"} where id = ${uid}`;

// ---------- dự án ----------
const projectNames = ["Đồ án", "Học AI", "Thực tập", "Sức khỏe"];
const projectId = {};
for (const [i, name] of projectNames.entries()) {
  const [p] = await sql`insert into projects (user_id, name, sort) values (${uid}, ${name}, ${i}) returning id`;
  projectId[name] = p.id;
}

// ---------- việc ----------
// [tiêu đề, dự án, ưu tiên, trạng thái, deadline (lệch ngày), Ngày làm (lệch ngày), xong (lệch ngày), ghi chú]
const T = (title, project, priority, status, deadline, planned, done, note = "") => ({ title, project, priority, status, deadline, planned, done, note });
const taskRows = [
  T("Viết chương 3: thiết kế phần cứng", "Đồ án", "Cao", "Đang làm", 5, 0, null, "Còn phần sơ đồ khối và bảng linh kiện"),
  T("Đo dòng tiêu thụ ESP32 ở chế độ ngủ", "Đồ án", "Cao", "Chưa làm", 3, 0, null),
  T("Gửi bản nháp chương 2 cho thầy", "Đồ án", "Cao", "Chưa làm", -2, -3, null), // quá hạn + trễ lịch
  T("Vẽ lại sơ đồ nguyên lý trên KiCad", "Đồ án", "Vừa", "Chưa làm", 9, 1, null),
  T("Chụp ảnh mạch thật cho báo cáo", "Đồ án", "Thấp", "Chưa làm", 12, null, null),
  T("Viết phần kết luận và hướng phát triển", "Đồ án", "Vừa", "Chưa làm", 20, null, null),
  T("Sửa lỗi mất kết nối MQTT khi Wi-Fi yếu", "Đồ án", "Cao", "Xong", null, -2, -2),
  T("Đọc paper YOLOv8 phần head", "Học AI", "Vừa", "Đang làm", 4, 0, null),
  T("Làm bài tập tuần 3 khoá Computer Vision", "Học AI", "Vừa", "Chưa làm", 6, 2, null),
  T("Thử fine-tune model phát hiện lỗi hàn", "Học AI", "Thấp", "Chưa làm", null, null, null),
  T("Ghi chú lại cách tính mAP", "Học AI", "Thấp", "Xong", null, -4, -4),
  T("Xem bài giảng attention cơ bản", "Học AI", "Vừa", "Xong", null, -1, -1),
  T("Cập nhật báo cáo tuần cho anh mentor", "Thực tập", "Cao", "Chưa làm", 1, 1, null),
  T("Review pull request firmware cảm biến", "Thực tập", "Vừa", "Chưa làm", 2, 0, null),
  T("Chuẩn bị slide demo cuối kỳ thực tập", "Thực tập", "Vừa", "Chưa làm", 14, 5, null),
  T("Đọc tài liệu giao thức Modbus", "Thực tập", "Thấp", "Xong", null, -3, -3),
  T("Chạy bộ 5 km", "Sức khỏe", "Vừa", "Chưa làm", null, 0, null),
  T("Đặt lịch khám răng", "Sức khỏe", "Thấp", "Chưa làm", 8, null, null),
  T("Mua giày chạy mới", "Sức khỏe", "Thấp", "Xong", null, -5, -5),
  T("Gia hạn thẻ thư viện", null, "Thấp", "Chưa làm", 0, null, null), // hạn hôm nay, chưa xếp
  T("Trả sách Cấu trúc máy tính", null, "Vừa", "Chưa làm", -1, null, null), // quá hạn
  T("Dọn lại thư mục Google Drive", null, null, "Chưa làm", null, null, null),
  T("Đóng tiền điện tháng này", null, "Cao", "Xong", null, -6, -6),
  T("Gọi điện về nhà", null, null, "Xong", null, -2, -2),
  T("Sắp xếp lại bàn học", null, null, "Chưa làm", null, 3, null),
];
const taskId = {};
for (const [i, t] of taskRows.entries()) {
  const created = new Date(Date.now() - (30 - i) * 86_400_000).toISOString();
  const [row] = await sql`
    insert into tasks (user_id, title, project_id, status, priority, deadline, planned_on, done_on, note, created_at)
    values (
      ${uid}, ${t.title}, ${t.project ? projectId[t.project] : null}, ${t.status}, ${t.priority},
      ${t.deadline === null ? null : addDays(today, t.deadline)},
      ${t.planned === null ? null : addDays(today, t.planned)},
      ${t.done === null ? null : addDays(today, t.done)},
      ${t.note}, ${created}
    ) returning id`;
  taskId[t.title] = row.id;
}

// ---------- thói quen + ngày đã làm (3 tuần gần nhất, tỉ lệ khác nhau) ----------
const habitDefs = [
  ["Ngủ trước 0h", 0.8],
  ["Đọc sách 20 phút", 0.6],
  ["Tập thể dục", 0.45],
  ["Không dùng điện thoại sau 23h", 0.3],
];
const habitId = {};
let seed = 7;
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
for (const [i, [name, rate]] of habitDefs.entries()) {
  const [h] = await sql`insert into habits (user_id, name, from_month, sort) values (${uid}, ${name}, ${prevMonthStart(today)}, ${i}) returning id`;
  habitId[name] = h.id;
  for (let d = 20; d >= 1; d--) if (rand() < rate) await sql`insert into habit_days (habit_id, day) values (${h.id}, ${addDays(today, -d)})`;
}

// ---------- Daily Log (10 ngày gần nhất, chừa vài ngày trống) ----------
const logs = [
  [-1, "Xong sửa lỗi MQTT, xem bài giảng attention", "Chưa kịp đo dòng ngủ", "Retained message giúp client mới nhận trạng thái ngay"],
  [-2, "Gọi về nhà, sửa lỗi kết nối", "Bỏ buổi chạy bộ", "Watchdog nên đặt lâu hơn thời gian kết nối Wi-Fi"],
  [-3, "Đọc tài liệu Modbus", "Chương 2 chưa gửi được", "Modbus RTU dùng CRC16"],
  [-4, "Ghi chú mAP", "", "mAP@0.5 khác mAP@0.5:0.95"],
  [-6, "Đóng tiền điện, viết 2 trang chương 3", "Ngủ muộn", ""],
  [-7, "Lắp xong mạch nguồn", "Chưa đọc paper", "LDO nóng khi dòng > 500 mA"],
  [-9, "Họp với thầy hướng dẫn", "", "Thầy muốn thêm phần so sánh năng lượng"],
  [-10, "Mua giày chạy", "Không làm bài tập CV", ""],
];
for (const [d, done, dropped, learned] of logs) {
  await sql`insert into daily_logs (user_id, day, done, dropped, learned) values (${uid}, ${addDays(today, d)}, ${done}, ${dropped}, ${learned})`;
}

// ---------- mục tiêu ----------
const goal = async (level, start, title, type, extra = {}) => {
  const [g] = await sql`
    insert into goals (user_id, level, start, title, type, done, habit_id, threshold)
    values (${uid}, ${level}, ${start}, ${title}, ${type}, ${extra.done ?? false}, ${extra.habit ? habitId[extra.habit] : null}, ${extra.threshold ?? null})
    returning id`;
  for (const t of extra.tasks ?? []) await sql`insert into goal_tasks (goal_id, task_id) values (${g.id}, ${taskId[t]})`;
  return g.id;
};
await goal("month", month, "Hoàn thành chương 3 đồ án", "Ưu tiên", {
  tasks: ["Viết chương 3: thiết kế phần cứng", "Vẽ lại sơ đồ nguyên lý trên KiCad", "Chụp ảnh mạch thật cho báo cáo"],
});
await goal("month", month, "Ngủ trước 0h ít nhất 80% số ngày", "Ưu tiên", { habit: "Ngủ trước 0h", threshold: 80 });
await goal("month", month, "Học xong khoá Computer Vision tuần 1–4", "Thường", { tasks: ["Làm bài tập tuần 3 khoá Computer Vision", "Ghi chú lại cách tính mAP"] });
await goal("month", month, "Chạy bộ đủ 8 buổi", "Thường", { habit: "Tập thể dục", threshold: 60 });
await goal("week", monday, "Gửi chương 2 và đo xong dòng tiêu thụ", "Ưu tiên", {
  tasks: ["Gửi bản nháp chương 2 cho thầy", "Đo dòng tiêu thụ ESP32 ở chế độ ngủ"],
});
await goal("week", monday, "Báo cáo tuần thực tập đúng hạn", "Thường", { tasks: ["Cập nhật báo cáo tuần cho anh mentor", "Review pull request firmware cảm biến"] });
await goal("week", mondayOf(addDays(today, -7)), "Sửa xong lỗi MQTT", "Ưu tiên", { done: true, tasks: ["Sửa lỗi mất kết nối MQTT khi Wi-Fi yếu"] });

// ---------- nhìn lại kỳ trước (để thấy "Kỳ trước bạn định tập trung") ----------
await sql`
  insert into reflections (user_id, level, start, went_well, lesson, grateful, next_focus)
  values (${uid}, ${"month"}, ${prevMonthStart(today)}, ${"Giữ nhịp viết đồ án đều mỗi ngày"},
          ${"Chia việc lớn thành việc 1–2 giờ thì dễ bắt đầu hơn"}, ${"Thầy phản hồi nhanh"},
          ${"Hoàn thành chương 3 đồ án\nNgủ trước 0h\nChạy bộ 2 buổi mỗi tuần"})`;
await sql`
  insert into reflections (user_id, level, start, went_well, lesson, grateful, next_focus)
  values (${uid}, ${"week"}, ${mondayOf(addDays(today, -7))}, ${"Sửa được lỗi MQTT"}, ${"Đo trước khi đoán"}, ${"Bạn cùng lab giúp mượn máy đo"},
          ${"Gửi chương 2\nĐo dòng tiêu thụ"})`;

// ---------- ý tưởng ----------
for (const text of ["Thử dùng deep sleep + wake on GPIO cho node cảm biến", "Làm dashboard nhỏ hiển thị pin còn lại"]) {
  await sql`insert into ideas (user_id, text) values (${uid}, ${text})`;
}

// ---------- kiến thức (SPEC.md mục 5.6) ----------
const fieldNames = ["Computer Vision", "Embedded / Edge AI", "AI Agent", "Đồ án"];
const fieldId = {};
for (const [i, name] of fieldNames.entries()) {
  const [f] = await sql`insert into fields (user_id, name, sort) values (${uid}, ${name}, ${i}) returning id`;
  fieldId[name] = f.id;
}
// [tên, lĩnh vực, mức hiểu, ngày học (lệch ngày), tóm tắt, nguồn, liên quan tới (tên)]
const N = (title, field, level, learned, summary = "", source = null, related = []) => ({ title, field, level, learned, summary, source, related });
const noteRows = [
  N("YOLOv8: decoupled head", "Computer Vision", "Hiểu", -1, "Tách nhánh phân loại và nhánh hộp; không dùng anchor nên bớt siêu tham số.", "https://docs.ultralytics.com/models/yolov8/"),
  N("Anchor-free so với anchor-based", "Computer Vision", "Mới học", -2, "Anchor-free dự đoán tâm và kích thước trực tiếp trên từng điểm của feature map.", null, ["YOLOv8: decoupled head"]),
  N("Fine-tune với ít dữ liệu", "Computer Vision", "Mới học", -6, "Đóng băng backbone vài epoch đầu, tăng cường dữ liệu mạnh, theo dõi mAP trên tập val.", null, ["YOLOv8: decoupled head"]),
  N("ESP32 deep sleep và wake on GPIO", "Embedded / Edge AI", "Áp dụng được", -3, "Deep sleep còn khoảng 10 µA; đánh thức bằng ext0 / ext1 hoặc timer. RTC memory giữ được biến qua các lần ngủ."),
  N("MQTT QoS 0 / 1 / 2", "Embedded / Edge AI", "Hiểu", -8, "QoS 1 đủ cho cảm biến: gửi lại tới khi có PUBACK, chấp nhận trùng bản tin.", null, ["ESP32 deep sleep và wake on GPIO"]),
  N("Lượng tử hoá int8 cho mô hình nhỏ", "Embedded / Edge AI", "Mới học", -12, "Post-training quantization cần tập calibration đại diện; kiểm lại độ chính xác sau khi chuyển.", null, ["Fine-tune với ít dữ liệu"]),
  N("Vòng lặp tool-use của agent", "AI Agent", "Hiểu", -4, "Mô hình chọn công cụ, chương trình chạy công cụ, kết quả quay lại làm ngữ cảnh cho lượt sau."),
  N("Đo dòng tiêu thụ bằng điện trở shunt", "Đồ án", "Áp dụng được", -5, "Shunt 1 Ω nối tiếp nguồn, đo sụt áp bằng oscilloscope để thấy cả xung lúc phát Wi-Fi.", null, ["ESP32 deep sleep và wake on GPIO"]),
  N("Cấu trúc chương thiết kế phần cứng", "Đồ án", "Hiểu", -9, "Yêu cầu → sơ đồ khối → chọn linh kiện (kèm lý do) → sơ đồ nguyên lý → mạch in."),
  N("Cách đọc paper nhanh", null, "Áp dụng được", -15, "Đọc abstract, hình và kết luận trước; chỉ đọc phương pháp khi đã biết paper đáng đọc."),
];
const noteId = {};
for (const n of noteRows) {
  const [row] = await sql`
    insert into knowledge (user_id, title, field_id, level, summary, source_url, learned_on, created_at)
    values (${uid}, ${n.title}, ${n.field ? fieldId[n.field] : null}, ${n.level}, ${n.summary}, ${n.source}, ${addDays(today, n.learned)}, ${`${addDays(today, n.learned)}T03:00:00Z`})
    returning id`;
  noteId[n.title] = row.id;
}
for (const n of noteRows) {
  for (const r of n.related) {
    const [a, b] = [noteId[n.title], noteId[r]].sort();
    await sql`insert into knowledge_links (from_id, to_id) values (${a}, ${b}) on conflict do nothing`;
  }
}

console.log(`Đã ghi dữ liệu demo cho ${DEMO_EMAIL}: ${taskRows.length} việc, ${projectNames.length} dự án, ${habitDefs.length} thói quen, ${logs.length} Daily Log, 7 mục tiêu, ${noteRows.length} ghi chú kiến thức.`);
