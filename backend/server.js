const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { User, Pub, Rating, Photo } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pintperfect-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    await User.create({
      id: userId,
      username,
      email,
      password: hashedPassword,
    });
    
    // Generate token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user data (without password) and token
    const user = await User.findById(userId);
    
    res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user data (without password) and token
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    };
    
    res.json({
      success: true,
      user: userData,
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pubs routes
app.get('/api/pubs', async (req, res) => {
  try {
    const pubs = await Pub.findAll();
    res.json({
      success: true,
      data: pubs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/pubs/:id', async (req, res) => {
  try {
    const pub = await Pub.findById(req.params.id);
    if (!pub) {
      return res.status(404).json({ success: false, message: 'Pub not found' });
    }
    
    // Get photos for the pub
    const photos = await Photo.findByPubId(req.params.id);
    pub.photos = photos;
    
    res.json({
      success: true,
      data: pub,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/pubs/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }
    
    const pubs = await Pub.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    
    res.json({
      success: true,
      data: pubs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pubs near a location (for backwards compatibility)
app.get('/api/pubs/near', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }
    
    const pubs = await Pub.findNearby(parseFloat(latitude), parseFloat(longitude), parseFloat(radius));
    
    res.json({
      success: true,
      data: pubs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/pubs', authenticate, async (req, res) => {
  try {
    const { name, address, latitude, longitude, phoneNumber, website, openingHours } = req.body;
    
    const pubId = uuidv4();
    await Pub.create({
      id: pubId,
      name,
      address,
      latitude,
      longitude,
      phoneNumber,
      website,
      openingHours,
    });
    
    const pub = await Pub.findById(pubId);
    
    res.status(201).json({
      success: true,
      data: pub,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ratings routes
app.get('/api/ratings/pub/:pubId', async (req, res) => {
  try {
    const ratings = await Rating.findByPubId(req.params.pubId);
    
    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/ratings/user/:userId', async (req, res) => {
  try {
    const ratings = await Rating.findByUserId(req.params.userId);
    
    res.json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ratings', authenticate, async (req, res) => {
  try {
    const { pubId, score, comment } = req.body;
    
    if (!pubId || !score || score < 1 || score > 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid pub ID and score (1-10) are required',
      });
    }
    
    // Check if pub exists
    const pub = await Pub.findById(pubId);
    if (!pub) {
      return res.status(404).json({ success: false, message: 'Pub not found' });
    }
    
    const ratingId = uuidv4();
    await Rating.create({
      id: ratingId,
      userId: req.user.id,
      pubId,
      score,
      comment,
    });
    
    const rating = await Rating.findById(ratingId);
    
    res.status(201).json({
      success: true,
      data: rating,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/ratings/:id', authenticate, async (req, res) => {
  try {
    const { score, comment } = req.body;
    
    if (score && (score < 1 || score > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Score must be between 1 and 10',
      });
    }
    
    // Check if rating exists and belongs to the user
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    
    if (rating.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own ratings',
      });
    }
    
    await Rating.update(req.params.id, { score, comment });
    
    res.json({
      success: true,
      message: 'Rating updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/ratings/:id', authenticate, async (req, res) => {
  try {
    // Check if rating exists and belongs to the user
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ success: false, message: 'Rating not found' });
    }
    
    if (rating.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own ratings',
      });
    }
    
    await Rating.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Photos routes
app.post('/api/photos', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { pubId, ratingId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }
    
    // Store URL for the uploaded image
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    const photoId = uuidv4();
    await Photo.create({
      id: photoId,
      url,
      userId: req.user.id,
      pubId,
      ratingId,
    });
    
    const photo = await Photo.findById(photoId);
    
    res.status(201).json({
      success: true,
      data: photo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Base64 image upload route (alternative to multer for mobile)
app.post('/api/photos/base64', authenticate, async (req, res) => {
  try {
    const { image, pubId, ratingId } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }
    
    // Extract image data and type
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image data',
      });
    }
    
    const imageType = matches[1];
    const imageData = matches[2];
    const extension = imageType.split('/')[1];
    const filename = `${uuidv4()}.${extension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Save the base64 image
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, imageData, { encoding: 'base64' });
    
    // Store URL for the uploaded image
    const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    
    const photoId = uuidv4();
    await Photo.create({
      id: photoId,
      url,
      userId: req.user.id,
      pubId,
      ratingId,
    });
    
    const photo = await Photo.findById(photoId);
    
    res.status(201).json({
      success: true,
      data: photo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/photos/:id', authenticate, async (req, res) => {
  try {
    // Check if photo exists and belongs to the user
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }
    
    if (photo.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own photos',
      });
    }
    
    // Delete file from uploads directory
    const filename = photo.url.split('/').pop();
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await Photo.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seed data route - for development
app.post('/api/seed', async (req, res) => {
  try {
    // Create sample users
    const password = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        id: uuidv4(),
        username: 'guinness_lover',
        email: 'user1@example.com',
        password,
        profilePicture: null
      },
      {
        id: uuidv4(),
        username: 'pint_connoisseur',
        email: 'user2@example.com',
        password,
        profilePicture: null
      },
      {
        id: uuidv4(),
        username: 'irish_stout',
        email: 'user3@example.com',
        password,
        profilePicture: null
      },
    ];
    
    const userIds = {};
    
    // Create users
    for (const user of users) {
      await User.create(user);
      userIds[user.username] = user.id;
    }
    
    // Create sample pubs
    const pubs = [
      {
        id: uuidv4(),
        name: 'The Guinness Pub',
        address: '123 Dublin St, Dublin',
        latitude: 53.349805,
        longitude: -6.26031,
        phoneNumber: '+353 1 234 5678',
        website: 'https://guinness.com',
        openingHours: 'Mon-Sun: 11am - 11pm',
      },
      {
        id: uuidv4(),
        name: 'Irish Tavern',
        address: '456 Cork Rd, Cork',
        latitude: 51.896892,
        longitude: -8.486316,
        phoneNumber: '+353 2 345 6789',
        website: 'https://irishtavern.com',
        openingHours: 'Mon-Sat: 12pm - 12am, Sun: 12pm - 11pm',
      },
      {
        id: uuidv4(),
        name: 'Emerald Isle Bar',
        address: '789 Galway Ave, Galway',
        latitude: 53.270668,
        longitude: -9.056791,
        phoneNumber: '+353 3 456 7890',
        website: 'https://emeraldisle.com',
        openingHours: 'Daily: 10am - 2am',
      },
      {
        id: uuidv4(),
        name: 'Dublin Porter',
        address: '42 Temple Bar, Dublin',
        latitude: 53.345367,
        longitude: -6.263419,
        phoneNumber: '+353 1 555 1234',
        website: 'https://dublinporter.com',
        openingHours: 'Mon-Sun: 10am - 1am',
      },
      {
        id: uuidv4(),
        name: 'Celtic Brew House',
        address: '78 High Street, Kilkenny',
        latitude: 52.654145,
        longitude: -7.252297,
        phoneNumber: '+353 56 781 2345',
        website: 'https://celticbrewhouse.ie',
        openingHours: 'Mon-Thu: 12pm - 11pm, Fri-Sat: 12pm - 1am, Sun: 12pm - 10pm',
      },
    ];
    
    const pubIds = {};
    
    // Create pubs
    for (const pub of pubs) {
      await Pub.create(pub);
      pubIds[pub.name] = pub.id;
    }
    
    // Create sample ratings
    const ratings = [
      {
        id: uuidv4(),
        userId: userIds['guinness_lover'],
        pubId: pubIds['The Guinness Pub'],
        score: 9.5,
        comment: 'Perfect pint, creamy head and great temperature!',
      },
      {
        id: uuidv4(),
        userId: userIds['pint_connoisseur'],
        pubId: pubIds['The Guinness Pub'],
        score: 8.0,
        comment: 'Good pint but could use a colder glass.',
      },
      {
        id: uuidv4(),
        userId: userIds['irish_stout'],
        pubId: pubIds['The Guinness Pub'],
        score: 10.0,
        comment: 'Best pint in all of Dublin!',
      },
      {
        id: uuidv4(),
        userId: userIds['guinness_lover'],
        pubId: pubIds['Irish Tavern'],
        score: 7.0,
        comment: 'Decent pint but could be colder.',
      },
      {
        id: uuidv4(),
        userId: userIds['pint_connoisseur'],
        pubId: pubIds['Emerald Isle Bar'],
        score: 9.0,
        comment: 'Excellent pour with a perfect head.',
      },
      {
        id: uuidv4(),
        userId: userIds['irish_stout'],
        pubId: pubIds['Dublin Porter'],
        score: 8.5,
        comment: 'Great atmosphere and a well-poured pint!',
      },
      {
        id: uuidv4(),
        userId: userIds['guinness_lover'],
        pubId: pubIds['Celtic Brew House'],
        score: 9.2,
        comment: 'Fantastic creamy head and perfect temperature.',
      },
      {
        id: uuidv4(),
        userId: userIds['pint_connoisseur'],
        pubId: pubIds['Dublin Porter'],
        score: 7.8,
        comment: 'Good pint, but not the best I\'ve had.',
      },
    ];
    
    // Create ratings
    for (const rating of ratings) {
      await Rating.create(rating);
    }
    
    res.json({
      success: true,
      message: 'Seed data created successfully',
      data: {
        userCount: users.length,
        pubCount: pubs.length,
        ratingCount: ratings.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});