import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

//declaration of variables that are used in the file
const app = express();
const port = 3000;
let currentUser = null;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "BlogDB",
    password: "12345",
    port: 5432,
});

db.connect().then(()=>console.log("Connected")).catch((err)=>console.log(err));

//const result = await db.query("SELECT * FROM users");

async function userNameExists(username) {
    const queryResult = await db.query("SELECT COUNT(*) FROM users WHERE name = $1", [username]);
    return parseInt(queryResult.rows[0].count) > 0;
}

async function checkValidUser(username, password){
    const queryResult = await db.query("SELECT COUNT(*) FROM users WHERE name = $1 AND password = $2", [username, password]);
    return parseInt(queryResult.rows[0].count) > 0;
}

//this allows the use of the body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

//this allows the use of the style sheet
app.use(express.static("public"));

//this is what is called when the page is first loaded
    // also called as a redirect after all other routes to ensure it stays on the home page
app.get("/", async (req, res) => {
    var blogPosts = await db.query('SELECT * FROM blogs');
    blogPosts = blogPosts.rows;
    res.render("index.ejs", { blogPosts: blogPosts, currentUser: currentUser });
});

app.post("/logout", (req, res) => {
    currentUser = null;
    res.redirect('/');
});

app.post("/sign_in", async (req, res) => {
    if( await checkValidUser(req.body["username"], req.body["password"])){
        currentUser = await db.query("SELECT user_id FROM users WHERE name = $1 AND password = $2", [req.body["username"], req.body["password"]]);
        currentUser = currentUser.rows[0].user_id;
        res.redirect('/');
    }
    else{
        res.render('sign_in.ejs', { error: 'Invalid username or password. Please try again.' });
    }
});

app.post("/sign_up", async (req, res) => {
    if(await userNameExists(req.body["username"])){
        var error = 1;
        res.render("sign_up.ejs",{error: error})
    }
    else{
        await db.query("INSERT INTO users (name, password) VALUES ($1, $2)", [req.body["username"], req.body["password"]]);

        res.render("sign_in.ejs");
    }
});

app.post("/sign_up_page", (req, res) => {
    res.render("sign_up.ejs");
});

app.post("/sign_in_page", (req, res) => {
    res.render("sign_in.ejs");
});

//this post is to acquire the information the user put into each form section
app.post("/submit", async (req, res) => {
    var authorName= await db.query("SELECT name FROM users WHERE user_id = $1", [currentUser]);
    authorName = authorName.rows[0].name;
    var blogTitle= req.body["blogTitle"];
    var content= req.body["content"];

    await db.query('INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES ($1, $2, $3, $4, NOW())', 
        [authorName, currentUser, blogTitle, content]);

    res.redirect('/');
});

//this is called when the delete button is pressed and removes that post from the post list
app.post("/delete", async (req, res) => {
    var blogPosts = await db.query('SELECT * FROM blogs');
    blogPosts = blogPosts.rows;
    const listIndex = req.body.index;
    await db.query('DELETE FROM blogs WHERE blog_id = $1', [blogPosts[listIndex].blog_id]);

    res.redirect('/');
});

//this redirects the user to the edit.ejs file to edit a post
app.post("/edit", async (req, res) => {
    var blogPosts = await db.query('SELECT * FROM blogs');
    blogPosts = blogPosts.rows;
    const listIndex = req.body.index;
    res.render("edit.ejs", {blogPost: blogPosts[listIndex], listIndex: blogPosts[listIndex].blog_id});
    
});

//once an edit is made this is called to update that posts information and re-display the posts
app.post("/update", async (req, res) => {
    const listIndex = req.body.id;

    db.query('UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3', [req.body["blogTitle"], req.body["content"], listIndex]);

    res.redirect('/');    
});

//this is what the udemy videos used to show the server was running so I added it
app.listen(port,() => {
    console.log(`Server running on port ${port}.`);
});