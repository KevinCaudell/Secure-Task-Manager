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
    res.render("login", {layout: false});
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare(`
        SELECT * FROM USER WHERE EMAIL = ?
        `).get(email);

    if (!user) {
        return res.send('Invalid email or password');
    };

    if (verifyPassword(password, user.SALT, user.PASSWORD_HASH)){
        db.prepare(`
            UPDATE USER SET LAST_LOGIN = CURRENT_TIMESTAMP WHERE ID = ?
            `).run(user.ID);
        res.redirect('/dashboard');
    }else{
        res.send("Invalid email or password");
    };
});

// Sign up page
app.get("/signup", (req, res) => {
    res.render("signup", {layout: false});
});

app.post('/signup', (req, res) => {
const { email, username, password } = req.body;

    const forbiddenChars = /[<>\/\\'"`]/;
    const requiredSpecialChars = /[!#$%&*]/;

    if (email.length > 60) {
        return res.send("Email is too long!");
    };

    if (username.length > 25){
        return res.send('Username is too long!');
    };

    if (password.length < 8){
        return res.send('Password must be atleast 8 characters!');
    };

    if (forbiddenChars.test(password)){
        return res.send('Password contains forbidden characters: < > / \\ \' " `');
    };

    if (!requiredSpecialChars.test(password)){
        return res.send('Password must include at least one special character: ! # $ % & *');
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
            res.send("That email is already in use!");
        }else{
            console.error(err);
            res.send('An unexpected error occurred!');
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
