/**
 * BatchController
 *
 * @description :: Server-side logic for managing batches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  destroy: function(req, res) {

    if (!req.param('id')) {
      return res.badRequest('id is a required parameter.');
    }

    Batch.destroy({
      id: req.param('id')
    }).exec(function(err, batchesDestroyed) {
      if (err) return res.negotiate(err);
      if (batchesDestroyed.length === 0) {
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

    Batch.findOne(req.param('id')).populateAll().exec(function(err, batch) {
      if (err) return res.negotiate(err);
      if (!batch) return res.notFound();

      // Send the attributes
      return res.json({
        id: batch.id,
        name: batch.name,
        idealTemp: batch.idealTemp,
        owner: batch.owner,
        temperatures: batch.temperatures
      });
    });
  },


  /**
   * This normally refers to a built-in action in blueprints, but we'll
   * override it to strip some properties from the objects in the array of batches.
   */
  find: function(req, res) {

    Batch.find().populateAll().exec(function(err, batches) {
      if (err) return res.negotiate(err);

      var prunedBatches = [];

      // Loop through each batch
      _.each(batches, function(batch) {

        prunedBatches.push({
          id: batch.id,
          name: batch.name,
          idealTemp: batch.idealTemp,
          owner: batch.owner,
          temperatures: batch.temperatures
        });
      });
      // Finally, send array of batches in the response
      return res.json(prunedBatches);
    })
  },


  /**
   * Update a batch.
   */
  update: function(req, res) {

    if (!req.param('id')) {
      return res.badRequest('id of batch to edit is required.');
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

      Batch.update(req.param('id'), attributeValsToSet).exec(function(err) {
        if (err) return res.negotiate(err);
      });

      return res.ok();
    });
  },

  /**
   * Create a new batch.
   */
  create: function(req, res) {

    Batch.create({
      name: req.param('name'),
      idealTemp: req.param('idealTemp'),
      owner: req.param('owner')
    }, function batchCreated(err, newBatch) {
      if (err) return res.negotiate(err);

      return res.json({
        id: newBatch.id
      });
    });
  },
};
