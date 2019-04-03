/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
//const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');

const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const gameController = require('./controllers/game');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());


var sessionMiddleware = session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true,
  })
});
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  }
  else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  }
  else if (req.user &&
    (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'), { maxAge: 31557600000 }));
app.use('/js/lib', express.static(path.join(__dirname, 'node_modules/jquery/dist'), { maxAge: 31557600000 }));
app.use('/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
app.get('/play', passportConfig.isAuthenticated, gameController.getPlayer);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/google-maps', apiController.getGoogleMaps);
app.get('/api/chart', apiController.getChart);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/snapchat', passport.authenticate('snapchat'));
app.get('/auth/snapchat/callback', passport.authenticate('snapchat', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/tumblr');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/api' }), (req, res) => {
  res.redirect(req.session.returnTo);
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/api/pinterest');
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
}
else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Server Error');
  });
}
/*
io.use(function(socket, next) {
  socket.request.originalUrl = socket.request.url;
  session(socket.request, socket.request.res, next);
});
*/

io.on('connect', (socket) => {
  var playerId = "232B7156C144AD65";

  socket.on("login", (ticket) => {

    console.log(ticket);

    socket.emit("login", {
      playerId: playerId,
      nickname: "Littlelinux",
      inventory: []
    });
    io.sockets.emit("A", {
      i: playerId,
      n: "Littlelinux",
      x: 433,
      y: 195,
      r: 0,
      s: 5
    })
  });
  socket.on("joinRoom", (room) => {
    console.log(room);

    socket.emit("joinRoom", {
      "roomId": "tavern",
      "name": "Tavern",
      "playerlist": [{
          "i": "D5D952CEB33AF6CA",
          "n": "Tisell",
          "x": 483,
          "y": 249,
          "r": 177,
          "s": 5
        },
        {
          "i": "187A5617313EDEA9",
          "n": "snook",
          "x": 201,
          "y": 119,
          "r": 165,
          "s": 5
        },
        {
          "i": "A07437351C5B2BD7",
          "n": "QU4D",
          "x": 759,
          "y": 287,
          "r": 81,
          "s": 5
        },
        {
          "i": "4D65163B7D6193EE",
          "n": "Herbert P Bear",
          "x": 488,
          "y": 190,
          "r": 73,
          "s": 5
        },
        {
          "i": "B6A71210C681DE8C",
          "n": "lauren25blue",
          "x": 5,
          "y": 461,
          "r": 283,
          "s": 5
        },
        {
          "i": "9CF6730AE6FF3F2D",
          "n": "quester",
          "x": 527,
          "y": 333,
          "r": 163,
          "s": 5
        },
        {
          "i": "9089D57D6D8FA37C",
          "n": "Rick the Hamster",
          "x": 266,
          "y": 200,
          "r": 290,
          "s": 5
        },
        {
          "i": "EB714AE1F9F70046",
          "n": "Vanilla",
          "x": 483,
          "y": 315,
          "r": 165,
          "s": 5
        },
        {
          "i": "BFE2814BCCA4FFA9",
          "n": "Passerby",
          "x": 557,
          "y": 388,
          "r": 248,
          "s": 5
        },
        {
          "i": "6AE45DD5FAF49CCB",
          "n": "Steoz",
          "x": 785,
          "y": 289,
          "r": 89,
          "s": 5
        },
        {
          "i": "9905F87D6198ED5F",
          "n": "coolcousins",
          "x": 154,
          "y": 265,
          "r": 106,
          "s": 5
        },
        {
          "i": "8E9CE0ADB46D31B8",
          "n": "Pink",
          "x": 231,
          "y": 297,
          "r": 110,
          "s": 5
        },
        {
          "i": "828C70D73C78956A",
          "n": "Honkman",
          "x": 486,
          "y": 275,
          "r": 91,
          "s": 5
        },
        {
          "i": "D87D2CC210514D7E",
          "n": "Isa",
          "x": 293,
          "y": 341,
          "r": 258,
          "s": 5
        },
        {
          "i": "32577A962CEF2184",
          "n": "amnot",
          "x": 258,
          "y": 237,
          "r": 30,
          "s": 5
        },
        {
          "i": "9C41F28F9F00FD8B",
          "n": "KottyDim",
          "x": 620,
          "y": 208,
          "r": 137,
          "s": 5
        },
        {
          "i": "A59CF3D4C03DFEAA",
          "n": "Carl",
          "x": 433,
          "y": 195,
          "r": 0,
          "s": 5
        },
        {
          "i": "232B7156C144AD65",
          "n": "Littlelinux",
          "x": 433,
          "y": 195,
          "r": 0,
          "s": 5
        }
      ],
      "width": 850,
      "height": 480,
      "margin": 0,
      "minDistance": 20,
      "artwork": {
        "background": "HamTavern_BG.png",
        "foreground": "HamTavern_FG.png",
        "sprites": {
          "images": [
            "/media/rooms/HamTavern_SM.png"
          ],
          "frames": [
            [
              577,
              161,
              170,
              61,
              0,
              85,
              42
            ],
            /*
            [
              221,
              0,
              147,
              240,
              0,
              74,
              118
            ],
            [
              625,
              0,
              181,
              161,
              0,
              90,
              52
            ],
            [
              806,
              0,
              127,
              118,
              0,
              64,
              103
            ],
            [
              0,
              0,
              221,
              174,
              0,
              110,
              133
            ],
            [
              235,
              240,
              42,
              38,
              0,
              21,
              1
            ],
            [
              353,
              242,
              37,
              35,
              0,
              18,
              3
            ],
            [
              316,
              240,
              37,
              35,
              0,
              18,
              2
            ],
            [
              933,
              0,
              83,
              151,
              0,
              31,
              122
            ],
            [
              719,
              222,
              68,
              63,
              0,
              24,
              29
            ],
            [
              195,
              240,
              40,
              40,
              0,
              20,
              2
            ],
            [
              277,
              240,
              39,
              40,
              0,
              20,
              2
            ],
            [
              0,
              174,
              103,
              78,
              0,
              52,
              49
            ],
            [
              103,
              174,
              68,
              88,
              0,
              34,
              38
            ],
            [
              965,
              239,
              53,
              33,
              0,
              26,
              4
            ],
            [
              171,
              174,
              24,
              68,
              0,
              12,
              59
            ],
            [
              906,
              151,
              118,
              88,
              0,
              59,
              37
            ],
            [
              368,
              137,
              128,
              105,
              0,
              64,
              19
            ],
            [
              368,
              0,
              257,
              137,
              0,
              129,
              48
            ],
            [
              496,
              137,
              81,
              138,
              0,
              40,
              94
            ],
            [
              806,
              118,
              100,
              147,
              0,
              70,
              111
            ],
            [
              577,
              222,
              65,
              84,
              0,
              32,
              44
            ],
            [
              779,
              161,
              22,
              34,
              0,
              11,
              23
            ],
            [
              747,
              161,
              32,
              57,
              0,
              16,
              15
            ],
            [
              642,
              222,
              77,
              64,
              0,
              39,
              45
            ],
            [
              906,
              239,
              59,
              68,
              0,
              29,
              13
            ]
            */
          ]
        },
        "props": [
          [
            0,
            455,
            180
          ],
          /*
          [
            1,
            314,
            201
          ],
          [
            2,
            301,
            341
          ],
          [
            3,
            259,
            434
          ],
          [
            4,
            670,
            245
          ],
          [
            5,
            665,
            274
          ],
          [
            6,
            592,
            252
          ],
          [
            7,
            548,
            208
          ],
          [
            8,
            830,
            245
          ],
          [
            9,
            837,
            279
          ],
          [
            10,
            484,
            307
          ],
          [
            11,
            339,
            320
          ],
          [
            12,
            409,
            336
          ],
          [
            13,
            563,
            380
          ],
          [
            14,
            430,
            415
          ],
          [
            15,
            411,
            442
          ],
          [
            16,
            496,
            399
          ],
          [
            17,
            812,
            309
          ],
          [
            18,
            722,
            357
          ],
          [
            19,
            28,
            213
          ],
          [
            20,
            12,
            292
          ],
          [
            21,
            9,
            331
          ],
          [
            22,
            162,
            246
          ],
          [
            23,
            85,
            250
          ],
          [
            24,
            127,
            204
          ],
          [
            25,
            205,
            221
          ]
          */
        ]
      },
      "tileMap": [
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        /*
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ]
        */
      ],
      "tileSize": 100
    });

  });
  socket.on("click", (click) => {
    /**
     * x:x
     * y:y
     */
    io.sockets.emit("X", { x: click.x, y: click.y, i: playerId, r: 180 });
  });
  socket.on("sendMessage", (message) => {
    console.log(message);

    io.sockets.emit("M", { i: playerId, m: message.message })
  })
});

/**
 * Start Express server.
 */
server.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
