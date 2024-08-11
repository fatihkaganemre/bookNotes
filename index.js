import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://openlibrary.org";
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "booknotes",
    password: "328445fatih",
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

let users = [];
let currentUserId = 1; 

app.get("/", async (req, res) => {
    try {
        const usersResult = await db.query("SELECT * FROM users");
        users = usersResult.rows;
        const user = users.find((user) => user.id == currentUserId);
        const booksResult = await db.query("SELECT * FROM books WHERE user_id = $1", [currentUserId]);
        const books = booksResult.rows;
        const coverUrls = [];
        for (const book of books) {
            const response = await axios.get(`${API_URL}/search.json?q=${book.title}`);
            const doc = response.data.docs.find((doc) => doc.author_name[0] == book.author);
            const id = doc.edition_key[0];
            console.log(id)
            const url = `https://covers.openlibrary.org/b/olid/${id}-M.jpg`
            coverUrls.push(url);
        }
        res.render("index.ejs", { 
            user: user,
            books: books,
            coverUrls: coverUrls
         });
    } catch (error) {
        console.log(error)
    }
});

app.post("/delete", async (req, res) => {
    try {
        const bookId = req.body.id;
        await db.query("DELETE FROM books WHERE id = $1", [bookId]);
        res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});

app.post("/edit", async (req, res) => {
    try {
        const id = req.body.id; 
        const books = await db.query("SELECT * FROM books WHERE id = $1", [id]);
        const book = books.rows[0];
        res.render("newReview.ejs", { book: book })
    } catch (error) {
        console.log(error)
    }
});

app.post("/new", async (req, res) => {
    res.render("newReview.ejs");
});

app.post("/addReview", async (req, res) => {
    try {
        const book = req.body;
        const date = new Date();
        const dateString = date.toLocaleString();
        await db.query(
            "INSERT INTO books (title, author, review, rate, dateread, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
             [book.title, book.author, book.review, book.rate, dateString, currentUserId]
        );
        res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});

app.post("/editReview", async (req, res) => {
    try {
        const book = req.body;
        const date = new Date();
        const dateString = date.toLocaleString();
        await db.query(
            "UPDATE books SET title = $1, author = $2, review = $3, rate = $4, dateread = $5 WHERE id = $6",
             [book.title, book.author, book.review, book.rate, dateString, book.id]
        );
        res.redirect("/");
    } catch (error) {
        console.log(error);
    }
});

async function getBookCoverURL(title, author) {
    const response = await axios.get(`${API_URL}/search.json?q=${title}`);
    const book = response.data.docs.find((doc) => doc.author_name == author);
    const isbn = book.isbn[0];
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
}