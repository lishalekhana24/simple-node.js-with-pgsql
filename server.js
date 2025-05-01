const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db'); // PostgreSQL connection

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public')); // Serve static files

const PORT = 3000;

// GET: Fetch all people and display in an HTML table
app.get('/person', async (req, res) => {
    const result = await pool.query("SELECT * FROM person");
    let tableRows = result.rows.map(person => `
        <tr>
            <td>${person.id}</td>
            <td>${person.name}</td>
            <td>${person.age}</td>
            <td>${person.gender}</td>
            <td>${person.mobile}</td>
            <td>
                <a href="/edit/${person.id}">Edit</a>
                <a href="/delete/${person.id}">Delete</a>
            </td>
        </tr>
    `).join('');

    res.send(`
        <html>
        <body>
            <h2>Person List</h2>
            <table border="1">
                <tr><th>ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Mobile</th><th>Actions</th></tr>
                ${tableRows}
            </table>
            <br>
            <a href="/add">Add Person</a>
        </body>
        </html>
    `);
});

// POST: Display a form to add a new person
app.get('/add', (req, res) => {
    res.send(`
        <html>
        <body>
            <h2>Add Person</h2>
            <form method="POST" action="/person">
                Name: <input type="text" name="name" required><br>
                Age: <input type="number" name="age" required><br>
                Gender:
                <select name="gender">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select><br>
                Mobile: <input type="text" name="mobile" required><br>
                <input type="submit" value="Submit">
            </form>
        </body>
        </html>
    `);
});

// POST: Insert person into database
app.post('/person', async (req, res) => {
    const { name, age, gender, mobile } = req.body;
    await pool.query("INSERT INTO person (name, age, gender, mobile) VALUES ($1, $2, $3, $4)", 
                     [name, age, gender, mobile]);
    res.redirect('/person');
});

// PUT: Display a form to edit a person
app.get('/edit/:id', async (req, res) => {
    const result = await pool.query("SELECT * FROM person WHERE id=$1", [req.params.id]);
    const person = result.rows[0];

    res.send(`
        <html>
        <body>
            <h2>Edit Person</h2>
            <form method="POST" action="/update/${person.id}">
                Name: <input type="text" name="name" value="${person.name}" required><br>
                Age: <input type="number" name="age" value="${person.age}" required><br>
                Gender:
                <select name="gender">
                    <option value="Male" ${person.gender === "Male" ? "selected" : ""}>Male</option>
                    <option value="Female" ${person.gender === "Female" ? "selected" : ""}>Female</option>
                    <option value="Other" ${person.gender === "Other" ? "selected" : ""}>Other</option>
                </select><br>
                Mobile: <input type="text" name="mobile" value="${person.mobile}" required><br>
                <input type="submit" value="Update">
            </form>
        </body>
        </html>
    `);
});

// PUT: Update person details
app.post('/update/:id', async (req, res) => {
    const { name, age, gender, mobile } = req.body;
    await pool.query("UPDATE person SET name=$1, age=$2, gender=$3, mobile=$4 WHERE id=$5",
                     [name, age, gender, mobile, req.params.id]);
    res.redirect('/person');
});

// DELETE: Show delete confirmation page
app.get('/delete/:id', async (req, res) => {
    res.send(`
        <html>
        <body>
            <h2>Delete Person</h2>
            <p>Are you sure you want to delete this person?</p>
            <form method="POST" action="/remove/${req.params.id}">
                <input type="submit" value="Confirm Delete">
            </form>
            <a href="/person">Cancel</a>
        </body>
        </html>
    `);
});

// DELETE: Remove person from database
app.post('/remove/:id', async (req, res) => {
    await pool.query("DELETE FROM person WHERE id=$1", [req.params.id]);
    res.redirect('/person');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Click to open: http://localhost:${PORT}/person`);
});
