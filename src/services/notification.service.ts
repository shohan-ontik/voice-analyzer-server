import { Op, type Transaction } from 'sequelize';
import { Exam, Notification, TrainingModule, UserNotificationRead } from '../models';
import { ApiError } from '../utils/ApiError';
import { bengaliTitle } from '../utils/bengaliTitle';

// Every user sees the same notification feed; only `isRead`/`readAt` are
// per-user, looked up from UserNotificationRead (no row = unread).
export async function listNotificationsForUser(userId: string, params: { page: number; pageSize: number }) {
  // `id` breaks ties between notifications created in the same instant
  // (e.g. seeded in one batch) so pages never overlap or skip rows.
  const { rows, count } = await Notification.findAndCountAll({
    include: [{ model: TrainingModule, as: 'module', attributes: ['slug'] }],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  });

  const reads = rows.length
    ? await UserNotificationRead.findAll({
        where: { userId, notificationId: rows.map((n) => n.id) },
        attributes: ['notificationId', 'readAt'],
      })
    : [];
  const readAtByNotificationId = new Map(reads.map((r) => [r.notificationId, r.readAt]));

  const items = rows.map((n) => {
    const readAt = readAtByNotificationId.get(n.id) ?? null;
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      moduleId: n.moduleId,
      moduleSlug: n.module?.slug ?? null,
      examId: n.examId,
      isRead: readAt !== null,
      readAt,
      createdAt: n.createdAt,
    };
  });

  // Unread across the whole feed, not just this page. Read rows can only
  // point at existing notifications (FK), so unread = total - read.
  const readCount = await UserNotificationRead.count({ where: { userId } });
  const unreadCount = Math.max(count - readCount, 0);

  const totalPages = Math.ceil(count / params.pageSize);

  return {
    items,
    unreadCount,
    page: params.page,
    total: count,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

// Idempotent — marking an already-read notification keeps its original
// `readAt`. Notifications are shared, so this only ever writes the caller's
// own UserNotificationRead row.
export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await Notification.findByPk(notificationId, { attributes: ['id'] });
  if (!notification) {
    throw ApiError.notFound('Notification not found.');
  }

  const [read] = await UserNotificationRead.findOrCreate({
    where: { userId, notificationId },
    defaults: { userId, notificationId, readAt: new Date() },
  });

  return { id: notificationId, isRead: true, readAt: read.readAt };
}

// Reminders go out for exams due within this many days.
export const EXAM_DEADLINE_REMINDER_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_DATE_TIME_ZONE = 'Asia/Dhaka';

// Creates one shared "exam deadline approaching" notification per exam whose
// `dueDate` falls within the next EXAM_DEADLINE_REMINDER_DAYS days. A window
// (rather than exactly "2 days out") means a missed daily run or an exam
// created late still gets its reminder. Idempotent: dedupeKey includes the
// dueDate, so re-runs never duplicate, but a rescheduled exam notifies again.
// Only exams of active modules are considered, since trainees can't open the
// others. Returns how many notifications were created.
export async function createExamDeadlineNotifications(now = new Date()) {
  const windowEnd = new Date(now.getTime() + EXAM_DEADLINE_REMINDER_DAYS * DAY_MS);

  const exams = await Exam.findAll({
    where: { dueDate: { [Op.gt]: now, [Op.lte]: windowEnd } },
    include: [{ model: TrainingModule, as: 'module', where: { isActive: true }, attributes: ['title'] }],
  });
  if (exams.length === 0) return 0;

  const dateFormat = new Intl.DateTimeFormat('bn-BD', { dateStyle: 'long', timeZone: DUE_DATE_TIME_ZONE });
  const rows = exams.map((exam) => ({
    type: 'exam_deadline' as const,
    title: 'পরীক্ষার সময়সীমা ঘনিয়ে আসছে',
    body: `"${bengaliTitle(exam.module!.title)}" মডিউলের পরীক্ষার সময়সীমা ${dateFormat.format(exam.dueDate!)} তারিখে শেষ হচ্ছে। সময়মতো পরীক্ষা সম্পন্ন করুন।`,
    moduleId: exam.moduleId,
    examId: exam.id,
    dedupeKey: `exam_deadline:${exam.id}:${exam.dueDate!.toISOString()}:${EXAM_DEADLINE_REMINDER_DAYS}`,
  }));

  const existing = await Notification.findAll({
    where: { dedupeKey: rows.map((r) => r.dedupeKey) },
    attributes: ['dedupeKey'],
  });
  const existingKeys = new Set(existing.map((n) => n.dedupeKey));
  const newRows = rows.filter((r) => !existingKeys.has(r.dedupeKey));
  if (newRows.length === 0) return 0;

  // ignoreDuplicates covers a concurrent run (e.g. two app instances)
  // inserting the same key between the lookup above and this insert.
  await Notification.bulkCreate(newRows, { ignoreDuplicates: true });
  return newRows.length;
}

// Announces a module to every trainee. Keyed on the module alone, so only the
// first publish ever notifies — un-publishing and re-publishing later does
// not send it again. Pass the caller's transaction so the notification
// commits (or rolls back) together with the publish itself.
export async function createModulePublishedNotification(
  trainingModule: { id: string; title: string },
  transaction?: Transaction
) {
  const [notification, created] = await Notification.findOrCreate({
    where: { dedupeKey: `module_published:${trainingModule.id}` },
    defaults: {
      type: 'module_published',
      title: 'নতুন মডিউল প্রকাশিত হয়েছে',
      body: `"${bengaliTitle(trainingModule.title)}" মডিউলটি প্রকাশিত হয়েছে। এখনই শেখা শুরু করুন।`,
      moduleId: trainingModule.id,
      examId: null,
      dedupeKey: `module_published:${trainingModule.id}`,
    },
    transaction,
  });
  return { notification, created };
}
