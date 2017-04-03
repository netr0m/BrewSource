/**
 * BreweryController
 *
 * @description :: Server-side logic for managing breweries
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  'new': function(req, res, err) {
    User.findOne(req.param('owner'), function foundUser (err, user) {
      if (err) return next(err);
      if (!user) return next();
      res.view({
        user: user
      });
    });
  },

  create: function (req, res, next) {
    Brewery.create(req.params.all(), function breweryCreated(err, brewery) {
      if (err) return next(err);

      //res.json(brewery);
      res.redirect('/brewery/show/' + brewery.id);
    });
  },

  show: function (req, res, next) {
    Brewery.findOne(req.param('id')).populateAll().exec(function (err, brewery) {
      if (err) return next(err);
      if (!brewery) return next();

      res.view({
        brewery: brewery
      });
    });
  },

  index: function (req, res, next) {
    Brewery.find(function foundBreweries(err, breweries) {
      if (err) return next(err);

      res.view({
        breweries: breweries
      });
    });
  },

  edit: function (req, res, next) {
    Brewery.findOne(req.param('id'), function foundBrewery(err, brewery) {
      if (err) return next(err);
      if (!brewery) return next();

      res.view({
        brewery: brewery
      });
    });
  },

  update: function (req, res, next) {
    Brewery.update(req.param('id'), req.params.all(), function breweryUpdated(err) {
      if (err) {
        return res.redirect('/brewery/edit/' + req.param('id'));
      }

      res.redirect('/brewery/show/' + req.param('id'));
    });
  },

  destroy: function (req, res, next) {
    Brewery.destroy(req.param('id')).exec(function () {
      res.redirect('/brewery/');
    });
  }
};
