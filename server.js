// Import libraries
const express = require('express');
const path = require('path');
const layouts = require("express-ejs-layouts");
const db = require("./db");


//Initiliaze app
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(layouts);
app.use(express.urlencoded({ extended: true }));

let tasks = [
    { title: "Finish report", dueDate: "2026-02-18", completed: false },
    { title: "Submit homework", dueDate: "2026-02-17", completed: false },
    { title: "Buy groceries", dueDate: "2026-02-16", completed: true }
];


// Home Page
app.get("/", (req, res) => {
    res.render("index");
});

// Login Page
app.get("/login", (req, res) => {
    res.render("login", {layout: false});
});

// Sign up page
app.get("/signup", (req, res) => {
    res.render("signup", {layout: false});
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
    const { title, dueDate } = req.body;

    tasks.push({
        title,
        dueDate,
        completed: false
    });

    res.redirect("/tasks");
});






app.listen(PORT, ()=>{
    console.log(`Server running on port: ${PORT}`);
});
