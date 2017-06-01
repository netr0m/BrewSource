angular.module('BrewSourceDashboard').controller('DashboardCtrl', ['$scope', '$http', 'toastr', '$interval', function($scope, $http, toastr, $interval) {

  // Just a hack so we can type `SCOPE` in the Chrome inspector.
  SCOPE=$scope;

  /////////////////////////////////////////////////////////////////////////////////
  // When HTML is rendered
  /////////////////////////////////////////////////////////////////////////////////

  // Set up initial objects

  /**
   * Attributes for models
   */

  // Userprofile attributes etc.
  $scope.userProfile = {
    properties: {},
    errorMsg: '',
    saving: false,
    loading: false
  };

  // Brewery attributes etc.
  $scope.userBrewery = {
    properties: {},
    errorMsg: '',
    saving: false,
    loading: false
  };

  // Batch attributes etc.
  $scope.breweryBatch = {
    properties: {},
    errorMsg: '',
    saving: false,
    loading: false
  };

  // Batch temperature attributes etc.
  $scope.batchTemp = {
    properties: {},
    errorMsg: '',
    saving: false,
    loading: false
  };

  /**
   * Lists of objects
   */

  // List of users
  $scope.userList = {
    loading: false,
    errorMsg: '',
    contents: []
  };

  // List of breweries
  $scope.userBreweryList = {
    loading: false,
    errorMsg: '',
    contents: []
  };

  // List of batches
  $scope.breweryBatchList = {
    loading: false,
    errorMsg: '',
    contents: []
  };

  // List of temperatures
  $scope.batchTempList = {
    loading: false,
    errorMsg: '',
    contents: []
  };

  /**
   * Forms for creation, change
   */

  // Form for changing your password
  $scope.changePasswordForm = {
    saving: false,
    errorMsg: '',
    properties: {}
  };

  // Form for creating a new brewery
  $scope.newBreweryForm = {
    loading: false,
    topLevelErrorMessage: '',
    validationErrors: []
  };

  // Form for creating a new batch
  $scope.newBatchForm = {
    loading: false,
    topLevelErrorMessage: '',
    validationErrors: []
  };

  // Pull representation of the current visitor from data bootstrapped into the
  // EJS view from the server (i.e. `SAILS_LOCALS`)
  $scope.me = window.SAILS_LOCALS.me;


  // Let Sails know we've come online.
  io.socket.put('/me/online', {
    _csrf: window.SAILS_LOCALS._csrf
  }, function(unused,jwr) {
    if (jwr.error){
      console.error('Error announcing new socket connection to Sails:',jwr);
      return;
    }

    // OK! Now Sails knows we're online.
  });



  /////////////////////////////////////////////////////////////////////////////////
  // Set up a client-side timer
  /////////////////////////////////////////////////////////////////////////////////

  var REFRESH_ONLINE_STATUS_INTERVAL = 250;
  $interval(function refreshOnlineStatus() {

    // Loop through users on the page, decrement `msUntilInactive`, and then
    // mark them accordingly (as isActive false or true)
    _.each($scope.userList.contents, function(user) {

      // Decrement # of milliseconds until this user is flagged as inactive
      user.msUntilInactive = user.msUntilInactive || 0;
      user.msUntilInactive -= REFRESH_ONLINE_STATUS_INTERVAL;
      if (user.msUntilInactive < 0) {
        user.msUntilInactive = 0;
      }

      if (user.msUntilInactive > 0) {
        user.isActive = true;
      } else {
        user.isActive = false;
      }
    });

  }, REFRESH_ONLINE_STATUS_INTERVAL);


  /////////////////////////////////////////////////////////////////////////////////
  // Listen for socket (server-sent) events:
  /////////////////////////////////////////////////////////////////////////////////

  // When a "user" event is emitted from the server
  // (i.e. a controller or blueprint action calls `User.publishUpdate()`,
  //  `User.publishCreate`, etc.)
  io.socket.on('user', function(event) {
    //console.log(event);

    if (event.verb === 'updated') {

      // Look up the user in our list of users
      var foundUser = _.find($scope.userList.contents, {id: event.id});
      if (foundUser) {
        // And update it with the new information from the server.
        _.extend(foundUser, event.data);
      }

      var message;
      // If the event data contains `justBecameActive`,
      // (i.e. the object passed to publishUpdate() on the backend contained `justBecameActive`)
      // we're going to show a special toastr message and set `msUntilInactive` based on what
      // was provided by the server
      if (event.data.justBecameActive) {

        // No matter what, show a quiet message indicating that another user is doing stuff.
        // toastr.info((event.data.name||'A user')+' is hanging around.');

        // If we've got the user on the page, we'll take it a step further.
        if (foundUser) {
          foundUser.msUntilInactive = event.data.msUntilInactive;

          // Only show our toastr message and play a sound if the user wasn't already active
          if (!foundUser.isActive) {
            toastr.info((event.data.name||'A user')+' just became active.', undefined, {closeButton: false});
            document.getElementById('chatAudio').play();
          }
        }
      }
      // If the event data contains `justLoggedOut`,
      // (i.e. the object passed to publishUpdate() on the backend contained `justLoggedOut`)
      // we're going to show a special toastr message.
      else if (event.data.justLoggedOut){

        // Show our toastr message
        toastr.info((event.data.name||'A user')+' just logged out.');
        // Play a sound
        document.getElementById('chatAudio').play();
      }
      // Otherwise this is just a normal update:
      else {

        // If WE are the user undergoing the update, set $scope.me to reflect the changes.
        if (event.id === $scope.me.id) {
          _.extend($scope.me, event.data);
        }

        // If $scope.userProfile contains the user that was updated, we'll change it
        // to reflect the new stuff from the server
        if (event.id === $scope.userProfile.properties.id) {
          _.extend($scope.userProfile.properties, event.data);
        }

        // Show our toastr message
        toastr.success((event.data.name||'A user')+ ' has been updated.');
        // Play a sound
        document.getElementById('chatAudio').play();
      }

      // Finally, in any case...
      //
      // Because `io.socket.on` isn't `io.socket.$on` or something
      // we have to do this to render our changes into the DOM.
      $scope.$apply();
      return;
    }

    if (event.verb === 'created') {
      $scope.userList.contents.push(event.data);

      toastr.success((event.data.name||'A user')+ ' has been created.');

      // Because `io.socket.on` isn't `io.socket.$on` or something
      // we have to do this to render our changes into the DOM.
      $scope.$apply();
      return;
    }

    if (event.verb === 'destroyed') {
      // Remove destroyed user from the DOM
      _.remove($scope.userList.contents, {id: event.id});

      // Send message to user that a user has been deleted.
      toastr.success((event.previous.name||'A user')+ ' has been deleted.');
      document.getElementById('chatAudio').play();

      // Because `io.socket.on` isn't `io.socket.$on` or something
      // we have to do this to render our changes into the DOM.
      $scope.$apply();
      return;
    }

    throw new Error('Unexpected/unknown socket event: "'+event.verb+'" received from Sails.');
  });



  /////////////////////////////////////////////////////////////////////////////////
  // DOM events
  /////////////////////////////////////////////////////////////////////////////////

  // Bind onmousemove listener to window
  $(window).mousemove(_.throttle(function whenMouseMoves() {

    // Let Sails know we've come online.
    io.socket.put('/me/online', {
      _csrf: window.SAILS_LOCALS._csrf
    }, function(unused,jwr) {
      if (jwr.error) {
        console.error('Error announcing new socket connection to Sails:',jwr);
        return;
      }

      // OK! Now Sails knows we're online.
    });
  }, 3000));

  /**
   * Management of User(s)
   */

  $scope.editMyProfile = function() {

    // Set loading ("saving") state
    $scope.userProfile.saving = true;
    $scope.userProfile.errorMsg = '';

    // Send request to Sails to edit the specified user.
    return $http.put('/me', {
      name: $scope.userProfile.properties.name,
      email: $scope.userProfile.properties.email,
      admin: $scope.userProfile.properties.admin
    })
      .then(function onSuccess(sailsResponse) {
        console.log(sailsResponse);

        // Update `$scope.me` to reflect the changes to our profile.
        // (e.g. in the top right corner)
        $scope.me.name = sailsResponse.data.name;

      })
      .catch(function onError(sailsResponse) {

        // Handle known error type(s).
        var emailAddressAlreadyInUse = !sailsResponse.data && sailsResponse.data.error !== 'E_VALIDATION';
        if (emailAddressAlreadyInUse) {
          $scope.userProfile.errorMsg = 'Email address already in use.';
          return;
        }

        // Otherwise, display generic error if the error is unrecognized.
        $scope.userProfile.errorMsg = 'An unexpected error occurred: '+(sailsResponse.data||sailsResponse.status);
      })
      .finally(function eitherWay() {
        $scope.userProfile.saving = false;
      });
  };


  /**
   * Our user signaled their intent to change their password
   */
  $scope.changeMyPassword = function() {

    // Set loading ("saving") state
    $scope.changePasswordForm.saving = true;
    $scope.changePasswordForm.errorMsg = '';

    // Send request to Sails to delete the specified user.
    return $http.put('/me', {
      password: $scope.changePasswordForm.properties.password
    })
      .then(function onSuccess(sailsResponse) {
        // Everything is OK.
      })
      .catch(function onError(sailsResponse) {
        $scope.changePasswordForm.errorMsg = 'An unexpected error occurred: '+(sailsResponse.data||sailsResponse.status);
      })
      .finally(function eitherWay() {
        $scope.changePasswordForm.saving = false;
      });
  };

  /**
   * Our user signaled their intent to edit a user.
   */
  $scope.editUser = function(userId){

    // Set loading ("saving") state
    $scope.userProfile.saving = true;
    $scope.userProfile.errorMsg = '';

    // Send request to Sails to delete the specified user.
    return $http.put('/users/'+userId, {
      name: $scope.userProfile.properties.name,
      email: $scope.userProfile.properties.email,
      admin: $scope.userProfile.properties.admin
    })
      .then(function onSuccess(sailsResponse){
        // Everything is OK.
      })
      .catch(function onError(sailsResponse){

        // Handle known error type(s).
        var emailAddressAlreadyInUse = !sailsResponse.data && sailsResponse.data.error !== 'E_VALIDATION';
        if (emailAddressAlreadyInUse) {
          $scope.userProfile.errorMsg = 'Email address already in use.';
          return;
        }

        // Otherwise, display generic error if the error is unrecognized.
        $scope.userProfile.errorMsg = 'An unexpected error occurred: '+(sailsResponse.data||sailsResponse.status);
      })
      .finally(function eitherWay(){
        $scope.userProfile.saving = false;
      });
  };

  /**
   * Our user signaled their intent to delete another user.
   */
  $scope.deleteUser = function(otherUserId) {

    // Get a reference to the user row on the $scope so we can set
    // loading ("deleting") state.
    var $otherUser = _.find($scope.userList.contents, { id: otherUserId });

    // Set loading ("deleting") state
    $otherUser.deleting = true;

    // Send request to Sails to delete the specified user.
    $http.delete('/users/'+otherUserId)
      .then(function onSuccess(sailsResponse) {

        // User deleted successfully from server- now we'll remove it
        // from `$scope.userList.contents` to clear it from the DOM.
        _.remove($scope.userList.contents, {
          id: otherUserId
        });
      })
      .catch(function onError(sailsResponse) {
        // the `''+` is just to cast the error to a string
        var errMsg = ''+(sailsResponse.data||sailsResponse.status);
        toastr.error(errMsg);
      })
      .finally(function eitherWay() {
        // Disable loading state (if still relevant)
        if (!$otherUser) return;
        $otherUser.deleting = false;
      });
  };

  /**
   * Management of breweries
   */

  /**
   * Our user signaled their intent to edit a brewery.
   */
  $scope.editBrewery = function(breweryId) {

    // TODO only allow the owner to edit a brewery

    // Set loading ("Saving") state
    $scope.userBrewery.saving = true;
    $scope.userBrewery.errorMsg = '';

    // Send request to Sails to edit the specified brewery.
    return $http.put('/breweries/' + breweryId, {
      name: $scope.userBrewery.properties.name,
      location: $scope.userBrewery.properties.location,
      owner: $scope.me.id
    })
      .then(function onSuccess(sailsResponse) {
        // Everything is OK.
      })
      .catch(function onError(sailsResponse) {

        // Handle errors (no known error types, so display a generic error
        $scope.userBrewery.errorMsg = 'An unexpected error occurred: ' + (sailsResponse.data||sailsResponse.status);
      })
      .finally(function eitherWay() {
        $scope.userBrewery.saving = false;
      });
  };

  /**
   * Our user signaled their intent to delete a brewery.
   */
  $scope.deleteBrewery = function(breweryId) {

    // TODO only allow the owner to delete a brewery

    // Get a reference to the user row on the $scope so we can set
    // loading ("deleting") state.
    var $aBrewery = _.find($scope.userBreweryList.contents, { id: breweryId });

    // Set loading ("deleting") state
    $aBrewery.deleting = true;

    // Send a reques to Sails to delete the specified brewery.
    $http.delete('/breweries/' + breweryId)
      .then(function onSuccess(sailsResponse) {

        // User deleted successfully from server - now we'll remove it
        // from '$scope.userBreweryList.contents' to clear it from the DOM.
        _.remove($scope.userBreweryList.contents, {
          id: breweryId
        });
      })
      .catch(function onError(sailsResponse) {
        // the "''+" is just to cast the error to a string
        var errMsg = ''+(sailsResponse.data||sailsResponse.status);
        toastr.error(errMsg);
      })
      .finally(function eitherWay() {
        // Disable loading state (if still relevant)
        if (!$aBrewery) return;
        $aBrewery.deleting = false;
      });
  };

  /**
   * Our user signaled their intent to create a brewery.
   */
  $scope.createBrewery = function(){

    // Set the loading state (i.e. show loading spinner)
    $scope.newBreweryForm.loading = true;

    // Wipe out errors since we are now loading from the server again and we aren't sure if
    // the current form values that were entered are valid or not.
    $scope.newBreweryForm.validationErrors = [];
    $scope.newBreweryForm.topLevelErrorMessage = null;

    // Submit request to Sails.
    $http.post('/breweries/new', {
      name: $scope.newBreweryForm.name,
      location: $scope.newBreweryForm.location,
      owner: $scope.me.id
    })
      .then(function onSuccess (){
        // Refresh the page now that we've been logged in.
        window.location = '#/breweries';
      })
      .catch(function onError(sailsResponse) {

        console.log(sailsResponse);
        toastr.error('An unexpected error occurred.', undefined);
      })
      .finally(function eitherWay(){
        $scope.newBreweryForm.loading = false;
      });
  };

  /**
   * Management of batches
   */

  /**
   * Our user signaled their intent to edit a batch.
   */
  $scope.editBatch = function(batchId) {

    // TODO only allow the owner to edit a batch

    // Set loading ("Saving") state
    $scope.breweryBatch.saving = true;
    $scope.breweryBatch.errorMsg = '';

    // Send request to Sails to edit the specified brewery.
    return $http.put('/batches/' + batchId, {
      name: $scope.breweryBatch.properties.name,
      idealTemp: $scope.breweryBatch.properties.idealTemp,
      owner: $scope.breweryBatch.properties.id
    })
      .then(function onSuccess(sailsResponse) {
        // Everything is OK.
      })
      .catch(function onError(sailsResponse) {

        // Handle errors (no known error types, so display a generic error
        $scope.breweryBatch.errorMsg = 'An unexpected error occurred: ' + (sailsResponse.data||sailsResponse.status);
      })
      .finally(function eitherWay() {
        $scope.breweryBatch.saving = false;
      });
  };

  /**
   * Our user signaled their intent to delete a batch.
   */
  $scope.deleteBatch = function(batchId) {

    // TODO only allow the owner to delete a batch

    // Get a reference to the user row on the $scope so we can set
    // loading ("deleting") state.
    var $aBatch = _.find($scope.breweryBatchList.contents, { id: batchId });

    // Set loading ("deleting") state
    $aBatch.deleting = true;

    // Send a request to Sails to delete the specified brewery.
    $http.delete('/batches/' + batchId)
      .then(function onSuccess(sailsResponse) {

        // User deleted successfully from server - now we'll remove it
        // from '$scope.breweryBatchList.contents' to clear it from the DOM.
        _.remove($scope.breweryBatchList.contents, {
          id: batchId
        });
      })
      .catch(function onError(sailsResponse) {
        // the "''+" is just to cast the error to a string
        var errMsg = ''+(sailsResponse.data||sailsResponse.status);
        toastr.error(errMsg);
      })
      .finally(function eitherWay() {
        // Disable loading state (if still relevant)
        if (!$aBatch) return;
        $aBatch.deleting = false;
      });
  };

  /**
   * Our user signaled their intent to create a batch.
   */
  $scope.createBatch = function(){

    // Set the loading state (i.e. show loading spinner)
    $scope.newBatchForm.loading = true;

    // Wipe out errors since we are now loading from the server again and we aren't sure if
    // the current form values that were entered are valid or not.
    $scope.newBatchForm.validationErrors = [];
    $scope.newBatchForm.topLevelErrorMessage = null;

    // Submit request to Sails.
    $http.post('/batches/new', {
      name: $scope.newBatchForm.name,
      idealTemp: $scope.newBatchForm.idealTemp,
      owner: $scope.newBatchForm.owner
    })
      .then(function onSuccess (){
        // Refresh the page now that we've been logged in.
        window.location = '#/batches';
      })
      .catch(function onError(sailsResponse) {

        console.log(sailsResponse);
        toastr.error('An unexpected error occurred.', undefined);
      })
      .finally(function eitherWay(){
        $scope.newBatchForm.loading = false;
      });
  };
}]);

