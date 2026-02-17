// Import libraries
const express = require('express');
const path = require('path');
const layouts = require("express-ejs-layouts");

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

// Sign up page
app.get("/signup", (req, res) => {
    res.render("signup", {layout: false});
});

// Dashboard page
app.get("/dashboard", (req, res) => {
    res.render("dashboard")
});

// Tasks page
app.get("/tasks", (req, res) => {
    res.render("tasks")
});

app.listen(PORT, ()=>{
    console.log(`Server running on port: ${PORT}`);
});
