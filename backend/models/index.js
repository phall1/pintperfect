const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pintperfect.db');

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      profilePicture TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Pubs table
  db.run(`
    CREATE TABLE IF NOT EXISTS pubs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      phoneNumber TEXT,
      website TEXT,
      openingHours TEXT
    )
  `);

  // Ratings table
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      pubId TEXT NOT NULL,
      score REAL NOT NULL,
      comment TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pubId) REFERENCES pubs(id) ON DELETE CASCADE
    )
  `);

  // Photos table
  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      userId TEXT NOT NULL,
      pubId TEXT,
      ratingId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pubId) REFERENCES pubs(id) ON DELETE CASCADE,
      FOREIGN KEY (ratingId) REFERENCES ratings(id) ON DELETE CASCADE
    )
  `);
});

// Model functions

// User model
const User = {
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, profilePicture, createdAt FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },

  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  },

  create: (user) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, username, email, password, profilePicture) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.username, user.email, user.password, user.profilePicture],
        function(err) {
          if (err) reject(err);
          resolve({ id: user.id });
        }
      );
    });
  },

  update: (id, updates) => {
    return new Promise((resolve, reject) => {
      const { username, email, profilePicture } = updates;
      db.run(
        'UPDATE users SET username = ?, email = ?, profilePicture = ? WHERE id = ?',
        [username, email, profilePicture, id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }
};

// Pub model
const Pub = {
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM pubs WHERE id = ?', [id], (err, pub) => {
        if (err) reject(err);
        if (!pub) resolve(null);
        
        // Get average rating
        db.get('SELECT AVG(score) as averageRating FROM ratings WHERE pubId = ?', [id], (err, result) => {
          if (err) reject(err);
          pub.averageRating = result ? result.averageRating : 0;
          resolve(pub);
        });
      });
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM pubs', [], (err, pubs) => {
        if (err) reject(err);
        
        // Separate promise to get ratings
        const promises = pubs.map(pub => {
          return new Promise((resolve, reject) => {
            db.get('SELECT AVG(score) as averageRating FROM ratings WHERE pubId = ?', [pub.id], (err, result) => {
              if (err) reject(err);
              pub.averageRating = result ? result.averageRating : 0;
              resolve(pub);
            });
          });
        });
        
        Promise.all(promises)
          .then(updatedPubs => resolve(updatedPubs))
          .catch(err => reject(err));
      });
    });
  },

  findNearby: (lat, lng, radius) => {
    return new Promise((resolve, reject) => {
      // SQLite doesn't have geospatial functions, so we'll use a basic approximation
      // In a production app, you'd want to use a more sophisticated approach or PostgreSQL with PostGIS
      const latRange = radius / 111; // 1 degree lat is roughly 111km
      const lngRange = radius / (111 * Math.cos(lat * Math.PI / 180));
      
      db.all(
        `SELECT * FROM pubs 
         WHERE latitude BETWEEN ? AND ? 
         AND longitude BETWEEN ? AND ?`,
        [lat - latRange, lat + latRange, lng - lngRange, lng + lngRange],
        (err, pubs) => {
          if (err) reject(err);
          
          // Separate promise to get ratings
          const promises = pubs.map(pub => {
            return new Promise((resolve, reject) => {
              db.get('SELECT AVG(score) as averageRating FROM ratings WHERE pubId = ?', [pub.id], (err, result) => {
                if (err) reject(err);
                pub.averageRating = result ? result.averageRating : 0;
                resolve(pub);
              });
            });
          });
          
          Promise.all(promises)
            .then(updatedPubs => resolve(updatedPubs))
            .catch(err => reject(err));
        }
      );
    });
  },

  create: (pub) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO pubs (id, name, address, latitude, longitude, phoneNumber, website, openingHours) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [pub.id, pub.name, pub.address, pub.latitude, pub.longitude, pub.phoneNumber, pub.website, pub.openingHours],
        function(err) {
          if (err) reject(err);
          resolve({ id: pub.id });
        }
      );
    });
  },

  update: (id, updates) => {
    const { name, address, latitude, longitude, phoneNumber, website, openingHours } = updates;
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE pubs SET name = ?, address = ?, latitude = ?, longitude = ?, 
         phoneNumber = ?, website = ?, openingHours = ? WHERE id = ?`,
        [name, address, latitude, longitude, phoneNumber, website, openingHours, id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }
};

// Rating model
const Rating = {
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM ratings WHERE id = ?', [id], (err, rating) => {
        if (err) reject(err);
        resolve(rating);
      });
    });
  },

  findByPubId: (pubId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM ratings WHERE pubId = ? ORDER BY date DESC', [pubId], (err, ratings) => {
        if (err) reject(err);
        
        // Get user info for each rating
        const promises = ratings.map(rating => {
          return new Promise((resolve, reject) => {
            db.get('SELECT id, username, profilePicture FROM users WHERE id = ?', [rating.userId], (err, user) => {
              if (err) reject(err);
              rating.user = user;
              
              // Get photos for this rating
              db.all('SELECT * FROM photos WHERE ratingId = ?', [rating.id], (err, photos) => {
                if (err) reject(err);
                rating.photos = photos;
                resolve(rating);
              });
            });
          });
        });
        
        Promise.all(promises)
          .then(updatedRatings => resolve(updatedRatings))
          .catch(err => reject(err));
      });
    });
  },

  findByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM ratings WHERE userId = ? ORDER BY date DESC', [userId], (err, ratings) => {
        if (err) reject(err);
        
        // Get pub info for each rating
        const promises = ratings.map(rating => {
          return new Promise((resolve, reject) => {
            db.get('SELECT id, name, address FROM pubs WHERE id = ?', [rating.pubId], (err, pub) => {
              if (err) reject(err);
              rating.pub = pub;
              
              // Get photos for this rating
              db.all('SELECT * FROM photos WHERE ratingId = ?', [rating.id], (err, photos) => {
                if (err) reject(err);
                rating.photos = photos;
                resolve(rating);
              });
            });
          });
        });
        
        Promise.all(promises)
          .then(updatedRatings => resolve(updatedRatings))
          .catch(err => reject(err));
      });
    });
  },

  create: (rating) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO ratings (id, userId, pubId, score, comment) VALUES (?, ?, ?, ?, ?)',
        [rating.id, rating.userId, rating.pubId, rating.score, rating.comment],
        function(err) {
          if (err) reject(err);
          resolve({ id: rating.id });
        }
      );
    });
  },

  update: (id, updates) => {
    return new Promise((resolve, reject) => {
      const { score, comment } = updates;
      db.run(
        'UPDATE ratings SET score = ?, comment = ? WHERE id = ?',
        [score, comment, id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM ratings WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
};

// Photo model
const Photo = {
  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM photos WHERE id = ?', [id], (err, photo) => {
        if (err) reject(err);
        resolve(photo);
      });
    });
  },

  findByRatingId: (ratingId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM photos WHERE ratingId = ?', [ratingId], (err, photos) => {
        if (err) reject(err);
        resolve(photos);
      });
    });
  },

  findByPubId: (pubId) => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM photos WHERE pubId = ?', [pubId], (err, photos) => {
        if (err) reject(err);
        resolve(photos);
      });
    });
  },

  create: (photo) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO photos (id, url, userId, pubId, ratingId) VALUES (?, ?, ?, ?, ?)',
        [photo.id, photo.url, photo.userId, photo.pubId, photo.ratingId],
        function(err) {
          if (err) reject(err);
          resolve({ id: photo.id });
        }
      );
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM photos WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        resolve({ changes: this.changes });
      });
    });
  }
};

module.exports = {
  db,
  User,
  Pub,
  Rating,
  Photo
};