// =============================================
// Observer Pattern - Notification System
// =============================================
// لما حاجة تحصل (request اتبعت، اتقبل، اترفض)
// الـ Observer بيبعت notification للناس المعنيين
// من غير ما الـ request logic تعرف حاجة عن الـ notifications

class NotificationService {
  constructor() {
    this.observers = []; // list of observers
    this.db = require('./database').getDB();
  }

  // اضف observer جديد
  subscribe(observer) {
    this.observers.push(observer);
  }

  // ابعت event لكل الـ observers
  notify(event, data) {
    this.observers.forEach(observer => observer.update(event, data));
  }

  // احفظ الـ notification في الـ database
  save(userId, message) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
        [userId, message],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // جيب كل الـ notifications بتاعت user معين
  getForUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // اعمل الـ notification مقروءة
  markAsRead(notificationId, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [notificationId, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

// =============================================
// AdoptionObserver - بيراقب الـ adoption events
// =============================================
class AdoptionObserver {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  async update(event, data) {
    switch (event) {

      case 'REQUEST_SUBMITTED':
        // ابعت notification للـ shelter
        await this.notificationService.save(
          data.shelter_id,
          `🐾 New adoption request for "${data.pet_name}" from ${data.adopter_name}`
        );
        break;

      case 'REQUEST_APPROVED':
        // ابعت notification للـ adopter
        await this.notificationService.save(
          data.adopter_id,
          `✅ Your adoption request for "${data.pet_name}" has been approved! Contact the shelter to proceed.`
        );
        break;

      case 'REQUEST_REJECTED':
        // ابعت notification للـ adopter
        await this.notificationService.save(
          data.adopter_id,
          `❌ Your adoption request for "${data.pet_name}" was not approved this time. Keep looking!`
        );
        break;
    }
  }
}

// Singleton للـ NotificationService
const notificationService = new NotificationService();
const adoptionObserver = new AdoptionObserver(notificationService);

// سجل الـ observer
notificationService.subscribe(adoptionObserver);

module.exports = { notificationService };