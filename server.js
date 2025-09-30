import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;
let value = "";
const bookCoverAPI = `https://covers.openlibrary.org/b/isbn/${value}-M.jpg`;

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
    const bookNotesData = [];

    for (const book of result.rows) {
        let coverURL = '/images/bookPlaceholder.jpeg';

        try {
            // const resultAPI = await axios.get(`https://covers.openlibrary.org/b/ISBN/${book.isbn}-M.jpg?default=false`);
            //
            // if (resultAPI) {
            //     coverURL = `https://covers.openlibrary.org/b/ISBN/${resultAPI}`;
            // }
        } catch (error) {
            console.error(error);
            console.log(`Error fetching book cover: using Placeholder.`);
        }

        bookNotesData.push({
            ...book,
            coverURL
        });
    }


    res.render("index.ejs", {bookNotesData: bookNotesData});
});

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});