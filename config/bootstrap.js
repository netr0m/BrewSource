/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {

  User.findOne({
    admin: true
  }).exec(function(err, admin) {
    if (err) return cb(err);
    if (admin) {
      return cb();
    }

    // ****************************************

    require('machinepack-passwords').encryptPassword({
      password: 'qwerty'
    }).exec({
      error: function (err) {
        return cb(err);
      },
      success: function (encryptedPassword) {

        // Create a demo Admin user
        User.create({
          name: 'BrewMaster',
          email: 'admin@brewsource.no',
          admin: true,
          encryptedPassword: encryptedPassword,
          lastLoggedIn: new Date(),
          lastActive: new Date()
        }, function userCreated(err, newUser) {
          if (err) {
            return cb(err);
          }
          cb();
        });
      }
    });

    // ****************************************

  });
};
