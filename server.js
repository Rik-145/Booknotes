import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import result from "pg/lib/query";

const app = express();
const port = 3000;
let value = "";
// const bookCoverAPI = `https://covers.openlibrary.org/b/isbn/${value}-M.jpg`;

const db = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "booknotes",
    password: "tapetemundo145",
    port: 5432,
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", async (req, res) => {
    res.render("login.ejs");
});

app.post("/login", async (req, res) => {
    try {
        const username = req.body.username.toLowerCase();
        const password = req.body.password.toLowerCase();

        const resultData = await db.query("SELECT * FROM users");

        for (const user of resultData.rows) {
            if (user.username.toLowerCase() === username && user.password.toLowerCase() === password) {
                const result = await db.query("SELECT * FROM book WHERE userid = $1", [user.id]);
                const bookNotesData = result.rows;

                res.render("index.ejs", {bookNotesData: bookNotesData});
            } else {
                res.render("login.ejs", {errorMessage: "Username or password is incorrect"});
            }
        }

    } catch (err) {
        console.log(err);
    }
});

app.post("/add", async (req, res) => {
    res.render("add.ejs");
})

app.post("/search", async (req, res) => {
    const bookName = req.body.search.toLowerCase();

    const resultData = await db.query("SELECT * FROM book WHERE title ILIKE $1", [`%${bookName}%`]);
    const result = resultData.rows;

    res.render("index.ejs", {bookNotesData: result});
})

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});