/**
 * PageController
 *
 * @description :: Server-side logic for managing pages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  showHomePage: function(req, res) {

    // If not logged in, display public view
    if (!req.session.me) {
      return res.view('homepage');
    }

    // Otherwise, find the logged-in user and display the logged-in view
    User.findOne(req.session.me, function(err, user) {
      if (err) {
        return res.negotiate(err);
      }

      if (!user) {
        sails.log.verbose('Session refers to a user who no longer exists - did you delete a user, then try to refresh');
        return res.view('homepage');
      }

      return res.view('dashboard', {
        me: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: !!user.admin,
          gravatarUrl: user.gravatarUrl,
          breweries: user.breweries
        }
      });
    });
  },
};
