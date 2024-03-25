'use strict';

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');                                  // logging middleware
const cors = require('cors');
const db = require("./db");
const session = require('express-session');// session middleware

/*
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
*/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

const { check, validationResult } = require('express-validator'); // validation middleware

const postiDao = require('./dao-posti'); // module for accessing the posti table in the DB
const userDao = require('./dao-users'); // module for accessing the user table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev')); // set-up logging (inizialmente c'era dev al posto di combined)
app.use(express.json());
//app.use(express.static('public'));
app.use('/static', express.static('public'));// serve per caricare le immagini

/*
const mongoStore = new MongoStore({
  mongooseConnection: mongoose.connection,
  collection: 'sessions',
  mongoUrl: 'mongodb://localhost:5173',
  autoRemove: 'native', // Optional: Auto-remove expired sessions
});
*/


/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: 'secret phrase posti aereo', resave: false, saveUninitialized: false
}));
/*
app.use(session({
  secret: 'xxxxyyyyzzzz',
  resave: false,
  saveUninitialized: false,
  store: mongoStore,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));
*/ 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

/*** Passport ***/

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy((username, password, callback) => {
  userDao.getUser(username, password).then((user) => {
    if(!user)
      return callback(null, false, 'Incorrect username or password')
    callback(null, user);
  }).catch((err) => {
    callback(null, false, err)
  });
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser((user, callback) => {
  callback(null, { id: user.id, email: user.email, name: user.name });
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
  // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
  // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));
  
  return callback(null, user); // this will be available in req.user
});

app.use(passport.authenticate('session'));


/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

/*** Users APIs ***/


// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => { 
    if (err)
      return next(err);
      if (!user) {
        // display wrong login messages
        return res.status(401).json({ error: info });
      }
      // success, perform the login and extablish a login session
      req.login(user, (err) => {
        if (err)
          return next(err);
        
        // req.user contains the authenticated user, we send all the user info back
        // this is coming from userDao.getUser() in LocalStratecy Verify Fn
        return res.json(req.user);
      });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});


/*** Posti APIs ***/



// GET /api/voli/:tipoVolo/dati
// This route returns the list of occupied seats and the parameters of a specific flight
app.get('/api/voli/:tipoVolo/dati', async (req, res) => {
  const tipoVolo = req.params.tipoVolo;

  try {
    const postiOccupati = await postiDao.listaPostiOccupati(tipoVolo);
    const parametri = await postiDao.parametriVolo(tipoVolo);

    const datiVolo = {
      postiPrenotati: postiOccupati,
      F: parametri.File,
      P: parametri.Posti
    };

    res.status(200).json(datiVolo);
  } catch (err) {
    res.status(500).json(err);
  }
});

//app.use(isLoggedIn); // all the APIs below this line are available only after login

//GET /api/voli/:tipoVolo/:id
// This route returns the prenotation for a specific user and flight
app.get('/api/voli/:tipoVolo/prenota', isLoggedIn, (req, res) => {
  postiDao.prenotazionePerVoloPerUtente(req.user.id,req.params.tipoVolo)
    .then(prenotazione => res.json(prenotazione))
    .catch((err) => res.status(500).json(err));
});

// DELETE /api/voli/:tipoVolo/:id
// This route is used for deleting a prenotation with the volo type specified in the body
app.delete('/api/voli/:tipoVolo/cancella', isLoggedIn, (req, res) => {
  postiDao.cancellaPrenotazione( req.user.id, req.params.tipoVolo)
    .then(() => res.status(200).end())
    .catch((err) => res.status(500).json(err));
});

// POST /api/voli/:tipoVolo/:id/auto
// This route is used for performing a new automatic prenotation with the number of seats specified in the body
app.post('/api/voli/:tipoVolo/auto', isLoggedIn, (req, res) => {
  postiDao.primiNPostiLiberi(req.params.tipoVolo, req.body.N)
    .then(posti => {
      if (posti.length > 0 && posti.length === req.body.N) {
        return postiDao.nuovaPrenotazione(posti, req.user.id, req.params.tipoVolo);
      } else {
        res.status(500).json("Non ci sono abbastanza posti liberi");
      }
    })
    .then(prenotazione => {
      res.status(200).json(prenotazione);
    })
    .catch(error => {
      res.status(500).json({ error: error });
    });
});

// POST /api/voli/:tipoVolo/:id/man
// This route is used for performing a new manual prenotation with the seats specified in the body
app.post('/api/voli/:tipoVolo/man', isLoggedIn, (req, res) => {
  postiDao.nuovaPrenotazione(req.body.posti, req.user.id, req.params.tipoVolo )
    .then(prenotazione => res.status(200).json(prenotazione))
    .catch((posti) => res.status(500).json(posti));
});

// Activating the server
const PORT = 3001;
app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}/`));