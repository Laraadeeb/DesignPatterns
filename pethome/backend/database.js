// =============================================
// Singleton Pattern - Database Connection
// =============================================
// بنضمن إن في connection واحد بس للـ database
// طول عمر الـ application

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance; // رجع نفس الـ instance لو موجود
    }

    this.db = new sqlite3.Database(
      path.join(__dirname, 'pethome.db'),
      (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
        } else {
          console.log('✅ Connected to SQLite database');
        }
      }
    );

    this.initTables();
    DatabaseConnection.instance = this; // احفظ الـ instance
  }

  initTables() {
    this.db.serialize(() => {

      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          phone TEXT,
          role TEXT DEFAULT 'adopter',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Pets table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS pets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          breed TEXT,
          gender TEXT,
          image_url TEXT,
          age TEXT,
          health_status TEXT,
          description TEXT,
          location TEXT,
          status TEXT DEFAULT 'available',
          shelter_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (shelter_id) REFERENCES users(id)
        )
      `);

      // Adoption Requests table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS adoption_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pet_id INTEGER NOT NULL,
          adopter_id INTEGER NOT NULL,
          status TEXT DEFAULT 'pending',
          message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pet_id) REFERENCES pets(id),
          FOREIGN KEY (adopter_id) REFERENCES users(id)
        )
      `);

      // Notifications table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      console.log('✅ All tables ready');
    });
  }

  getDB() {
    return this.db;
  }
}

// Export Singleton instance
module.exports = new DatabaseConnection();