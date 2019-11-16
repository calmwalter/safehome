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
    console.log("request url:", req.url);
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
                return console.log("login failed, redirect to login page.");
            }
            var post_name = post.name;
            var post_password = post.password;

            //console.log(post.name);


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
                        console.log(results);
                        var password = results[0].password;
                        var logintime = results[0].lastlogintime;
                    }
                    if (name_exist && password == post_password) {

                        console.log(post_name, "login sucess");
                        //update mysql last login time
                        update_sql_time(post_name);
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

function insert_account_info(name, logintime) {
    userinfo = '<script>window.onload=function(){' +
        'var label = document.createElement(\'div\');' +
        'label.innerHTML ="User name: "+\'' + name + '\';' +
        'label.className ="accountinfostyle";' +
        'var info=document.getElementById(\'accountinfo\');' +
        'info.appendChild(label);' +
        'label = document.createElement(\'div\');' +
        'label.innerHTML = "last login time: "+ \'' + logintime + '\';' +
        'label.className ="accountinfostyle";' +
        'info.appendChild(label);' +
        '};</script>';

    return userinfo;

}

function get_current_time() {
    var time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    console.log(time);
    return time;
}

function update_sql_time(name) {
    var time = get_current_time()
    pool.getConnection(function (err, connection) {
        if (err) return console.error(err);
        var time_sql = 'update account set lastlogintime=\"' + time + '\" where name=' + '\"' + name + '\"';
        connection.query(time_sql, function (err, results, fields) {
            if (err) return console.error(err);
            console.log("last login time updated:", results);
        });
        var time_sql = 'insert into loginrecord(name,time) values(\"'+name+'\",\"'+time+'\")';
        connection.query(time_sql, function (err, results, fields) {
            if (err) return console.error(err);
            console.log("login record updated:", results);
        });
        connection.release();
    });
}