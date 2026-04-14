// scripts/run-cron.js
import { exec } from 'child_process';

function checkReminders() {
  exec('curl http://localhost:3000/api/cron/check-reminders', (error, stdout) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log(new Date().toLocaleString(), '-', stdout);
    }
  });
}

// Run every 5 minutes
setInterval(checkReminders, 5 * 60 * 1000);

console.log('Cron job started - checking reminders every 5 minutes');