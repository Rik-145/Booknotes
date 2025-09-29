import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
let key = "";
let value = "";
const bookCoverAPI = `https://covers.openlibrary.org/b/${key}/${value}.jpg`;

const db = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "booknotes",
    password: "tapetemundo145",
    port: 5432,
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM book");
    const bookNotesData = result.rows;

    console.log(bookNotesData);

    res.render("index.ejs", {bookNotesData: bookNotesData});
});

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});