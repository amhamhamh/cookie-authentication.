var http = require('http');
var cookie = require('cookie');
http.createServer(function(request, response){
    console.log(request.headers.cookie);
    var cookies = {};
    if(request.headers.cookie !== undefined){
        cookies = cookie.parse(request.headers.cookie);
    }
    console.log(cookies.yummy_cookie);
    response.writeHead(200, {
        'Set-Cookie':[
            'yummy_cookie=choco', 
            'tasty_cookie=strawberry',
            `Permanent=cookies; Max-Age=${60*60*24*30}`,  // 영속적인 쿠키의 지속시간을 확인하는 방법
            'Secure=Secure; Secure',            //https로만 접속을 했을 때, 해당 쿠기를 전송
            'HttpOnly=HttpOnly; HttpOnly',      //    
            'Path=Path; Path=/cookie',    //path에 들어가는 방법을 제시
            'Doamin=Domain; Domain=test.o2.org' //
        ]
    });
    response.end('Cookie!!');
}).listen(3000);