const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/footballsuppliesnepal')
  .then(async () => {
    console.log('MongoDB Connected');
    // Create default admin user
    const createDefaultAdmin = require('./config/defaultAdmin');
    await createDefaultAdmin();
  })
  .catch(err => console.log('MongoDB Connection Error:', err));

const fs = require('fs');
const https = require('https');
const path = require('path');

const PORT = 5000;

// HTTPS options
const options = {
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS Server running on port ${PORT}`);
});
