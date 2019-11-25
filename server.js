var http = require('http');
var querystring = require('querystring');
var util = require('util');
var fs = require("fs");
var sd = require('silly-datetime');
var mysql = require('mysql');

//connect mysql database
var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'xzh19981118',
    database: 'safehome'
});

http.createServer(function (req, res) {
    // console.log("request url:", req.url);
    if (req.url == '/index.html') {
        // res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });
        // 定义了一个post变量，用于暂存请求体的信息
        var post = '';

        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function (chunk) {
            post += chunk;
        });

        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function () {

            post = querystring.parse(post);

            if (Object.keys(post).length == 0) {
                fs.readFile('login.html', function (err, data) {
                    if (err) return console.error(err);
                    res.write(data);
                    res.end();
                });
                return ;
            }
            var post_name = post.name;
            var post_password = post.password;

            


            pool.getConnection(function (err, connection) {
                if (err) return console.error(err);
                var sql = 'SELECT * from account where name=' + '\"' + post_name + '\"';
                connection.query(sql, function (error, results, fields) {

                    if (error) return console.error(error);
                    var name_exist = true;
                    if (results.length == 0) {
                        name_exist = false;
                    }
                    else {
                        var password = results[0].password;
                        var logintime = results[0].lastlogintime;
                    }
                    if (name_exist && password == post_password) {

                        //update mysql last login time
                        update_sql_time(post_name,"login");
                        //write the main page
                        fs.readFile('index.html', function (err, data) {
                            if (err) return console.error(err);
                            res.write(data);
                            res.write(insert_account_info(post_name, logintime));
                            res.end();

                        });
                        //res.end("sucess");
                    }
                    else {
                        fs.readFile('login.html', function (err, data) {
                            if (err) return console.error(err);
                            res.write(data);
                            res.write('<script>alert("Username or Password error!")</script>');
                            res.end();

                        });

                    }

                });
                connection.release();
            });

        });
    }
    else if (req.url == '/account.html' || req.url == '/switch.html' || req.url == '/camera.html' || req.url == '/temperature.html') {
        // res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });
        // 定义了一个post变量，用于暂存请求体的信息
        var post = '';

        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function (chunk) {
            post += chunk;
        });

        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function () {

            post = querystring.parse(post);
            if (Object.keys(post).length == 0) {
                res.statusCode = 404;
                res.end();
                return ;
            }
            var post_name = post.name;
            var post_password = post.password;


            pool.getConnection(function (err, connection) {
                if (err) return console.error(err);
                var sql = 'SELECT * from account where name=' + '\"' + post_name + '\"';
                connection.query(sql, function (error, results, fields) {
                    if (error) return console.error(error);
                    var name_exist = true;
                    if (results.length == 0) {
                        name_exist = false;
                    }
                    else {
                        var password = results[0].password;
                        var logintime = results[0].lastlogintime;
                    }
                    if (name_exist && password == post_password) {

                        //write the main page
                        fs.readFile(req.url.replace(/\//, ''), function (err, data) {
                            if (err) return console.error(err);
                            res.write(data);
                            res.write(account_detail(post_name));
                            res.end();

                        });
                        //res.end("sucess");
                    }
                    else {
                        res.write('<script>alert("Password error!");window.close();</script>');
                        res.end();

                    }

                });
                connection.release();
            });

        });
    }
    else if (req.url == '/change') {
        // res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });
        // 定义了一个post变量，用于暂存请求体的信息
        var post = '';

        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function (chunk) {
            post += chunk;
        });

        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function () {

            post = querystring.parse(post);
            if (Object.keys(post).length == 0) {
                res.statusCode = 404;
                res.end();
                return ;
            }
            var post_name = post.name;
            var post_password = post.password;
            var post_newpassword = post.newpassword;


            pool.getConnection(function (err, connection) {
                if (err) return console.error(err);
                var sql = 'SELECT * from account where name=' + '\"' + post_name + '\"';
                connection.query(sql, function (error, results, fields) {
                    if (error) return console.error(error);
                    var name_exist = true;
                    if (results.length == 0) {
                        name_exist = false;
                    }
                    else {
                        var password = results[0].password;
                    }
                    if (name_exist && password == post_password) {
                        //update mysql last login time 
                        update_sql_password(post_name, post_newpassword,"password update");
                        //write the main page
                        res.write('<script>alert("change successfully!");</script>');

                        res.end();
                        //res.end("sucess");
                    }
                    else {
                        res.write('<script>alert("Password error!");</script>');
                        res.end();
                    }

                });
                connection.release();
            });

        });
    }
    else if (req.url == '/query') {
        // res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });
        // 定义了一个post变量，用于暂存请求体的信息
        var post = '';

        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function (chunk) {
            post += chunk;
        });

        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function () {

            post = querystring.parse(post);
            if (Object.keys(post).length == 0) {
                res.statusCode = 404;
                res.end();
                return ;
            }
            var post_name = post.name;
            var post_password = post.password;
            var post_event = post.event;


            pool.getConnection(function (err, connection) {
                if (err) return console.error(err);
                var sql = 'SELECT * from account where name=' + '\"' + post_name + '\"';
                connection.query(sql, function (error, results, fields) {
                    if (error) return console.error(error);
                    var name_exist = true;
                    if (results.length == 0) {
                        name_exist = false;
                    }
                    else {
                        var password = results[0].password;
                    }
                    if (name_exist && password == post_password) {
                        if (post_event == 'loginrecord') {
                            pool.getConnection(function (err, connection) {
                                if (err) return console.error(err);
                                var time = get_current_time();
                                var time_sql = 'insert into loginrecord(name,time,event) values(\"' + post_name + '\",\"' + time +'\",\"' + "access login record" + '\")';
                                connection.query(time_sql, function (err, results, fields) {
                                    if (err) return console.error(err);
                                });
                                console.log(post_name, "access login record",time);

                                var time_sql = 'SELECT * from loginrecord where name=' + '\"' + post_name + '\"';
                                connection.query(time_sql, function (err, results, fields) {
                                    if (err) return console.error(err);
                                    var i = 0, len = results.length;
                                    var data = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>Document</title></head><body">'+'<table style="border:2px solid black;border-collapse:collapse;width:100%;height:100%;text-align:center;"><tr style="border:2px solid black;border-collapse:collapse;">' + '<th style="border:2px solid black;border-collapse:collapse;">' + 'number' + '</th>' + '<th style="border:2px solid black;border-collapse:collapse;">' + 'time' + '</th>' + '<th style="border:2px solid black;border-collapse:collapse;">' + 'event' + '</th>' + '</tr>';
                                    for (i; i < len; i++) {
                                        var time = results[i].time;
                                        var event = results[i].event;
                                        data = data + '<tr style="border:2px solid black;border-collapse:collapse;">' + '<td style="border:2px solid black;border-collapse:collapse;">' + i + '</td>' + '<td style="border:2px solid black;border-collapse:collapse;">' + time + '</td>' + '<td style="border:2px solid black;border-collapse:collapse;">' + event + '</td></tr>';
                                    }
                                    data = data + '</table></body></html>';
                                    res.write(data);
                                    res.end();

                                });
                                connection.release();
                            });
                        }
                        else if (event == 'permissionstatement') {
                            res.end("permission statement.");
                        }
                    }
                    else {
                        res.write('<script>alert("Password error!");</script>');
                        res.end();
                    }

                });
                connection.release();
            });

        });
    }
    else if (req.url == '/client.html') {
        // res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });
        // 定义了一个post变量，用于暂存请求体的信息
        var post = '';

        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function (chunk) {
            post += chunk;
        });

        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function () {

            post = querystring.parse(post);
            if (Object.keys(post).length == 0) {
                res.statusCode = 404;
                res.end();
                return ;
            }
            var post_name = post.name;
            var post_password = post.password;


            pool.getConnection(function (err, connection) {
                if (err) return console.error(err);
                var sql = 'SELECT * from account where name=' + '\"' + post_name + '\"';
                connection.query(sql, function (error, results, fields) {
                    if (error) return console.error(error);
                    var name_exist = true;
                    if (results.length == 0) {
                        name_exist = false;
                    }
                    else {
                        var password = results[0].password;
                    }
                    if (name_exist && password == post_password) {
                        fs.readFile('client.html', function (err, data) {
                            if (err) return console.error(err);
                            res.write(data);
                            res.end();
                        });
                    }
                    else {
                        res.write('<script>alert("Password error!");</script>');
                        res.end();
                    }

                });
                var time = get_current_time();
                var time_sql = 'insert into loginrecord(name,time,event) values(\"' + post_name + '\",\"' + time +'\",\"' + "access camera" + '\")';
                connection.query(time_sql, function (err, results, fields) {
                    if (err) return console.error(err);
                    
                });
                console.log(post_name, "access camera",time);
                connection.release();
            });

        });
    }
    else {
        // 定义了一个post变量，用于暂存请求体的信息
        var post = '';

        // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        req.on('data', function (chunk) {
            post += chunk;
        });

        // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
        req.on('end', function () {
            fs.readFile(req.url.replace(/\//, ''), function (err, data) {
                if (err) return console.error(err);
                res.end(data);
            });
        });
    }
}).listen(5678);
function account_detail(name) {
    userinfo = '<script>window.onload=function(){' +
        'document.getElementById("username").value="' + name + '";' +
        '};</script>';
    return userinfo;
}
function insert_account_info(name, logintime) {
    userinfo = '<script>window.onload=function(){' +
        'document.getElementById("username").innerHTML="User Name: "+"' + name + '";' +
        'document.getElementById("lastlogintime").innerHTML="Last Login Time: "+"' + logintime + '";' +
        '};</script>';
    return userinfo;

}

function get_current_time() {
    var time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    return time;
}

function update_sql_time(name,event) {
    var time = get_current_time();
    pool.getConnection(function (err, connection) {
        if (err) return console.error(err);
        var time_sql = 'update account set lastlogintime=\"' + time + '\" where name=' + '\"' + name + '\"';
        connection.query(time_sql, function (err, results, fields) {
            if (err) return console.error(err);
            
        });
        var time_sql = 'insert into loginrecord(name,time,event) values(\"' + name + '\",\"' + time +'\",\"' + event + '\")';
        connection.query(time_sql, function (err, results, fields) {
            if (err) return console.error(err);
            
        });
        connection.release();
        console.log(name,"login",time);
    });
}

function update_sql_password(name, password,event) {
    var time = get_current_time();
    pool.getConnection(function (err, connection) {
        if (err) return console.error(err);
        var time_sql = 'update account set password=\"' + password + '\" where name=' + '\"' + name + '\"';
        connection.query(time_sql, function (err, results, fields) {
            if (err) return console.error(err);
            
        });
        var time_sql = 'insert into loginrecord(name,time,event) values(\"' + name + '\",\"' + time +'\",\"' + event + '\")';
        connection.query(time_sql, function (err, results, fields) {
            if (err) return console.error(err);
            
        });
        console.log(name, "password update",time);
        connection.release();
    });

}

const WebSocket = require('ws');
const WS_PORT = process.env.WS_PORT || 3001;
const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));

// array of connected websocket clients
let connectedClients = [];

wsServer.on('connection', (ws, req) => {
    console.log('Connected');
    // add new connected client
    connectedClients.push(ws);
    // listen for messages from the streamer, the clients will not send anything so we don't need to filter
    ws.on('message', data => {
        // send the base64 encoded frame to each connected ws
        connectedClients.forEach((ws, i) => {
            if (ws.readyState === ws.OPEN) { // check if it is still connected
                ws.send(data); // send
            } else { // if it's not connected remove from the array of connected ws
                connectedClients.splice(i, 1);
            }
        });
    });
});