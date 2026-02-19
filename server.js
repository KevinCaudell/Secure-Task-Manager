// Import libraries
const express = require('express');
const session = require('express-session');
const path = require('path');
const layouts = require("express-ejs-layouts");
const db = require("./database/db.js");
const { hashPassword, verifyPassword } = require("./utilities/hashing.js");
const { error } = require('console');

//Initiliaze app
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(layouts);
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "super-secret-key-change-this",
    resave: false,
    saveUninitialized: false
}));


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
        
        req.session.userId = user.ID;

        db.prepare(`
            UPDATE USER SET LAST_LOGIN = CURRENT_TIMESTAMP WHERE ID = ?
            `).run(user.ID);
        return res.redirect('/dashboard');
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
    if (!req.session.userId){
        return res.redirect('/login');
    };

    const tasks = db.prepare(`
        SELECT * 
        FROM TASK 
        WHERE USER_ID = ?
        ORDER BY DUE_DATE ASC
        `).all(req.session.userId);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.STATUS === 'C').length;
    const pendingTasks = tasks.filter(t => t.STATUS === 'P').length;
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t =>
        t.STATUS === 'P' &&
        t.DUE_DATE &&
        t.DUE_DATE < today
    ).length;
    const progressPercent = totalTasks === 0
        ? 0 
        : Math.round((completedTasks / totalTasks) * 100);

    const tasksFormatted = tasks.map(task => ({
        ...tasks,
        dueDateFormatted: task.DUE_DATE ? new Date(task.DUE_DATE).toLocaleDateString() : 'No due date'
    }));

    res.render('dashboard', {
        tasks: tasksFormatted, totalTasks, completedTasks,
        pendingTasks, overdueTasks, progressPercent
    });
});

// Tasks page
app.get("/tasks", (req, res) => {
    if (!req.session.userId){
        return res.redirect('/login');
    };

    const tasks = db.prepare(`
        SELECT * FROM TASK WHERE USER_ID = ?
        `).all(req.session.userId);

    res.render("tasks", { tasks });
});

app.get("/tasks/add", (req, res) => {
    if (!req.session.userId){
        return res.redirect('/login');
    };

    const categories = db.prepare(`
        SELECT *
        FROM CATEGORY
        WHERE USER_ID = ? OR IS_DEFAULT = 1
        `).all(req.session.userId);

    res.render("add-task", { layout: false, categories, error: null });
});

app.post("/tasks/add", (req, res) => {
    if (!req.session.userId){
        return res.redirect('/login');
    };

    const { title, description, dueDate, categoryId, priority } = req.body;

    db.prepare(`
        INSERT INTO TASK (TITLE, DESCRIPTION, DUE_DATE, CATEGORY_ID, PRIORITY, STATUS, USER_ID)
        VALUES(?, ?, ?, ? ,?, 'P', ?)
        `).run(title, description, dueDate || null, categoryId, priority, req.session.userId);

    res.redirect('/dashboard');
});






app.listen(PORT, ()=>{
    console.log(`Server running on port: ${PORT}`);
});
