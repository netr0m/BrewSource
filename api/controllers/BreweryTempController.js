/**
 * BreweryTempController
 *
 * @description :: Server-side logic for managing brewerytemps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
   * This normally refers to a built-in action in blueprints, but we'll
   * override it to strip some properties before sending the response.
   * @param req
   * @param res
   */
  findOne: function(req, res) {

    if (!req.param('id')) {
      return res.badRequest('id is a required parameter');
    }

    BreweryTemp.findOne(req.param('id')).populateAll().exec(function(err, breweryTemp) {
      if (err) return res.negotiate(err);
      if (!breweryTemp) return res.notFound();

      // Send the attributes
      return res.json({
        id: breweryTemp.id,
        temperature: breweryTemp.temperature,
        createdAt: breweryTemp.createdAt,
        owner: breweryTemp.owner
      });
    });
  },

  find: function(req, res) {
    BreweryTemp.find().populateAll().exec(function (err, breweryTemps) {
      if (err) return res.negotiate(err);

      var prunedBreweryTemps = [];

      // Loop through each breweryTemp
      _.each(breweryTemps, function(breweryTemp) {

        prunedBreweryTemps.push({
          id: breweryTemp.id,
          temperature: breweryTemp.temperature,
          createdAt: breweryTemp.createdAt,
          owner: breweryTemp.owner
        });
      });
      // Finally, send array of brewerytemps in response
      return res.json(prunedBreweryTemps);
    })
  },


  'new': function (req, res) {
    res.view();
  },
};
