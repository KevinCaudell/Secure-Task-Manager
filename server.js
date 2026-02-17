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
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(PORT, ()=>{
    console.log(`Server running on port: ${PORT}`);
});
