/**
 * BreweryController
 *
 * @description :: Server-side logic for managing breweries
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  destroy: function(req, res) {

    if (!req.param('id')) {
      return res.badRequest('id is a required parameter.');
    }

    Brewery.destroy({
      id: req.param('id')
    }).exec(function(err, breweriesDestroyed) {
      if (err) return res.negotiate(err);
      if (breweriesDestroyed.length === 0) {
        return res.notFound();
      }

      return res.ok();
    });
  },


  /**
   * This normally refers to a built-in action in blueprints, but we'll
   * override it to strip some properties before sending the response.
   */
  findOne: function(req, res) {

    if (!req.param('id')) {
      return res.badRequest('id is a required parameter.');
    }

    Brewery.findOne(req.param('id')).populateAll().exec(function(err, brewery) {
      if (err) return res.negotiate(err);
      if (!brewery) return res.notFound();

      // Send the attributes
      return res.json({
        id: brewery.id,
        name: brewery.name,
        location: brewery.location,
        owner: brewery.owner,
        temperatures: brewery.temperatures
      });
    });
  },


  /**
   * This normally refers to a built-in action in blueprints, but we'll
   * override it to strip some properties from the objects in the array of breweries.
   */
  find: function(req, res) {

    Brewery.find().populate('owner', { select: ['id', 'name', 'email', 'admin', 'lastLoggedIn']}).exec(function(err, breweries) {
      if (err) return res.negotiate(err);

      var prunedBreweries = [];

      // Loop through each brewery
      _.each(breweries, function(brewery) {

        // Send every attribute except temperatures
        prunedBreweries.push({
          id: brewery.id,
          name: brewery.name,
          location: brewery.location,
          owner: brewery.owner
        });
      });
      // Finally, send array of breweries in the response
      return res.json(prunedBreweries);
    })
  },


  /**
   * Update a brewery.
   */
  update: function(req, res) {

    if (!req.param('id')) {
      return res.badRequest('id of brewery to edit is required.');
    }

    (function _prepareAttributeValuesToSet(allParams, cb) {

      var setAttrVals = {};
      if (allParams.name) {
        setAttrVals.name = allParams.name;
      }
      if (allParams.location) {
        setAttrVals.location = allParams.location;
      }
/**
      if (!_.isUndefined(allParams.owner)) {
        setAttrVals.owner = allParams.owner;
      }
 **/
    })(req.allParams(), function afterwards(err, attributeValsToSet) {
      if (err) return res.negotiate(err);

      Brewery.update(req.param('id'), attributeValsToSet).exec(function(err) {
        if (err) return res.negotiate(err);
      });

      return res.ok();
    });
  },

  /**
   * Create a new brewery.
   */
  create: function(req, res) {

    Brewery.create({
      name: req.param('name'),
      location: req.param('location'),
      owner: req.param('owner')
    }, function breweryCreated(err, newBrewery) {
      if (err) return res.negotiate(err);

      return res.json({
        id: newBrewery.id
      });
    });
  },

/**
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
 **/
};
