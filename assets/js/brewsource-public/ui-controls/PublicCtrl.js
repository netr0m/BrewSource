angular.module('BrewSourcePublic').controller('PublicCtrl', ['$scope', '$http', '$location', 'toastr', function($scope, $http, $location, toastr) {

  /////////////////////////////////////////////////////////////////////////////////
  // When HTML is rendered
  /////////////////////////////////////////////////////////////////////////////////

  // Set up initial state
  $scope.signupForm = {
    loading: false,
    topLevelErrorMessage: '',
    validationErrors: []
  };

  $scope.loginForm = {
    loading: false,
    topLevelErrorMessage: ''
  };


  /////////////////////////////////////////////////////////////////////////////////
  // DOM events
  /////////////////////////////////////////////////////////////////////////////////


  $scope.submitLoginForm = function (){

    // Set the loading state (i.e. show loading spinner)
    $scope.loginForm.loading = true;

    // Wipe out errors since we are now loading from the server again and we aren't sure if
    // the current form values that were entered are valid or not.
    $scope.loginForm.topLevelErrorMessage = null;

    // Submit request to Sails.
    $http.put('/login', {
      email: $scope.loginForm.email,
      password: $scope.loginForm.password
    })
      .then(function onSuccess (){
        // Refresh the page now that we've been logged in.
        window.location = '/';
      })
      .catch(function onError(sailsResponse) {

        // Handle known error type(s).
        //
        console.log(sailsResponse);

        // Invalid username / password combination.
        if (sailsResponse.status === 400 || 404) {
          toastr.error('Invalid email/password combination.', undefined, {
            closeButton: false
          });
          return;
        }

        // Otherwise, display generic error if the error is unrecognized.
        // $scope.loginForm.topLevelErrorMessage = 'An unexpected error occurred: '+(sailsResponse.data||sailsResponse.status);

      })
      .finally(function eitherWay(){
        $scope.loginForm.loading = false;
      });
  };



  $scope.submitSignupForm = function (){

    // Set the loading state (i.e. show loading spinner)
    $scope.signupForm.loading = true;

    // Wipe out errors since we are now loading from the server again and we aren't sure if
    // the current form values that were entered are valid or not.
    $scope.signupForm.validationErrors = [];
    $scope.signupForm.topLevelErrorMessage = null;

    // Submit request to Sails.
    $http.post('/signup', {
      name: $scope.signupForm.name,
      email: $scope.signupForm.email,
      password: $scope.signupForm.password
    })
      .then(function onSuccess (){
        // Refresh the page now that we've been logged in.
        window.location = '/';
      })
      .catch(function onError(sailsResponse) {

        console.log(sailsResponse);

        // Handle known error type(s).
        var emailAddressAlreadyInUse = sailsResponse.status == 409;
        if (emailAddressAlreadyInUse) {
          toastr.error('Email address already in use.', undefined);
          return;
        }

        if (sailsResponse.data.raw.code === 11000) {
          toastr.error('Email address already in use.', undefined);
        }
      })
      .finally(function eitherWay(){
        $scope.signupForm.loading = false;
      });
  };

}]);
