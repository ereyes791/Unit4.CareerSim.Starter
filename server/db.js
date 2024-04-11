const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Configure your PostgreSQL connection
const client = new Client({
  user: 'esreyes',
  host: 'localhost',
  database: 'Calliope',
  password: '123456',
  port: 5432, // Default PostgreSQL port
});

async function connect() {
    try {
      await client.connect();
      console.log('Connected to the database');
    } catch (error) {
      console.error('Error connecting to the database', error);
    }
  }
  async function clearTables() {
    try {
      // Delete all rows from tables
      await client.query(`
        DELETE FROM OrderProducts;
        DELETE FROM Orders;
        DELETE FROM CartItems;
        DELETE FROM Carts;
        DELETE FROM Products;
        DELETE FROM Users;
      `);
  
      console.log('All data deleted from tables');
    } catch (error) {
      console.error('Error clearing tables:', error);
    }
  }
  

// Function to create tables if they don't exist
async function createTables() {
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS Users (
        user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        address TEXT,
        phone_number VARCHAR(20)
      );
      
      CREATE TABLE IF NOT EXISTS Products (
        product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Carts (
        cart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS CartItems (
        cart_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id UUID REFERENCES Carts(cart_id) ON DELETE CASCADE,
        product_id UUID REFERENCES Products(product_id) ON DELETE CASCADE,
        quantity INT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Orders (
        order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES Users(user_id) ON DELETE CASCADE,
        total_amount NUMERIC(10, 2) NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS OrderProducts (
        order_product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID REFERENCES Orders(order_id) ON DELETE CASCADE,
        product_id UUID REFERENCES Products(product_id) ON DELETE CASCADE,
        quantity INT NOT NULL
      );
    `);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}
// Function to seed initial data
async function seedData() {
    try {
      // Insert dummy users
      await client.query(`
        INSERT INTO Users (user_id, username, email, password_hash, address, phone_number)
        VALUES
          (uuid_generate_v4(), 'user1', 'user1@example.com', '123456', '123 Main St', '1234567890'),
          (uuid_generate_v4(), 'user2', 'user2@example.com', '123456', '456 Elm St', '0987654321')
      `);
  
      // Insert dummy products
      await client.query(`
        INSERT INTO Products (product_id, name, description, price)
        VALUES
          (uuid_generate_v4(), 'Product 1', 'Description of product 1', 10.99),
          (uuid_generate_v4(), 'Product 2', 'Description of product 2', 20.99)
      `);
  
      // Insert dummy carts
      await client.query(`
        INSERT INTO Carts (cart_id, user_id)
        VALUES
          (uuid_generate_v4(), (SELECT user_id FROM Users WHERE username = 'user1')),
          (uuid_generate_v4(), (SELECT user_id FROM Users WHERE username = 'user2'))
      `);
  
      // Insert dummy cart items
      await client.query(`
        INSERT INTO CartItems (cart_item_id, cart_id, product_id, quantity)
        VALUES
          (uuid_generate_v4(), (SELECT cart_id FROM Carts WHERE user_id = (SELECT user_id FROM Users WHERE username = 'user1')), (SELECT product_id FROM Products WHERE name = 'Product 1'), 2),
          (uuid_generate_v4(), (SELECT cart_id FROM Carts WHERE user_id = (SELECT user_id FROM Users WHERE username = 'user2')), (SELECT product_id FROM Products WHERE name = 'Product 2'), 3)
      `);
  
      console.log('Data seeded successfully');
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  }
  // get user with email and password
async function getUserByEmailAndPassword(email, password) {
    try {
      const result = await client.query(`
        SELECT * FROM Users
        WHERE email = $1 AND password_hash = $2
      `, [email, password]);
  
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user by email and password:', error);
    }
  }
  //create a product
  async function createProduct(name, description, price) {
    try {
      const result = await client.query(`
        INSERT INTO Products (product_id, name, description, price)
        VALUES (uuid_generate_v4(), $1, $2, $3)
        RETURNING *
      `, [name, description, price]);
  
      return result.rows[0];
    } catch (error) {
      console.error('Error creating product:', error);
    }
  }

// get all products
async function getProducts() {
    try {
      const result = await client.query(`
        SELECT * FROM Products
      `);
  
      return result.rows;
    } catch (error) {
      console.error('Error getting products:', error);
    }
  }
  // get product by name with wildcard
async function getProductByName(name) {
    try {
      const result = await client.query(`
        SELECT * FROM Products
        WHERE name ILIKE $1
      `, [`%${name}%`]);
  
      return result.rows;
    } catch (error) {
      console.error('Error getting product by name:', error);
    }
  }
  //get cart by user id
  async function getCartByUserId(userId) {
    try {
      const result = await client.query(`
        SELECT * FROM Carts
        WHERE user_id = $1
      `, [userId]);
  
      return result.rows[0];
    } catch (error) {
      console.error('Error getting cart by user ID:', error);
    }
  }
  //add a product to the cart by user id and product id
  async function addProductToCart(userId, productId, quantity) {
    try {
      const cart = await getCartByUserId(userId);
  
      if (!cart) {
        // Create a new cart if the user doesn't have one
        await client.query(`
          INSERT INTO Carts (cart_id, user_id)
          VALUES (uuid_generate_v4(), $1)
        `, [userId]);
      }
  
      // Add the product to the cart
      await client.query(`
        INSERT INTO CartItems (cart_item_id, cart_id, product_id, quantity)
        VALUES (
          uuid_generate_v4(),
          (SELECT cart_id FROM Carts WHERE user_id = $1),
          $2,
          $3
        )
      `, [userId, productId, quantity]);
  
      console.log('Product added to cart successfully');
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  }
  //get cart items by user id
  async function getCartItemsByUserId(userId) {
    try {
      const result = await client.query(`
        SELECT ci.cart_item_id, ci.quantity, p.*
        FROM CartItems ci
        JOIN Products p ON ci.product_id = p.product_id
        WHERE ci.cart_id = (SELECT cart_id FROM Carts WHERE user_id = $1)
      `, [userId]);
  
      return result.rows;
    } catch (error) {
      console.error('Error getting cart items by user ID:', error);
    }
  }
  // delete product by id
async function deleteProductById(productId) {
    try {
      await client.query(`
        DELETE FROM Products
        WHERE product_id = $1
      `, [productId]);
  
      console.log('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
  // update product by id
async function updateProductById(productId, name, description, price) {
    try {
      const result = await client.query(`
        UPDATE Products
        SET name = $1, description = $2, price = $3
        WHERE product_id = $4
        RETURNING *
      `, [name, description, price, productId]);
  
      return result.rows[0];
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }
  //update cart item by id
  async function updateCartItemById(cartItemId, quantity) {
    try {
      const result = await client.query(`
        UPDATE CartItems
        SET quantity = $1
        WHERE cart_item_id = $2
        RETURNING *
      `, [quantity, cartItemId]);
  
      return result.rows[0];
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  }
  //delete cart item by id
  async function deleteCartItemById(cartItemId) {
    try {
      await client.query(`
        DELETE FROM CartItems
        WHERE cart_item_id = $1
      `, [cartItemId]);
  
      console.log('Cart item deleted successfully');
    } catch (error) {
      console.error('Error deleting cart item:', error);
    }
  }
  //create user orders
  async function createOrder(userId, totalAmount) {
    try {
      const result = await client.query(`
        INSERT INTO Orders (order_id, user_id, total_amount)
        VALUES (uuid_generate_v4(), $1, $2)
        RETURNING *
      `, [userId, totalAmount]);
  
      return result.rows[0];
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

//gel all orders by user id
async function getOrdersByUserId(userId) {
    try {
      const result = await client.query(`
        SELECT * FROM Orders
        WHERE user_id = $1
      `, [userId]);
  
      return result.rows;
    } catch (error) {
      console.error('Error getting orders by user ID:', error);
    }
  }

  //get order by id
async function getOrderById(orderId) {
    try {
      const result = await client.query(`
        SELECT * FROM Orders
        WHERE order_id = $1
      `, [orderId]);
  
      return result.rows[0];
    } catch (error) {
      console.error('Error getting order by ID:', error);
    }
  }
module.exports = {
    connect,
    createTables,
    seedData,
    clearTables,
    getUserByEmailAndPassword,
    createProduct,
    getProducts,
    getProductByName,
    addProductToCart,
    deleteProductById,
    updateProductById,
    getCartItemsByUserId,
    updateCartItemById,
    deleteCartItemById,
    createOrder,
    getOrdersByUserId,
    getOrderById,
    
};
