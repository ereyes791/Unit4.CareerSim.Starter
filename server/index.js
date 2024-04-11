const express = require('express');
const bodyParser = require('body-parser');
const { connect, 
  createTables, 
  clearTables, 
  seedData , 
  getUserByEmailAndPassword, 
  createProduct,
  getProducts,
  getProductByName,
  addProductToCart,
  deleteProductById,
  updateProductById,
  getCartItemsByUserId,
  deleteCartItemById,
  updateCartItemById,
  createOrder,
  getOrdersByUserId,
  getOrderById,



} = require('./db');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { continueSession } = require('pg/lib/crypto/sasl');

const app = express();
const PORT = process.env.PORT || 3000;
const secretKey = '2308-ACC-PT-WEB-PT-A'; // Secret key for JWT signing


app.use(bodyParser.json());

// Initialize database connection
connect()
    .then(() => createTables())
    .then(() => clearTables())
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
      return jwt.sign({user}, secretKey, { expiresIn: '1h' }); // Expires in 1 hour
    }
    
    // Authentication middleware to verify JWT token
    function authenticateToken(req, res, next) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token == null) return res.sendStatus(401); // Unauthorized
      console.log(req.headers['authorization'])
      jwt.verify(token, secretKey, (err, user) => {
        console.log("error",err);
        console.log("user",user);
        console.log("jwt",jwt); 
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
      console.log(email, password);
      getUserByEmailAndPassword(email, password).then(user => {
        console.log(user);
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });
        const token = generateToken(user);
        console.log(token);
        res.json({ token });
      });
    });
    
    // User Profile Routes
    app.get('/api/user/profile', authenticateToken, (req, res) => {
      return res.json(req.user);
    });
    
    app.put('/api/user/profile', authenticateToken, (req, res) => {
      const userId = req.params.id;
      // Only allow the user to update their own profile
      if (userId !== req.user.user_id) return res.sendStatus(403);
      // Update user profile in the database
    });
    
    app.delete('/api/user/profile', authenticateToken, (req, res) => {
      const userId = req.params.id;
      // Only allow the user to delete their own profile
      if (userId !== req.user.user_id) return res.sendStatus(403);
      // Delete user profile from the database
    });
    
    // Product Routes
    app.get('/api/products', (req, res) => {
      // Get all products
      getProducts().then(products => {
        res.json(products);
      });
    });
    
    app.get('/api/products/:name', (req, res) => {
      // Get product by ID
      const name = req.params.name;
      getProductByName(name).then(products => {
        res.json(products);
      });
    });
    
    app.post('/api/products', authenticateToken, (req, res) => {
      // Add a new product
      const { name, description, price } = req.body;
      const product = { product_id: uuidv4(), name, description, price };
      createProduct(name, description, price).then(product => {
        res.status(201).json(product);
      });
    });
    
    app.put('/api/products/:id', authenticateToken, (req, res) => {
      // Update product by ID
      const productId = req.params.id;
      const { name, description, price } = req.body;
      updateProductById(productId, name, description, price).then(product => {
        res.json(product);
      });

    });
    
    app.delete('/api/products/:id', authenticateToken, (req, res) => {
      // Delete product by ID
      const productId = req.params.id;
      deleteProductById(productId).
      then(() => {
        res.json({ message: 'Product deleted successfully' });
      });
    });
    
    // Cart Routes
    app.get('/api/user/cart', authenticateToken, (req, res) => {
      // Get user's cart
      const userId = req.user.user_id;
      getCartItemsByUserId(userId).then(cartItems => {
        res.json(cartItems);
      });
    });
    
    app.post('/api/user/cart/:product_id', authenticateToken, (req, res) => {
      // Add product to user's cart
      const userId = req.user.user_id;
      const productId = req.params.product_id;
      addProductToCart(userId, productId).then(cartItem => {
        res.status(201).json(cartItem);
      });
    });
    
    app.put('/api/user/cart/:product_id', authenticateToken, (req, res) => {
      // Update in user's cart
      const productId = req.params.product_id;
      const { quantity } = req.body;
      updateCartItemById(productId, quantity).then(cartItem => {
        res.json(cartItem);
      });
    });
    
    app.delete('/api/user/cart/:product_id', authenticateToken, (req, res) => {
      // Remove product from user's cart
      const productId = req.params.product_id;
      deleteCartItemById(productId).then(() => {
        res.json({ message: 'Product removed from cart' });
      }
      );
    });

    
    // Order Routes
    app.post('/api/user/orders', authenticateToken, (req, res) => {
      // Place order
      const userId = req.user.user_id;
      const { items } = req.body;
      createOrder(userId, items).then(order => {
        res.status(201).json(order);
      });
    });
    
    app.get('/api/user/orders', authenticateToken, (req, res) => {
      // Get user's orders
      const userId = req.user.user_id;
      getOrdersByUserId(userId).then(orders => {
        res.json(orders);
      });
    });
    
    app.get('/api/user/orders/:order_id', authenticateToken, (req, res) => {
      // Get order by ID
      const orderId = req.params.order_id;
      getOrderById(orderId).then(order => {
        res.json(order);
      });
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
    