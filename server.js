  const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');

app.get('/api/bookings', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading database' });
        res.json(JSON.parse(data || '[]'));
    });
});

app.post('/api/bookings', (req, res) => {
    const newBooking = req.body;
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        const bookings = err ? [] : JSON.parse(data || '[]');
        bookings.push(newBooking);
        fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2), (err) => {
            if (err) return res.status(500).json({ error: 'Error saving ticket' });
            res.json({ message: 'Success', booking: newBooking });
        });
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
