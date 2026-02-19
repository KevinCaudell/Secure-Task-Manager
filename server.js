// Import libraries
const express = require('express');
const path = require('path');
const layouts = require("express-ejs-layouts");
const db = require("./database/db.js");
const { hashPassword, verifyPassword } = require("./utilities/hashing.js");

//Initiliaze app
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(layouts);
app.use(express.urlencoded({ extended: true }));


// Home Page
app.get("/", (req, res) => {
    res.render("index");
});

// Login Page
app.get("/login", (req, res) => {
    res.render("login", {layout: false, email: '', error: null});
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare(`
        SELECT * FROM USER WHERE EMAIL = ?
        `).get(email);

    if (!user) {
        return res.render("login", {layout: false, error: "Invalid email or password", email});
    };

    if (verifyPassword(password, user.SALT, user.PASSWORD_HASH)){
        db.prepare(`
            UPDATE USER SET LAST_LOGIN = CURRENT_TIMESTAMP WHERE ID = ?
            `).run(user.ID);
        res.redirect('/dashboard');
    }else{
        return res.render("login", {layout: false, error: "Invalid email or password", email});
    };
});

// Sign up page
app.get("/signup", (req, res) => {
    res.render("signup", {layout: false, email: '', username: '', error: null});
});

app.post('/signup', (req, res) => {
const { email, username, password, confirm_password } = req.body;

    const forbiddenChars = /[<>\/\\'"`]/;
    const requiredSpecialChars = /[!#$%&*]/;

    if (email.length > 60) {
        return res.render("signup", {layout: false, error: "Email is too long!", email, username});
    };

    if (username.length > 25){
        return res.render("signup", {layout: false, error: "Username is too long!", email, username});
    };

    if (password.length < 8){
        return res.render("signup", {layout: false, error: "Password must be atleast 8 characters!", email, username});
    };

    if (forbiddenChars.test(password)){
        return res.render("signup", {layout: false, error: 'Password contains forbidden characters: < > / \\ \' " `', email, username});
    };

    if (!requiredSpecialChars.test(password)){
        return res.render("signup", {layout: false, error: "Password must include at least one special character: ! # $ % & *", email, username}); 
    };
    if (password !== confirm_password){
        return res.render("signup", {layout: false, error: "Passwords do not match!", email, username});
    };


    const { salt, hashed } = hashPassword(password);

    try {
        const insertToDB = db.prepare(`
            INSERT INTO USER (EMAIL, USERNAME, PASSWORD_HASH, SALT)
            VALUES(?, ?, ?, ?)    
        `);
        insertToDB.run(email, username, hashed, salt);

        res.redirect("/login");
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE'){
            return res.render("signup", {layout: false, error: "That email is already in use!", email, username});
        }else{
            console.error(err);
            return res.render("signup", {layout: false, error: "An unexpected error occurred!", email, username});
        };
    };
});

// Dashboard page
app.get("/dashboard", (req, res) => {
    const tasks = [
        { title: "Finish report", dueDate: "2026-02-18", completed: false },
        { title: "Submit homework", dueDate: "2026-02-17", completed: false },
        { title: "Buy groceries", dueDate: "2026-02-16", completed: true },
        { title: "Prepare presentation", dueDate: "2026-02-19", completed: false }
    ];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = 1;

    const progressPercent = Math.round((completedTasks / totalTasks) * 100);

    res.render("dashboard", { tasks, totalTasks, completedTasks, pendingTasks, overdueTasks, progressPercent });
});

// Tasks page
app.get("/tasks", (req, res) => {
    res.render("tasks", { tasks });
});

app.post("/tasks/add", (req, res) => {
    res.redirect("/tasks");
});






app.listen(PORT, ()=>{
    console.log(`Server running on port: ${PORT}`);
});
