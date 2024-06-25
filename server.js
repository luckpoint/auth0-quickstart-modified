const express = require('express');
const http = require('http');
const logger = require('morgan');
const path = require('path');
const router = require('./routes/index');
const { auth } = require('express-openid-connect');
const csurf = require("tiny-csrf");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("cookie-parser-secret"));
// NOTE: サンプルはlocalhostで動くhttpサーバーなので、secureはfalseにしておく
app.use(session({ secret: "csrf-secret", cookie: { secure: false }, resave: false, saveUninitialized: true }));
app.use(
  csurf(
    "123456789iamasecret987654321look", // secret -- must be 32 bits or chars in length
    ["POST"], // the request methods we want CSRF protection for
    ["/callback"], // any URLs we want to exclude, either as strings or regexp
    []  // any requests from here will not see the token and will not generate a new one
  )
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const config = {
  authRequired: false,
  auth0Logout: true,
  routes: {
    login: false
  }
};

const port = process.env.PORT || 3000;
if (!config.baseURL && !process.env.BASE_URL && process.env.PORT && process.env.NODE_ENV !== 'production') {
  config.baseURL = `http://localhost:${port}`;
}

app.use(auth(config));

// Middleware to make the `user` object available for all views
app.use(function(req, res, next) {
  res.locals.user = req.oidc.user;
  next();
});

app.use('/', router);

// returnToのカスタマイズ
app.get('/login', (req, res) => {
  let returnTo = req.query.returnTo;
  if (!returnTo) {
    returnTo = '/'
  }
  res.oidc.login({
    returnTo: returnTo,
    authorizationParams: {
      redirect_uri: `http://localhost:${port}/callback`,
    },
  })
});

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: process.env.NODE_ENV !== 'production' ? err : {}
  });
});

http.createServer(app)
  .listen(port, () => {
    console.log(`Listening on ${config.baseURL}`);
  });
