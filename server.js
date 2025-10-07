import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import result from "pg/lib/query";

const app = express();
const port = 3000;
let userID = 1;
let userName = "";
let bookID = 1;
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

app.use((req, res, next) => {
    res.locals.username = userName || null;
    next();
});

app.get("/", async (req, res) => {
    res.render("pages/login.ejs", {errorMessage: ''});
});

app.post("/login", async (req, res) => {
    try {
        const username = req.body.username.toLowerCase();
        const password = req.body.password.toLowerCase();

        const result = await db.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);

        if (result.rows.length === 0) {
            return res.render("pages/login.ejs", {errorMessage: "Username or password is incorrect"});
        }

        const user = result.rows[0];

        if (user.password.toLowerCase() !== password) {
            return res.render("pages/login.ejs", {errorMessage: "Password is incorrect"});
        }

        const bookResult = await db.query("SELECT * FROM book WHERE userid = $1", [user.id]);
        const bookNotesData = bookResult.rows;

        userID = user.id;
        userName = user.username;
        // console.log(userName);
        // console.log(userID);

        return res.render("index.ejs", {bookNotesData: bookNotesData});
    } catch (err) {
        console.log(err);
        return res.render("pages/login.ejs", {errorMessage: "An error occurred while trying to log in, please try again"});
    }
});

app.get("/add", async (req, res) => {
    res.render("pages/add.ejs", {errorMessage: '', bookData: ''});
});

app.post("/addBook", async (req, res) => {
    try {
        const bookTitle = req.body.title;
        const bookAuthor = req.body.author;
        const bookSynopse = req.body.synopse;
        const bookPages = parseInt(req.body.pages, 10);
        const bookISBN = req.body.isbn;

        if (!bookTitle || !bookAuthor || !bookPages || !bookISBN) {
            return res.render("pages/add.ejs", {
                errorMessage: "All fields are required",
                bookData: req.body
            });
        }

        if (isNaN(bookPages)) {
            return res.render("pages/add.ejs", {
                errorMessage: "Pages must be a number",
                bookData: req.body
            });
        }

        await db.query("INSERT INTO book (title,author,synopse,pages,isbn, userid) VALUES ($1,$2,$3,$4,$5,$6)", [bookTitle, bookAuthor, bookSynopse, bookPages, bookISBN, userID]);

        const result = await db.query("SELECT * FROM book WHERE userid = $1", [userID]);

        return res.render("index.ejs", {bookNotesData: result.rows});
    } catch (err) {
        console.log(err);
        return res.render("pages/add.ejs", {
            errorMessage: "An error occurred while trying to addBook, please try again",
            bookData: req.body
        });
    }
});

app.get("/addBook", async (req, res) => {
    res.render("pages/add.ejs");
})

app.post("/search", async (req, res) => {
    try {
        const bookName = req.body.search;

        const resultData = await db.query("SELECT * FROM book WHERE title ILIKE $1 AND userid = $2", [`%${bookName}%`, userID]);
        const result = resultData.rows;

        res.render("index.ejs", {bookNotesData: result});
    } catch (err) {
        console.log(err);
        return res.render("index.ejs", {
            bookNotesData: [],
            errorMessage: "Error during search",
        });
    }
})

app.get("/create", async (req, res) => {
    res.render("pages/create.ejs");
})

app.post("/createAccount", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const passwords = req.body.passwords;

        if (!username || !passwords) {
            return res.render("pages/create.ejs", {errorMessage: "Username or password is empty"});
        }

        if (password !== passwords) {
            return res.render("pages/create.ejs", {errorMessage: "Password is different"});
        }

        const checkUser = await db.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);

        if (checkUser.rows.length > 0) {
            return res.render("pages/create.ejs", {errorMessage: "Username already exists"});
        }

        await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);

        return res.render("pages/login.ejs", {errorMessage: "Account created successfully"});

    } catch (err) {
        console.log(err);
        return res.render("pages/login.ejs", {errorMessage: "Account created failed, please try again"});
    }
})

app.post("/details", async (req, res) => {
    try {
        const bookid = parseInt(req.body.id, 10);
        bookID = bookid;

        const bookResult = await db.query("SELECT * FROM book WHERE id = $1", [bookID]);
        const notesResult = await db.query("SELECT * FROM mynotes WHERE bookid = $1 AND userid = $2", [bookID, userID]);

        const bookData = bookResult.rows[0];
        const mynotesData = notesResult.rows[0];

        if (mynotesData) {
            res.render("pages/notes.ejs", {bookData, mynotesData});
        } else {
            res.render("pages/details.ejs", {bookData, errorMessage: ""});
        }
    } catch (e) {
        console.log(e);
        res.render("pages/login.ejs", {errorMessage: "Error loading details"});
    }
});


app.post("/updateNotes", async (req, res) => {
    try {
        const { notes, rating, pages, finishedDate } = req.body;

        const existing = await db.query(
            "SELECT * FROM mynotes WHERE bookid = $1 AND userid = $2",
            [bookID, userID]
        );

        if (existing.rows.length > 0) {
            await db.query(
                "UPDATE mynotes SET notes=$1, rating=$2, mypages=$3, finishdate=$4 WHERE bookid=$5 AND userid=$6",
                [notes, rating, pages, finishedDate, bookID, userID]
            );
        } else {
            await db.query(
                "INSERT INTO mynotes (notes, rating, mypages, finishdate, bookid, userid) VALUES ($1,$2,$3,$4,$5,$6)",
                [notes, rating, pages, finishedDate, bookID, userID]
            );
        }

        const bookResult = await db.query("SELECT * FROM book WHERE id = $1", [bookID]);
        const bookData = bookResult.rows[0];

        const notesResult = await db.query("SELECT * FROM mynotes WHERE bookid = $1 AND userid = $2", [bookID, userID]);
        const mynotesData = notesResult.rows[0];

        res.render("pages/notes.ejs", { bookData, mynotesData, username: userName });
    } catch (e) {
        console.log(e);
        res.render("pages/login.ejs", { errorMessage: "Error while updating notes", username: userName });
    }
});


app.get("/updateNotes", async (req, res) => {
    try {
        const bookResult = await db.query("SELECT * FROM book WHERE id = $1", [bookID]);
        const notesResult = await db.query("SELECT * FROM mynotes WHERE bookid = $1 AND userid = $2", [bookID, userID]);

        const bookData = bookResult.rows[0];
        const mynotesData = notesResult.rows[0] || {};

        res.render("pages/update.ejs", { bookData, mynotesData, username: userName, errorMessage: "" });
    } catch (e) {
        console.log(e);
        res.render("pages/login.ejs", { errorMessage: "Error opening update page", username: userName });
    }
});

app.get('/books', async (req, res) => {
    const result = await db.query('SELECT * FROM book WHERE userid = $1', [userID]);
    res.render('index.ejs', { bookNotesData: result.rows });
});

app.post("/deleteNote", async (req, res) => {
    await db.query("DELETE FROM mynotes WHERE userid = $1 AND bookID = $2", [userID, bookID]);

    const result = await db.query('SELECT * FROM book WHERE userid = $1', [userID]);
    res.render('index.ejs', { bookNotesData: result.rows });
})

app.post("/deleteBook", async (req, res) => {
    await db.query("DELETE FROM book WHERE userid = $1 AND id = $2", [userID, bookID]);

    const result = await db.query('SELECT * FROM book WHERE userid = $1', [userID]);
    res.render('index.ejs', { bookNotesData: result.rows });
})

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});