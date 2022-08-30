const express = require('express');
const router = express.Router();
const User = require('../models/User.model')
const Course = require('../models/Course.model')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const roundSalt = 10;

router.get('/signup', (req, res, next) => {
    res.render("auth/signup")
})
router.post('/signup', (req, res, next) => {
    const {username, password} = req.body;
    console.log(username)
    console.log(password)
    if(!username || !password){
        res.render('auth/signup', {errorMessage: "Please indicate username and password"})
        return;
    }

    User.findOne({ username })
    .then( user => {
        if(user!=null){
            res.render('auth/signup', {errorMessage: "Username already exists, login"})
        }
        const salt = bcrypt.genSaltSync(roundSalt)
        const hashPassword = bcrypt.hashSync(password, salt)

        const newUser = new User({
            username: username,
            password: hashPassword, 
            role: 'GUEST',
        })

        newUser.save()
        .then(() => res.redirect('/private'))
        .catch(err => next(err));
    })
    .catch(err => next(err));
})

router.get('/login', (req, res, next) => {
    res.render("auth/login");
})

router.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', failureMessage: 'true', failureFlash: true}),
    function(req, res) {
        console.log(req.user.role)
        if (req.isAuthenticated() && req.user.role === 'BOSS') {
            res.redirect('/privateboss');
        } else if (req.isAuthenticated() && req.user.role === 'DEV') {
            res.redirect('/privatedev');
        } else if (req.isAuthenticated() && req.user.role === 'GUEST') {
            res.redirect('/privateguest');
        } else {
            res.redirect('/login');
        }
        
      })

  router.get('/privatedev', (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'DEV') {
        res.render('auth/privatedev', { user: req.user });
    } else {
        res.render('error')
    }
  });

  router.get('/private', (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'BOSS') {
        res.render('auth/private', { user: req.user });
    } else {
        res.render('error')
    }
  });

  router.get('/privateguest', (req, res) => {
    if (req.isAuthenticated() && req.user.role === 'GUEST') {
        res.render('auth/privateguest', { user: req.user });
    } else {
        res.render('error')
    }
  });

  router.get('/employees', (req, res, next) => {
    User.find()
    .then(employees => 
        {res.render('employees', {employees})})
    .catch(err=>console.log(`Wasnt possible, error: ${err}`)); 
  })

  router.post('/employees', (req, res, next) => {
    res.render('employees')
  })

  router.get('/employee/:id', (req, res, next) => {
    const {id} = req.params;
    User.findById(id)
    .then(user => res.render('employee-details', {user}))
    .catch(err=>console.log(`Wasnt possible, error: ${err}`)); 
  })

  router.post('/employee-edit/:id', (req, res, next) => {
    const {id} = req.params;
    const {username, password, role} = req.body;
    User.findByIdAndUpdate(id, {username, password, role}, { new: true })
    .then(updatedUser=> {
        console.log('updatedUser')
        console.log(updatedUser)
        res.redirect(`/employee/${updatedUser._id}`)})
    .catch(err=>console.log(`Wasnt possible, error: ${err}`)); 
  })

  router.get('/employee-delete/:id', (req, res, next) => {
    const {id} = req.params;
    User.findByIdAndDelete(id)
    .then(res.redirect('/employees'))
    .catch(err=>console.log(`Wasnt possible, error: ${err}`)); 
  })

  router.get('/newuser', function(req, res, next) {
    res.render('new-user')
  });

  router.post('/newuser', function(req, res, next) {
    console.log(req.params)
    const { username, role, password } = req.body;
    User.create({ username, role, password })
    .then(userFromDB => {
        console.log(`New username created: ${userFromDB.username}.`)
        res.redirect('/employees')
    })
    .catch(error => `Error while creating a new book: ${error}`);
});

  router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

module.exports = router;
