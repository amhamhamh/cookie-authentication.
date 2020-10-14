var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');
var cookie = require('cookie');

function authIsOwner(request, response) {   // 인증절차를 가지는 함수. 
  var isOwner = false;          
  var cookies = {}  
  if (request.headers.cookie) {
    cookies = cookie.parse(request.headers.cookie);       //만약 쿠키 값이 true 일때, 쿠키 값을 담아서 12번 줄에 넣고, 
  }
  if (cookies.email === 'egoing777@gmail.com' && cookies.password === '111111') {   //만약 email과 password가 111111일 때 
    isOwner = true;                                                                 //isowner는 true가 된다. 
  }
  return isOwner;
}
function authStatusUI(request, response) {                                   //로그인 할 수 있는 UI     
  var authStatusUI = '<a href="/login">login</a>';                          //authStatusUI는 login 값으로 변수 선언하고
  if (authIsOwner(request, response)) {
    authStatusUI = '<a href="/logout_process">logout</a>';                    //authostuatusUI는 logout으로 변수를 선언한다. (23번줄이 맞을 떄, 26번 줄을 리턴한다.) 
  }
  return authStatusUI;                                                       
}
var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    if (queryData.id === undefined) {
      fs.readdir('./data', function (error, filelist) {
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`,
          authStatusUI(request, response)                                           //홈 화면에서 로그인 할 수 있는 정보
        );
        response.writeHead(200);
        response.end(html);
      });
    } else {
      fs.readdir('./data', function (error, filelist) {
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
          var title = queryData.id;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description, {
            allowedTags: ['h1']
          });
          var list = template.list(filelist);
          var html = template.HTML(sanitizedTitle, list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            ` <a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
                  <input type="submit" value="delete">
                </form>`, authStatusUI(request, response)                      //본문 화면에서 로그인 할 수 있는 정보
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    }
  } else if (pathname === '/create') {
    if(authIsOwner(request, response) === false){       // 만약 인증절차과정이 거짓이면
      response.end('Login required!!');                 // 이 답을 리턴한다. 
      return false;                                          
    }
    fs.readdir('./data', function (error, filelist) {
      var title = 'WEB - create';
      var list = template.list(filelist);
      var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '', authStatusUI(request, response));            //인증 절차 화면 
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === '/create_process') {
    if(authIsOwner(request, response) === false){
      response.end('Login required!!');                 // 거짓이면 아래와 같은 화면을 출력함. 
      return false;
    }
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
        response.writeHead(302, {
          Location: `/?id=${title}`
        });
        response.end();
      })
    });
  } else if (pathname === '/update') {
    if(authIsOwner(request, response) === false){
      response.end('Login required!!');                     
      return false;
    }
    fs.readdir('./data', function (error, filelist) {
      var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`,
          authStatusUI(request, response)
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === '/update_process') {
    if(authIsOwner(request, response) === false){
      response.end('Login required!!');
      return false;
    }
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function (error) {
        fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
          response.writeHead(302, {
            Location: `/?id=${title}`
          });
          response.end();
        })
      });
    });
  } else if (pathname === '/delete_process') {
    if(authIsOwner(request, response) === false){
      response.end('Login required!!');
      return false;
    }
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function (error) {
        response.writeHead(302, {
          Location: `/`
        });
        response.end();
      })
    });
  } else if (pathname === '/login') {                                     //post는 방식으로 email과 password를 전송한다. 
    fs.readdir('./data', function (error, filelist) {
      var title = 'Login';
      var list = template.list(filelist);
      var html = template.HTML(title, list,
        `
          <form action="login_process" method="post">
            <p><input type="text" name="email" placeholder="email"></p>                       
            <p><input type="password" name="password" placeholder="password"></p>
            <p><input type="submit"></p>
          </form>`,
        `<a href="/create">create</a>`
      );
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === '/login_process') {             // login process 값. 
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      if (post.email === 'egoing777@gmail.com' && post.password === '111111') {   //쿠키의 이메일 값과 password가 일치할 경우
        response.writeHead(302, {
          'Set-Cookie': [                                                          //쿠키룰 설정한다.  
            `email=${post.email}`,
            `password=${post.password}`,
            `nickname=egoing`
          ],
          Location: `/`                                                         //홈으로 리다이렉션
        });
        response.end();
      } else {
        response.end('Who?');
      }
      response.end();
    });
  } else if (pathname === '/logout_process') {                                //logout 처리과정
    if(authIsOwner(request, response) === false){
      response.end('Login required!!');                                       
      return false;
    }
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      response.writeHead(302, {                                           //쿠키들의 생명을 꺼버림
        'Set-Cookie': [
          `email=; Max-Age=0`,
          `password=; Max-Age=0`,
          `nickname=; Max-Age=0`
        ],
        Location: `/`                                                     //홈으로 리다이렉션
      });
      response.end();
    });
  } else {
    response.writeHead(404);
    response.end('Not found');
  }
});
app.listen(3000);