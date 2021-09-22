require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const server = require("http").createServer(app);
const request = require("request");
const { User } = require(`./models`);
const options = {
  /* ... */
};
const io = require("socket.io")(server, options);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = "http://localhost:8080/"; // FRONTEND REDIRECT URI
// const server_address = "http://localhost:3000";
//  http://localhost:8080/

app.use(cors());
app.get("/login", function (req, res) {
  const scopes =
    "user-read-private user-read-email streaming user-modify-playback-state user-read-currently-playing playlist-read-private";
  res.redirect(
    "https://accounts.spotify.com/authorize" +
      "?response_type=code" +
      "&client_id=" +
      client_id +
      (scopes ? "&scope=" + encodeURIComponent(scopes) : "") +
      "&redirect_uri=" +
      encodeURIComponent(redirect_uri)
  );
  // console.log(req.query);
});

app.get("/callback", async function (req, res) {
  const code = req.query.code || null;
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    json: true,
  };
  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      const refresh_token = body.refresh_token;
      res.status(200).json({ access_token, refresh_token });
    } else {
      res.status(401).json({
        msg: "login error!!!",
      });
    }
  });
});

io.on("connection", (socket) => {
  /* ... */
  console.log(socket.id);
  console.log("user connected");
  socket.on("sendMessage", (data) => {
    console.log(data, "ini dari server");
    io.emit("broadcastMessage", data);
  });
  socket.on("loginUser", async (user) => {
    await User.create({ username: user, user_id: socket.id });
    // users.push({ user, id: socket.id });
    // console.log(users);
    const data = await User.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    // console.log(data);
    io.emit("sendUsers", data);

    // console.log(index);
  });
  socket.on("disconnect", async () => {
    console.log(socket.id);
    await User.destroy({
      where: {
        user_id: socket.id,
      },
    });
    const data = await User.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    // console.log(data);
    io.emit("sendUsers", data);
  });
});

server.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});
