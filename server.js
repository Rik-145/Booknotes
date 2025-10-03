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
app.use(express.static("public"));

async function login() {
    const resultData = await db.query("SELECT * FROM users");
    const loginData = resultData.rows;

    return loginData;
}

app.get("/", async (req, res) => {
    //do i really need to pass info here?
    //isnt it just to render login page and then when button clicked check if every thing matches=
    const loginData = login();
    res.render("login.ejs", {loginData: loginData});
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
})

app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});