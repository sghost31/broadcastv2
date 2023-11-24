const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Add nodemailer module
require('dotenv').config(); // Load environment variables from .env file


const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// MySQL database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'broadcasting',
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Declare transporter at the top of the file
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tomicokz@gmail.com', // Update with your email
    pass: 'dcazvpmklwunbjtm ', // Update with your email password
  },
});

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, confirmPassword, phone } = req.body;

    // Basic server-side validation
    if (!username || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({ error: 'Please fill in all fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Check if the email already exists
    const checkEmailQuery = 'SELECT * FROM user WHERE email = ?';
    const [existingUser] = await connection.promise().query(checkEmailQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedc_Password = await bcrypt.hash(confirmPassword, 10);

    // Generate a DATETIME ID
    const datetimeId = moment().format('YYYY-MM-DD HH:mm:ss');

    // Insert a new user into the broadcasting table
    const insertUserQuery = 'INSERT INTO user (id, username, email, password, c_password, phone) VALUES (?, ?, ?, ?, ?, ?)';
    await connection.promise().query(insertUserQuery, [datetimeId, username, email, hashedPassword, hashedc_Password, phone]);

    // Generate a random verification code (you can use a more secure method)
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Store the verification code in the database
    const insertVerificationCodeQuery = 'INSERT INTO verification (email, code, created_at) VALUES (?, ?, ?)';
    await connection.promise().query(insertVerificationCodeQuery, [email, verificationCode, new Date()]);

    // Send verification email
    const mailOptions = {
      from: 'tomicokz@gmail.com', // Update with your email
      to: email,
      subject: 'Verification Code',
      text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Create a JWT token using the secret key
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const token = jwt.sign({ username, id: datetimeId }, secretKey);

    // Respond with the token
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Verification route
app.post('/verify', async (req, res) => {
  try {
    const { verificationCode } = req.body;

    if (!verificationCode) {
      return res.status(400).json({ error: 'Please provide the verification code.' });
    }

    // Check if the verification code is valid
    const checkVerificationCodeQuery = 'SELECT * FROM verification WHERE code = ?';
    const [matchingCode] = await connection.promise().query(checkVerificationCodeQuery, [verificationCode]);

    if (matchingCode.length === 0) {
      return res.status(401).json({ error: 'Invalid verification code.' });
    }

    // Check if the verification code is submitted within 3 minutes
    const createdAt = moment(matchingCode[0].created_at);
    const currentTime = moment();
    const minutesDiff = currentTime.diff(createdAt, 'minutes');

    if (minutesDiff > 3) {
      // Delete the user and verification code
      const deleteQuery = 'DELETE FROM user WHERE email = ?';
      await connection.promise().query(deleteQuery, [matchingCode[0].email]);

      // Delete the verification code
      const deleteVerificationCodeQuery = 'DELETE FROM verification WHERE code = ?';
      await connection.promise().query(deleteVerificationCodeQuery, [verificationCode]);

      return res.status(401).json({ error: 'Verification code expired. Please sign up again.' });
    }

    // Delete the verification code after successful verification
    const deleteVerificationCodeQuery = 'DELETE FROM verification WHERE code = ?';
    await connection.promise().query(deleteVerificationCodeQuery, [verificationCode]);

    res.json({ message: 'Verification successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic server-side validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // Check if the email exists
    const checkEmailQuery = 'SELECT * FROM user WHERE email = ?';
    const [existingUser] = await connection.promise().query(checkEmailQuery, [email]);

    if (existingUser.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, existingUser[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Create a JWT token using the secret key
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const token = jwt.sign({ username: existingUser[0].username, id: existingUser[0].id }, secretKey);

    // Respond with the token
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
