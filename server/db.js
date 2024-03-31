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
          (uuid_generate_v4(), 'user1', 'user1@example.com', 'password_hash_1', '123 Main St', '1234567890'),
          (uuid_generate_v4(), 'user2', 'user2@example.com', 'password_hash_2', '456 Elm St', '0987654321')
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
  

module.exports = {
    connect,
    createTables,
    seedData,
};
