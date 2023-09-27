const express = require("express");
const mongoose = require("mongoose");
const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const session = require("express-session");
const redis = require("redis");
const RedisStore = require("connect-redis").default;
const cors = require("cors");

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");

/** Database */

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
      console.log(err);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

/** Redis */

const redisClient = redis.createClient({
  url: `redis://${REDIS_URL}:${REDIS_PORT}`,
});
redisClient.connect().catch(console.error);

/** MIDDLEWARE */

const app = express();

app.enable("trust proxy");
app.use(cors());

app.use(
  session({
    proxy: true,
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 30000,
    },
  })
);
app.use(express.json());

const port = process.env.PORT || 3000;

/** Routes */

app.get("/api/v1", (req, res) => {
  res.send("<h2>Ciao!</h2>");
  console.log("yeah it ran");
});

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
