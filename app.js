const app = require("express")();
const port = process.env.PORT || 3000;
const server = require("http").createServer(app);
const options = {
  /* ... */
};
const io = require("socket.io")(server, options);

io.on("connection", (socket) => {
  /* ... */
});

server.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
