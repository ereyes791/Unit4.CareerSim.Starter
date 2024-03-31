const express = require('express');
const bodyParser = require('body-parser');
const { connect, createTables, seedData} = require('./db');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const secretKey = 'your_secret_key'; // Secret key for JWT signing


app.use(bodyParser.json());

// Initialize database connection
connect()
    .then(() => createTables())
    .then(() => seedData())

    
    // Dummy database
    const users = [];
    const products = [];
    const carts = [];
    const orders = [];
    
    // Middleware
    app.use(bodyParser.json());
    
    // Function to generate JWT token
    function generateToken(user) {
      return jwt.sign({ user_id: user.user_id }, secretKey, { expiresIn: '1h' }); // Expires in 1 hour
    }
    
    // Authentication middleware to verify JWT token
    function authenticateToken(req, res, next) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token == null) return res.sendStatus(401); // Unauthorized
    
      jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user; // Attach user information to the request object
        next();
      });
    }
    
    // Routes
    
    // Authentication Routes
    app.post('/api/auth/register', (req, res) => {
      const { username, email, password } = req.body;
      const user = { user_id: uuidv4(), username, email, password };
      users.push(user);
      res.status(201).json({ message: 'User registered successfully' });
    });
    
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      const user = users.find(user => user.email === email && user.password === password);
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });
      const token = generateToken(user);
      res.json({ token });
    });
    
    // User Profile Routes
    app.get('/api/users/:id/profile', authenticateToken, (req, res) => {
      const userId = req.params.id;
      // Only allow the user to access their own profile
      if (userId !== req.user.user_id) return res.sendStatus(403);
      // Fetch user profile from the database and send it as response
    });
    
    app.put('/api/users/:id/profile', authenticateToken, (req, res) => {
      const userId = req.params.id;
      // Only allow the user to update their own profile
      if (userId !== req.user.user_id) return res.sendStatus(403);
      // Update user profile in the database
    });
    
    app.delete('/api/users/:id/profile', authenticateToken, (req, res) => {
      const userId = req.params.id;
      // Only allow the user to delete their own profile
      if (userId !== req.user.user_id) return res.sendStatus(403);
      // Delete user profile from the database
    });
    
    // Product Routes
    app.get('/api/products', (req, res) => {
      // Get all products
    });
    
    app.get('/api/products/:id', (req, res) => {
      // Get product by ID
    });
    
    app.post('/api/products', authenticateToken, (req, res) => {
      // Add a new product
    });
    
    app.put('/api/products/:id', authenticateToken, (req, res) => {
      // Update product by ID
    });
    
    app.delete('/api/products/:id', authenticateToken, (req, res) => {
      // Delete product by ID
    });
    
    // Cart Routes
    app.get('/api/users/:id/cart', authenticateToken, (req, res) => {
      // Get user's cart
    });
    
    app.post('/api/users/:id/cart/:product_id', authenticateToken, (req, res) => {
      // Add product to user's cart
    });
    
    app.put('/api/users/:id/cart/:product_id', authenticateToken, (req, res) => {
      // Update product quantity in user's cart
    });
    
    app.delete('/api/users/:id/cart/:product_id', authenticateToken, (req, res) => {
      // Remove product from user's cart
    });
    
    // Order Routes
    app.post('/api/users/:id/orders', authenticateToken, (req, res) => {
      // Place order
    });
    
    app.get('/api/users/:id/orders', authenticateToken, (req, res) => {
      // Get user's orders
    });
    
    app.get('/api/users/:id/orders/:order_id', authenticateToken, (req, res) => {
      // Get order by ID
    });
    
    // Administrator Routes
    app.get('/api/admin/products', authenticateToken, (req, res) => {
      // Get all products (admin)
    });
    
    app.post('/api/admin/products', authenticateToken, (req, res) => {
      // Add a new product (admin)
    });
    
    app.put('/api/admin/products/:id', authenticateToken, (req, res) => {
      // Update product by ID (admin)
    });
    
    app.delete('/api/admin/products/:id', authenticateToken, (req, res) => {
      // Delete product by ID (admin)
    });
    
    app.get('/api/admin/orders', authenticateToken, (req, res) => {
      // Get all orders (admin)
    });
    
    app.get('/api/admin/orders/:order_id', authenticateToken, (req, res) => {
      // Get order by ID (admin)
    });
    
    app.post('/api/admin/orders/:order_id/ship', authenticateToken, (req, res) => {
      // Ship order (admin)
    });
    
    // Homepage
    app.get('/', (req, res) => {
      res.send('Welcome to the homepage!');
    });
    
    // 404 Not Found
    app.use((req, res) => {
      res.status(404).send('404 Not Found');
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    