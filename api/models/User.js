/**
 * User.js
 *
 * @description :: Each record in this model represents a user's account in BrewSource.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {

    // The user's full name
    name: {
      type: 'string',
      required: true
    },

    // The user's email address
    email: {
      type: 'string',
      email: true,
      required: true,
      unique: true
    },

    // The encrypted password for the user
    encryptedPassword: {
      type: 'string'
    },

    // The timestamp of when the user was last "active"
    // (Whether they are online or not)
    lastActive: {
      type: 'date',
      required: true,
      defaultsTo: new Date(0)
    },

    // The timestamp of the last login
    lastLoggedIn: {
      type: 'date',
      required: true,
      defaultsTo: new Date(0)
    },

    // Whether the user is an admin or not
    admin: {
      type: 'boolean',
      defaultsTo: false
    },

    // Gravatar URL
    gravatarUrl: {
      type: 'string'
    },

    lastIP: {
      type: 'string'
    },

    // The breweries associated with this user
    breweries: {
      collection: 'brewery',
      via: 'owner'
    },
  }
};
