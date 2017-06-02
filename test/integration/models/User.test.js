/**
 * Created by mortea15 on 02.06.2017.
 */
describe('UserModel', function() {

  describe('#find()', function() {
    it('should check find function', function (done) {
      User.find()
        .then(function(results) {
          // some tests
          done();
        })
        .catch(done);
    });
  });

});
