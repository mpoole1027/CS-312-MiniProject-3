import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

//declaration of variables that are used in the file
const app = express();
const port = 3000;
const blogPosts = [];

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "BlogDB",
    password: "12345",
    port: 5432,
});

db.connect().then(()=>console.log("Connected")).catch((err)=>console.log(err));

const result = await db.query("SELECT * FROM users");

console.log(result);


//this allows the use of the body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

//this allows the use of the style sheet
app.use(express.static("public"));

//this is what is called when the page is first loaded
    // also called as a redirect after all other routes to ensure it stays on the home page
app.get("/", (req, res) => {
    res.render("index.ejs", { blogPosts: blogPosts });
});

//this post is to acquire the information the user put into each form section
app.post("/submit", (req, res) => {
    var authorName= req.body["authorName"];
    var blogTitle= req.body["blogTitle"];
    var content= req.body["content"];
    var creationTime = Date();

    // after getting the information it creates a new post object with the info
    const newPost = {
        authorName: authorName,
        blogTitle: blogTitle,
        content: content,
        creationTime: creationTime
    };

    //adds the post to the post list and redirects back to home
    blogPosts.push(newPost);

    res.redirect('/');
});

//this is called when the delete button is pressed and removes that post from the post list
app.post("/delete", (req, res) => {
    const listIndex = req.body.index;
    blogPosts.splice(listIndex, 1);

    res.redirect('/');
});

//this redirects the user to the edit.ejs file to edit a post
app.post("/edit", (req, res) => {
    const listIndex = req.body.index;
    res.render("edit.ejs", {blogPost: blogPosts[listIndex], listIndex: listIndex});
    
});

//once an edit is made this is called to update that posts information and re-display the posts
app.post("/update", (req, res) => {
    const listIndex = req.body.id;
    blogPosts[listIndex].authorName = req.body["authorName"];
    blogPosts[listIndex].blogTitle = req.body["blogTitle"];
    blogPosts[listIndex].content = req.body["content"];
    res.redirect('/');    
});

//this is what the udemy videos used to show the server was running so I added it
app.listen(port,() => {
    console.log(`Server running on port ${port}.`);
});