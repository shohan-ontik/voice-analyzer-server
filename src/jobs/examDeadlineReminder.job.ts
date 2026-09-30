import cron from 'node-cron';
import { createExamDeadlineNotifications, EXAM_DEADLINE_REMINDER_DAYS } from '../services/notification.service';

// Daily at 09:00 Dhaka time.
const SCHEDULE = '0 9 * * *';
const TIME_ZONE = 'Asia/Dhaka';

async function runOnce() {
  try {
    const created = await createExamDeadlineNotifications();
    console.log(`Exam deadline reminders: created ${created} notification(s) for exams due within ${EXAM_DEADLINE_REMINDER_DAYS} days.`);
  } catch (err) {
    // A failed run must not crash the server; the next run retries.
    console.error('Exam deadline reminder job failed:', err);
  }
}

export function startExamDeadlineReminderJob() {
  cron.schedule(SCHEDULE, runOnce, { timezone: TIME_ZONE, noOverlap: true });
  // Catch up on startup in case the server was down at 09:00. Safe to repeat:
  // notifications are deduplicated.
  void runOnce();
}
