import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

//declaration of variables that are used in the file
const app = express();
const port = 3000;
let currentUser = null;

// set up the Client object to be able to connect to the database
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "BlogDB",
    password: "12345",
    port: 5432,
});

// connect to the database and display success
db.connect().then(()=>console.log("Connected")).catch((err)=>console.log(err));

// function to check if a username already exists
async function userNameExists(username) {
    const queryResult = await db.query("SELECT COUNT(*) FROM users WHERE name = $1", [username]);
    //use parseInt to turn the string into an integer
    return parseInt(queryResult.rows[0].count) > 0;
}

// fucntion to check if a user is valid on login
async function checkValidUser(username, password){
    const queryResult = await db.query("SELECT COUNT(*) FROM users WHERE name = $1 AND password = $2", [username, password]);
    //use parseInt to turn the string into an integer
    return parseInt(queryResult.rows[0].count) > 0;
}

//this allows the use of the body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

//this allows the use of the style sheet
app.use(express.static("public"));

//this is what is called when the page is first loaded
    // also called as a redirect after all other routes to ensure it stays on the home page
app.get("/", async (req, res) => {
    // get all the blog posts from a query
    var blogPosts = await db.query('SELECT * FROM blogs');
    // get all of them from the rows array
    blogPosts = blogPosts.rows;
    // render the main page
    res.render("index.ejs", { blogPosts: blogPosts, currentUser: currentUser });
});

// this will log the user out
app.post("/logout", (req, res) => {
    // sets the current user to null to effectively log them out
    currentUser = null;
    // redirects to rerender the home page
    res.redirect('/');
});

// sign in functionality
app.post("/sign_in", async (req, res) => {
    // check if the user is real with username and password
    if( await checkValidUser(req.body["username"], req.body["password"])){
        // set the current user to be the user that logged in with a database query
        currentUser = await db.query("SELECT user_id FROM users WHERE name = $1 AND password = $2", [req.body["username"], req.body["password"]]);
        // set the current user to their unique user id
        currentUser = currentUser.rows[0].user_id;
        // rerender the page
        res.redirect('/');
    }
    else{
        // otherwise rerender the page with an error message
        res.render('sign_in.ejs', { error: 'Invalid username or password. Please try again.' });
    }
});

// sign up functionality
app.post("/sign_up", async (req, res) => {
    // check if the username already exists
    if(await userNameExists(req.body["username"])){
        // set the error value to true
        var error = 1;
        // rerender the sign up page with an error message
        res.render("sign_up.ejs",{error: error})
    }
    // if the user doesnt already exist, submit them into the database
    else{
        await db.query("INSERT INTO users (name, password) VALUES ($1, $2)", [req.body["username"], req.body["password"]]);
        // render the sign in page now so the user can sign in
        res.render("sign_in.ejs");
    }
});

// renders the sign up page
app.post("/sign_up_page", (req, res) => {
    res.render("sign_up.ejs");
});

// render the sign in page
app.post("/sign_in_page", (req, res) => {
    res.render("sign_in.ejs");
});

//this post is to acquire the information the user put into each form section
app.post("/submit", async (req, res) => {
    // acquire the authors name from the database based on their currentUser id
    var authorName= await db.query("SELECT name FROM users WHERE user_id = $1", [currentUser]);
    // set the author name to the actual name
    authorName = authorName.rows[0].name;
    // set the blog title by retrieving it from the form
    var blogTitle= req.body["blogTitle"];
    // set the blog content by retrieving it from the form
    var content= req.body["content"];

    // send a query to the database to create the new blog post
    await db.query('INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES ($1, $2, $3, $4, NOW())', 
        [authorName, currentUser, blogTitle, content]);

    // redirect to rerender the home page
    res.redirect('/');
});

//this is called when the delete button is pressed and removes that post from the post list
app.post("/delete", async (req, res) => {
    //sets the blog post array
    var blogPosts = await db.query('SELECT * FROM blogs');
    //gets the actual posts because they are in the rows list
    blogPosts = blogPosts.rows;
    //gets the index of the blogpost to be deleted
    const listIndex = req.body.index;
    //sends a database query to delete the blog post at that index using its id
    await db.query('DELETE FROM blogs WHERE blog_id = $1', [blogPosts[listIndex].blog_id]);

    res.redirect('/');
});

//this redirects the user to the edit.ejs file to edit a post
app.post("/edit", async (req, res) => {
    //sets the blog posts array
    var blogPosts = await db.query('SELECT * FROM blogs');
    //gets the actual posts because they are in the rows list
    blogPosts = blogPosts.rows;
    //gets the index of the blogpost to be edited
    const listIndex = req.body.index;
    //renders the edit.ejs page and auto fills the data in the form with the existing blog information
    res.render("edit.ejs", {blogPost: blogPosts[listIndex], listIndex: blogPosts[listIndex].blog_id});
    
});

//once an edit is made this is called to update that posts information and re-display the posts
app.post("/update", async (req, res) => {
    //gets the id of the blog back from the edit.ejs page
    const listIndex = req.body.id;
    //sends a database query to update the blogs information with the new edited info
    db.query('UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3', [req.body["blogTitle"], req.body["content"], listIndex]);
    //redirects back to render the home page
    res.redirect('/');    
});

//this is what the udemy videos used to show the server was running so I added it
app.listen(port,() => {
    console.log(`Server running on port ${port}.`);
});