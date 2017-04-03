/**
 * BreweryTempController
 *
 * @description :: Server-side logic for managing brewerytemps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  'new': function (req, res) {
    res.view();
  },

  show: function (req, res, next) {
    BreweryTemp.findOne(req.param('id')).populateAll().exec(function (err, breweryTemp) {
      if (err) return next(err);
      if (!breweryTemp) return next();

      res.view({
        breweryTemp: breweryTemp
      });
    });
  },

  index: function (req, res, next) {
    BreweryTemp.find(function foundBreweryTemps(err, breweryTemps) {
      if (err) return next(err);

      res.view({
        breweryTemps: breweryTemps
      });
    });
  }
};
