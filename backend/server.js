const http = require("http");

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("Server AI Smekensix aktif 🤖");

});

server.listen(3000, () => {

    console.log("Server Smekensix berjalan di port 3000");

});