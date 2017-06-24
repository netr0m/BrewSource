/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var passwordEncrypt = require('machinepack-passwords');
var gravatarProfile = require('machinepack-gravatar');

module.exports = {

  /**
   * This normally refers to a built-in action in blueprints, but we'll
   * override it to pass some extra information
   *
   * @param req
   * @param res
   */
  destroy: function(req, res) {

    if (!req.param('id')){
      return res.badRequest('id is a required parameter.');
    }

    User.destroy({
      id: req.param('id')
    }).exec(function(err, usersDestroyed){
      if (err) return res.negotiate(err);
      if (usersDestroyed.length === 0) {
        return res.notFound();
      }

      // Notify all subscribers that the user is deleted
      User.publishDestroy(req.param('id'), undefined, {
        previous: {
          name: usersDestroyed[0].name
        }
      });

      // Unsubscribe all sockets who are subscribed to this user
      _.each(User.subscribers(usersDestroyed[0]), function(socket) {
        User.unsubscribe(socket, usersDestroyed[0]);
      });

      return res.ok();
    });
  },


  /**
   * This normally refers to a built-in action in blueprints, but we'll
   * override it to strip some properties before sending the response.
   *
   * @param req
   * @param res
   */
  findOne: function(req, res) {

    if (!req.param('id')){
      return res.badRequest('id is a required parameter.');
    }

    User.findOne(req.param('id')).exec(function(err, user) {
      if (err) return res.negotiate(err);
      if (!user) return res.notFound();


      // Subscribe the socket (e.g. browser tab)
      // to each User record, to notify about "publishUpdate"'s
      // and "publishDestroy"'s
      if (req.isSocket) {
        User.subscribe(req, user.id);
      }


      // Send every attribute except password
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        gravatarUrl: user.gravatarUrl,
        admin: user.admin,
        lastLoggedIn: user.lastLoggedIn,
        lastIP: user.lastIP,
        breweries: user.breweries,


        // Add a property, "msUntilInactive", so the front-end knows
        // how long to display a user as active. (60s)
        msUntilInactive: (function(){
          var _msUntilLastActive;
          var now = new Date();
          _msUntilLastActive = (user.lastActive.getTime()+60*1000) - now.getTime();
          if (_msUntilLastActive < 0) {
            _msUntilLastActive = 0;
          }
          return _msUntilLastActive;
        })()
      });

    });
  },


  /**
   * This normally refers to a built-in action in blueprints, but we'll
   * override it to strip some properties from the objects in the array of users.
   *
   * @param req
   * @param res
   */
  find: function(req, res) {

    // "Watch" to the User model, to hear about "publishCreate"'s
    User.watch(req);

    User.find().populate('breweries', { select: ['id', 'name', 'location']}).exec(function(err, users) {
      if (err) return res.negotiate(err);

      var prunedUsers = [];

      // Loop through each user
      _.each(users, function(user){

        // Subscribe the socket (e.g. browser tab)
        // to each User record, to notify about "publishUpdate"'s
        // and "publishDestroy"'s
        if (req.isSocket){
          User.subscribe(req, user.id);
        }

        // Send every attribute except password (strip out password)
        prunedUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          gravatarUrl: user.gravatarUrl,
          admin: user.admin,
          lastLoggedIn: user.lastLoggedIn,
          lastIP: user.lastIP,
          breweries: user.breweries,

          // Add a property, "msUntilInactive", so the front-end knows
          // how long to display a user as active. (60s)
          msUntilInactive: (function(){
            var _msUntilLastActive;
            var now = new Date();
            _msUntilLastActive = (user.lastActive.getTime()+60*1000) - now.getTime();
            if (_msUntilLastActive < 0) {
              _msUntilLastActive = 0;
            }
            return _msUntilLastActive;
          })()
        });
      });

      // Finally, send array of users in the response
      return res.json(prunedUsers);
    });
  },


  /**
   * This action is the first endpoint a user reaches after logging-in.
   * It is implemented by our front-end in "assets/js/brewsource-dashboard/DashboardCtrl.js"
   *
   * @param req
   * @param res
   */
  comeOnline: function(req, res) {

    // Find the currently logged-in user
    User.findOne(req.session.me).populate('breweries', { select: ['id', 'name', 'location']}).exec(function(err, user) {
      if (err) return res.negotiate(err);
      if (!user) {
        return res.notFound('User associated with socket "coming online" no longer exists.');
      }

      // 60s timeout until inactive
      var INACTIVITY_TIMEOUT = 60*1000;

      // Update "lastActive" timestamp for the user to be the local time of the server.
      User.update(user.id, {
        lastActive: new Date()
      }).exec(function(err){
        if (err) return res.negotiate(err);

        // Notify all subscribers that the user has come online
        User.publishUpdate(req.session.me, {
          justBecameActive: true,
          msUntilInactive: INACTIVITY_TIMEOUT,
          name: user.name
        });

        return res.ok();
      });
    });
  },


  /**
   * Update your own profile
   * ("you" being the user currently logged in, AKA "req.session.me")
   *
   * @param req
   * @param res
   */
  updateMyProfile: function(req, res) {

    (function _prepareAttributeValuesToSet(allParams, cb){
      var setAttrVals = {};

      if (allParams.name) {
        setAttrVals.name = allParams.name;
      }
      if (allParams.email) {
        setAttrVals.email = allParams.email;
        // If the email address changed, update the Gravatar URL as well
        // execSync() is only available for synchronous machines.
        // It will return the value sent out of the machine's defaultExit and throw otherwise.
        setAttrVals.gravatarUrl = gravatarProfile.getImageUrl({
          emailAddress: allParams.email
        }).execSync();
      }

      // Encrypt the password if necessary
      if (!allParams.password) {
        return cb(null, setAttrVals);
      }
      passwordEncrypt.encryptPassword({password: allParams.password}).exec({
        error: function(err){
          return cb(err);
        },
        success: function(encryptedPassword){
          setAttrVals.encryptedPassword = encryptedPassword;
          return cb(null, setAttrVals);
        }
      });
    })(req.allParams(), function(err, attributeValsToSet){
      if (err) return res.negotiate(err);

      User.update(req.session.me, attributeValsToSet).exec(function(err){
        if (err) return res.negotiate(err);

        // Notify all connected subscribers that the user has been changed
        User.publishUpdate(req.session.me, {
          name: attributeValsToSet.name,
          email: attributeValsToSet.email,
          gravatarUrl: attributeValsToSet.gravatarUrl
        });

        // Respond with the user's data so the UI can be updated
        return res.ok({
          name: attributeValsToSet.name,
          email: attributeValsToSet.email,
          gravatarUrl: attributeValsToSet.gravatarUrl
        });
      });
    });
  },


  /**
   * Update any user.
   *
   * @param req
   * @param res
   */
  update: function(req, res) {

    if (!req.param('id')) {
      return res.badRequest('id of user to edit is required');
    }

    (function _prepareAttributeValuesToSet(allParams, cb){

      var setAttrVals = {};
      if (allParams.name) {
        setAttrVals.name = allParams.name;
      }
      if (allParams.email) {
        setAttrVals.email = allParams.email;
        // If the email address changed, update the Gravatar URL as well
        // execSync() is only available for synchronous machines.
        // It will return the value sent out of the machine's defaultExit and throw otherwise.
        setAttrVals.gravatarUrl = gravatarProfile.getImageUrl({
          emailAddress: allParams.email
        }).execSync();
      }

      // In this case, we use _.isUndefined (which is pretty much just `typeof X==='undefined'`)
      // because the parameter could be sent as `false`, which we DO care about.
      if ( !_.isUndefined(allParams.admin) ) {
        setAttrVals.admin = allParams.admin;
      }

      // Encrypt the password if necessary
      if (!allParams.password) {
        return cb(null, setAttrVals);
      }
      passwordEncrypt.encryptPassword({password: allParams.password}).exec({
        error: function(err){
          return cb(err);
        },
        success: function(encryptedPassword) {
          setAttrVals.encryptedPassword = encryptedPassword;
          return cb(null, setAttrVals);
        }
      });
    })(req.allParams(), function afterwards(err, attributeValsToSet){
      if (err) return res.negotiate(err);

      User.update(req.param('id'), attributeValsToSet).exec(function(err){
        if (err) return res.negotiate(err);

        // Notify all connected subscribers that the user has been changed
        User.publishUpdate(req.param('id'), {
          name: attributeValsToSet.name,
          email: attributeValsToSet.email,
          admin: attributeValsToSet.admin,
          gravatarUrl: attributeValsToSet.gravatarUrl
        });

        return res.ok();
      });
    });

  },


  /**
   * Check the email address and password provided, and if they
   * match a user in the database, sign them in.
   *
   * @param req
   * @param res
   */
  login: function(req, res) {

    req.validate({
      email: 'string',
      password: 'string'
    });

    // Try to look up the user by the provided email address
    User.findOne({
      email: req.param('email')
    }, function foundUser(err, user) {
      if (err) return res.negotiate(err);
      if (!user) return res.notFound();

      // Compare the password attempt from the form to the encrypted password
      // from the database
      passwordEncrypt.checkPassword({
        passwordAttempt: req.param('password'),
        encryptedPassword: user.encryptedPassword
      }).exec({

        error: function(err){
          return res.negotiate(err);
        },

        // If the password provided doesn't match the encrypted password from the database
        incorrect: function(){
          return res.notFound();
        },

        success: function(){

          // The user is "logging in", so update the "lastLoggedIn" attribute.
          User.update(user.id, {
            lastLoggedIn: new Date(),
            lastIP: req.ip
          }, function(err) {
            if (err) return res.negotiate(err);

            // Store the user id in the user session ("req.session.me")
            req.session.me = user.id;
            console.log(req.ip);

            // All done - Notify the client that everything worked.
            return res.ok();
          });
        }
      });
    });
  },


  /**
   * Log out of BrewSource
   * Wipes "me" from the session
   *
   * @param req
   * @param res
   */
  logout: function(req, res) {

    // Find the user record in the database which is
    // referenced by the id in the user session ("req.session.me")
    User.findOne(req.session.me, function foundUser(err, user) {
      if (err) return res.negotiate(err);

      // If the session refers to a user who no longer exists, still allow logout.
      if (!user) {
        sails.log.verbose('Session refers to a user who no longer exists.');
        return res.backToHomePage();
      }

      // Wipe "me" from the session (log out)
      req.session.me = null;

      // Notify all subscribers that the user has logged out
      User.publishUpdate(user.id, {
        justLoggedOut: true,
        name: user.name
      });

      // Either send a 200 OK or redirect to the home page
      return res.backToHomePage();

    });
  },


  /**
   * Sign up for a new account.
   * (creates a new user, and logs them in)
   *
   * @param req
   * @param res
   */
  signup: function(req, res) {

    // Encrypt the password provided by the user
    passwordEncrypt.encryptPassword({
      password: req.param('password')
    }).exec({
      error: function(err) {
        return res.negotiate(err);
      },
      success: function(encryptedPassword) {
        gravatarProfile.getImageUrl({
          emailAddress: req.param('email')
        }).exec({
          error: function(err) {
            return res.negotiate(err);
          },
          success: function(gravatarUrl) {

            // Create a User with the params sent from
            // the sign-up form
            User.create({
              name: req.param('name'),
              email: req.param('email'),
              encryptedPassword: encryptedPassword,
              lastLoggedIn: new Date(),
              gravatarUrl: gravatarUrl,
              lastIP: req.ip
            }, function userCreated(err, newUser) {
              if (err) {

                // If this error occured because of a not-unique email address,
                // send back an easily parseable status code.
                if (err.invalidAttributes && err.invalidAttributes.email && err.invalidAttributes.email[0] && err.invalidAttributes.email[0].rule === 'unique') {
                  return res.emailAddressInUse();
                }

                // Otherwise, send back something reasonable as an error response.
                return res.negotiate(err);
              }

              // Log the user in
              req.session.me = newUser.id;

              // Notify all subscribers that the user was created.
              User.publishCreate({
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                lastLoggedIn: newUser.lastLoggedIn
              });

              // Send back the id of the new user
              return res.json({
                id: newUser.id
              });
            });
          }
        });
      }
    });
  }
};
