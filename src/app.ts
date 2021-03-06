import path from "path";

import express, { NextFunction, Request, Response } from "express";
import compression from "compression"; // compresses requests
import mongoose from "mongoose";
import bodyParser from "body-parser";
import session from "express-session";
import lusca from "lusca";
import formidable from "express-formidable";
import flash from "express-flash";
import mongo from "connect-mongo";

import { MONGODB_URI, PORT, SECRET } from "./config";
import { home } from "./router/home";
import { auth } from "./router/auth";
import { posts } from "./router/posts";
import { comments } from "./router/comments";
import { admin } from "./router/admin";
import { api } from "./router/api";
import { health } from "./router/health";
import access from "./middlewares/access";
import { loggerFactory } from "./utils/logger";

const logger = loggerFactory("app.ts");
const app = express();
const MongoStore = mongo(session);

mongoose.connect(MONGODB_URI, {
  poolSize: 25,
  useNewUrlParser: true,
})
  .then(() => console.log("ready connect mongodb."))
  .catch(err => {
    logger.error("MongoDB connection error. Please make sure MongoDB is running. " + err);
    process.exit(1);
  });

app.set("port", PORT);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use(formidable());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: SECRET,
  store: new MongoStore({
    url: MONGODB_URI,
    autoReconnect: true,
  }),
}));
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.user = req.session.user;
  return next();
});
app.use(access);

app.use(express.static(path.join(__dirname, "../public"), { maxAge: 7 * 24 * 60 * 60 }));

// Controllers (route handlers)
app.use("/", home);
app.use("/auth", auth);
app.use("/posts", posts);
app.use("/comments", comments);
app.use("/admin", admin);
app.use("/api", api);
app.use("/health", health);
// 404 page not found
app.use((req: Request, res: Response) => {
  if (!res.headersSent) {
    res.status(404).render("404");
  }
});

export default app;
