import { startReminderCron } from '@/lib/cronReminders';

if (process.env.NODE_ENV !== 'production') {
  startReminderCron();
}