const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files from the public folder and parse incoming JSON data
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');

// Route to handle new ticket bookings
app.post('/book', (req, res) => {
    const { movie, seats, name, email } = req.body;

    // Validate inputs basic check
    if (!movie || !seats || !name || !email) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    // Generate a clean ticket receipt object
    const newBooking = {
        id: "TKT-" + Math.floor(100000 + Math.random() * 900000), 
        movie,
        seats,
        name,
        email,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    // Read existing database file
    let bookings = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            bookings = data ? JSON.parse(data) : [];
        } catch (err) {
            console.error("Error reading JSON database:", err);
        }
    }

    // Append new ticket and save to the local file system
    bookings.push(newBooking);
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2));
    } catch (err) {
        console.error("Error writing to JSON database:", err);
        return res.status(500).json({ success: false, message: "Database save error." });
    }

    // Send back the complete success response containing the digital ticket receipt
    res.status(200).json({
        success: true,
        message: "Booking Confirmed Successfully!",
        receipt: newBooking
    });
});

app.listen(PORT, () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});