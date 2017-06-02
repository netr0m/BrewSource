/**
 * Created by mortea15 on 02.06.2017.
 */
var request = require('supertest');

describe('UserController', function() {

  describe('#login()', function() {
    it('should redirect to /profile', function(done) {
      request(sails.hooks.http.app)
        .post('/signup')
        .send({ name: 'test', email: 'test@test.eu', password: 'test123', lastActive: new Date(0), lastLoggedIn: new Date(0) })
        .expect(403, done);
    });
  });

  describe('#login()', function() {
    it('should redirect to /profile', function(done) {
      request(sails.hooks.http.app)
        .post('/login')
        .send({ email: 'test@test.eu', password: 'test123' })
        .expect(403, done);
    });
  });
});
