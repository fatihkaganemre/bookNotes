import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
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

        console.log(books);
        console.log(user);
        res.render("index.ejs", { 
            user: user,
            books: books
         });
    } catch (error) {
        console.log(error)
    }

});