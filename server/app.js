/**
 * Server application - contains all server config and api endpoints
 *
 * @author Pim Meijer
 */
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const db = require("./utils/databaseHelper");
const cryptoHelper = require("./utils/cryptoHelper");
const corsConfig = require("./utils/corsConfigHelper");
const app = express();
const fileUpload = require("express-fileupload");
const fs = require("fs");
app.use(bodyParser.json({limit: '10000mb', extended: true}))
//logger lib  - 'short' is basic logging info
app.use(morgan("short"));

//init mysql connectionpool
const connectionPool = db.init();

//parsing request bodies from json to javascript objects
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//CORS config - Cross Origin Requests
app.use(corsConfig);
//File uploads
app.use(fileUpload());

// ------ ROUTES - add all api endpoints here ------
const httpOkCode = 200;
const badRequestCode = 400;
const authorizationErrCode = 401;

app.post("/user/login", (req, res) => {
    const username = req.body.username;

    //TODO: We shouldn't save a password unencrypted!! Improve this by using cryptoHelper :)
    const password = req.body.password;

    db.handleQuery(connectionPool, {
        query: "SELECT `username`, `password`, `id`, `role` FROM user WHERE username = ? AND password = ?",
        values: [username, password]
    }, (data) => {
        if (data.length === 1) {
            //return just the username for now, never send password back!
            res.status(httpOkCode).json({"username": data[0].username, "role": data[0].role, "userID": data[0].id});
        } else {
            //wrong username
            res.status(authorizationErrCode).json({reason: "Wrong username or password"});
        }

    }, (err) => res.status(badRequestCode).json({reason: err}));
});
//retrieve rehabilitator info
app.post("/user/rehabilitator", (req, res) => {
    db.handleQuery(connectionPool, {
        // query: "SELECT `first_name`,`last_name`,`Birthdate`,`Description`,`Adress`,`Postalcode`, `Bloodtype`, `Gender`, `foto` from `rehabilitator` WHERE user_ID = ?",
        query: "SELECT `r`.* , `u`.`photo` from `rehabilitator` `r` INNER JOIN `user` `u` on `u`.`id` = `r`.`user_id` WHERE `u`.`id` = ?",
        values: [req.body.id]
    }, (data) => {
        console.log(data)
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});
//retrieve caretaker info
app.post("/user/caretaker", (req, res) => {
    console.log(req.body.id)
    db.handleQuery(connectionPool, {
        query: "SELECT caretaker.caretaker_id, caretaker.first_name, caretaker.last_name, caretaker.email, caretaker.phone, caretaker.description, caretaker.experience_field1, caretaker.experience_field2, caretaker.experience_field3 FROM caretaker INNER JOIN rehabilitator ON rehabilitator.caretaker_id = caretaker.caretaker_id WHERE rehabilitator.user_id = ?",
        values: [req.body.id]
    }, (data) => {
        console.log(data)
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});

//retrieve messages
app.post("/messages", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT message.content, message.date, rehabilitator.first_name, rehabilitator.birthdate FROM message INNER JOIN rehabilitator ON message.rehabilitator_id = rehabilitator.id",
        values: [req.body.id]
    }, (data) => {
        console.log(data)
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});

//retrieve my messages
app.post("/messages/me", (req, res) => {
    console.log(req.body)
    db.handleQuery(connectionPool, {
        query: "SELECT message.content, message.message_id, message.date FROM message INNER JOIN rehabilitator ON message.rehabilitator_id = rehabilitator.id where rehabilitator_id = ?",
        values: [req.body.userID]
    }, (data) => {
        console.log(data)
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});
//delete message
app.post("/messages/delete", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "DELETE FROM message WHERE message_id = ?;",
        values: [req.body.messageID]
    }, (data) => {
        console.log(data)
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});

//insert messages
app.post("/messages/insert", (req, res) => {
    console.log("body = " , req.body)
    db.handleQuery(connectionPool, {
        query: "INSERT INTO message(caretaker_id, rehabilitator_id, content, date) VALUES (?, ?, ?, ?);",
        values: [req.body.caretakerID, req.body.userID, req.body.message, req.body.date]
    }, (data) => {
        console.log(data)
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});

app.post("/pam", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT `id` from `rehabilitator` WHERE user_id = ?",
        values: [req.body.id]
    }, (data) => {
        db.handleQuery(connectionPool, {
            query: "SELECT `quarterly_score` from `pam_score` WHERE rehabilitator_id = ?",
            values: [data[0]['id']]
        }, (datapam) => {
            res.send(datapam)
        }, (err) => res.status(badRequestCode).json({reason: err}));

    }, (err) => res.status(badRequestCode).json({reason: err}));

});

app.post("/rehabilitator/activities", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT * from `pam_activity` WHERE ? BETWEEN daily_pam_min AND daily_pam_max ORDER BY id ASC ",
        values: [req.body.daily]
    }, (activityData) => {
        res.send(activityData)
    }, (err) => res.status(badRequestCode).json({reason: err}));
});

app.post("/rehabilitator/goal/total", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT `pam_goal_total` from `rehabilitator` WHERE user_id = ?",
        values: [req.body.id]
    }, (data) => {
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});
app.post("/rehabilitator/goal/date", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT `appointment_date` from `rehabilitator` WHERE user_id = ?",
        values: [req.body.id]
    }, (data) => {
        res.send(data)

    }, (err) => res.status(badRequestCode).json({reason: err}));
});

// Get data from user
app.post("/user/data", (req, res) => {
    db.handleQuery(connectionPool, {
        query: "SELECT `p`.`pam_score`, `p`.`date` FROM `pam_score` as `p` INNER JOIN `rehabilitator` as `r` on `r`.`id` = `p`.`rehabilitator_id` WHERE `r`.`user_id` = ?",
        values: [req.body.id]
    }, (data) => {
        console.log(data);
        res.send(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))
});

//dummy data example - rooms
app.post("/room_example", (req, res) => {

    db.handleQuery(connectionPool, {
            query: "SELECT id, surface FROM room_example WHERE id = ?",
            values: [req.body.id]
        }, (data) => {
            //just give all data back as json
            res.status(httpOkCode).json(data);
        }, (err) => res.status(badRequestCode).json({reason: err})
    );

});

app.get("/caretaker/all", (req, res) => {
    const maxPerPagination = req.query.amountPerPage;
    const currentPaginationOffset = (req.query.paginationPosition - 1) * maxPerPagination;

    db.handleQuery(connectionPool, {
        query: "SELECT `r`.* FROM `rehabilitator` as `r` INNER JOIN `caretaker` as `c` on `r`.`caretaker_id` = `c`.`caretaker_id` INNER JOIN `user` as `u` on `u`.`id` = `c`.`user_id` WHERE `u`.`id` = ? LIMIT ? OFFSET ?",
        values: [req.query.userID, parseInt(maxPerPagination), currentPaginationOffset]
    }, (data) => {
        console.log(data)
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))
})

app.get("/caretaker/all/count", (req, res) => {
    console.log(req.query.userID)
    db.handleQuery(connectionPool, {
        query: "SELECT Count(*) as `count` FROM `rehabilitator` as `r` INNER JOIN `caretaker` as `c` on `r`.`caretaker_id` = `c`.`caretaker_id` INNER JOIN `user` as `u` on `u`.`id` = `c`.`user_id` WHERE `u`.`id` = ?",
        values: [req.query.userID]
    }, (data) => {
        res.status(httpOkCode).json(data);
    }, (err) => res.status(badRequestCode).json({reason: err}))
})

app.post("/user/uploader", function (req, res) {
    let randomString = Math.random().toString(36).substring(7)

    var data = req.body.data.replace(/^data:image\/\w+;base64,/, '');
    const fileImage = randomString + ".png";
    fs.writeFile(wwwrootPath + "/" + fileImage, data, {encoding: 'base64'}, function (err) {
    });

    //check if stored photo exist in database
    db.handleQuery(connectionPool, {
        query: "SELECT `user`.`photo` FROM `user` WHERE `id` = ?",
        values: [req.body.id]
    }, (data) => {
        if (data[0]['photo'] != null) {
            try {
                fs.unlinkSync(wwwrootPath + "/" + data[0]['photo'])
                //file removed
            } catch (err) {
                console.error(err)
            }
        }
        //change the photo name to the photo random name
        db.handleQuery(connectionPool, {
            query: "UPDATE `user` SET `photo` = ? WHERE `id` = ?",
            values: [fileImage, req.body.id]
        }, (data) => {
            res.status(httpOkCode).json(data);
        }, (err) => res.status(badRequestCode).json({reason: err}))
    }, (err) => res.status(badRequestCode).json({reason: err}))


});


//------- END ROUTES -------

module.exports = app;

