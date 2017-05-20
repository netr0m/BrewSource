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

  create: function (req, res, next) {
    BreweryTemp.create(req.params.all(), function breweryTempCreated(err, breweryTemp) {
      if (err) return next(err);

      res.json(breweryTemp);
    });
  },

  show: function (req, res, next) {
    BreweryTemp.findOne(req.param('id')).populate('owner', { select: ['id', 'name', 'location']}).exec(function (err, breweryTemp) {
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

      res.json(breweryTemps);
      });
  },

  edit: function (req, res, next) {
    BreweryTemp.findOne(req.param('id'), function foundBreweryTemp(err, breweryTemp) {
      if (err) return next(err);
      if (!breweryTemp) return next();

      res.view({
        breweryTemp: breweryTemp
      });
    });
  },

  update: function (req, res, next) {
    BreweryTemp.update(req.param('id'), req.params.all(), function breweryTempUpdated(err) {
      if (err) {
        return res.redirect('/breweryTemp/edit/' + req.param('id'));
      }

      res.redirect('/breweryTemp/show/' + req.param('id'));
    });
  },

  destroy: function (req, res, next) {
    BreweryTemp.destroy(req.param('id')).exec(function () {
      res.redirect('/breweryTemp/');
    });
  }
};
