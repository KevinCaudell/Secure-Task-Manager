const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "app.db");
const db = new Database(dbPath);

// User Entity
db.prepare(`
CREATE TABLE IF NOT EXISTS USER (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    EMAIL VARCHAR(60) UNIQUE NOT NULL,
    PASSWORD_HASH VARCHAR(255) NOT NULL,
    USERNAME VARCHAR(25) NOT NULL,
    CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LAST_LOGIN DATETIME
)
`).run();

// Category Entity
db.prepare(`
CREATE TABLE IF NOT EXISTS CATEGORY (
    ID CHAR(3) PRIMARY KEY,
    NAME VARCHAR(25) NOT NULL,
    COLOR VARCHAR(15) NOT NULL,
    USER_ID INTEGER,
    IS_DEFAULT BOOLEAN NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID)
)
`).run()

// Tasks Entity
db.prepare(`
CREATE TABLE IF NOT EXISTS TASK (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    TITLE VARCHAR(100) NOT NULL,
    DESCRIPTION TEXT,
    DUE_DATE DATE,
    PRIORITY CHAR(1),
    STATUS CHAR(1) NOT NULL,
    CREATED_AT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT DATETIME,
    USER_ID INT NOT NULL,
    CATEGORY_ID CHAR(3) NOT NULL,
    FOREIGN KEY(USER_ID) REFERENCES USER(ID),
    FOREIGN KEY(CATEGORY_ID) REFERENCES CATEGORY(ID)
)
`).run();

// Default Categories
const defaultCategories = [
    { ID: 'SCH', NAME: 'School', COLOR: '#e02b2b' },
    { ID: 'WRK', NAME: 'Work', COLOR: '#ff9900' },
    { ID: 'PRS', NAME: 'Personal', COLOR: '#3399ff' },
    { ID: 'CHO', NAME: 'Chore', COLOR: '#ff66cc' },
    { ID: 'HLT', NAME: 'Health', COLOR: '#e0dd2b' },
    { ID: 'OTH', NAME: 'Other', COLOR: '#60666b' }
];

const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO CATEGORY (ID, NAME, COLOR, USER_ID, IS_DEFAULT)
    VALUES (@ID, @NAME, @COLOR, NULL, 1)
`);

for (const category of defaultCategories){
    insertCategory.run(category);
};


module.exports = db;
