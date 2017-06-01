angular.module('BrewSourceDashboard', ['ngRoute', 'toastr']);

angular.module('BrewSourceDashboard')
  .config(['toastrConfig',function(toastrConfig) {
    angular.extend(toastrConfig, {
      allowHtml: true,
      closeButton: false,
      closeHtml: '<button>&times;</button>',
      containerId: 'toast-container',
      extendedTimeOut: 1000,
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      },
      messageClass: 'toast-message',
      positionClass: 'toast-top-right',
      tapToDismiss: true,
      timeOut: 2000,
      titleClass: 'toast-title',
      toastClass: 'toast'
    });
  }]);


// Set up all of our HTTP requests to use a special header
// which contains the CSRF token.
angular.module('BrewSourceDashboard')
  .config(['$httpProvider', function($httpProvider){

    // Set the X-CSRF-Token header on every http request.
    // (this doesn't take care of sockets!  We do that elsewhere.)
    $httpProvider.defaults.headers.common['X-CSRF-Token'] = window.SAILS_LOCALS._csrf;
  }]);

/**
 * Time ago filter.
 *
 */
angular.module('BrewSourceDashboard')

  .filter('timeAgo', function() {

    var timeAgoFilter = function (date) {
      return moment(date).fromNow();
    };

    return timeAgoFilter;

  })


// Listen for url fragment changes like "#/foo/bar-baz" so we can change the contents
// of the <ng-view> tag (if it exists)
angular.module('BrewSourceDashboard')
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider

    // #/    (i.e. ng-view's "home" state)
      .when('/', {
        template: '',
        // If the current user is an admin, "redirect" (client-side) to `#/users`.
        // Otherwise redirect to `#/profile`
        controller: ['$scope', '$location', function($scope, $location) {
          if ($scope.me.isAdmin) {

            $location.path('/users');
            $location.replace();
            return;
          }

          // Client-side redirect to `#/profile`
          $location.path('/profile');
          $location.replace();
          return;
        }]
      })


      // #/users
      .when('/users', {
        templateUrl: 'templates/dashboard/users.html',
        // Don't allow non-admins to access #/users.
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {
          if (!$scope.me.isAdmin) {
            $location.path('/');
            $location.replace();
            return;
          }

          // Send request to Sails to fetch list of users.
          // (Note that this endpoint also subscribes us to each of those user records,
          //  and watches the User model)
          $scope.userList.loading = true;
          $scope.userList.errorMsg = '';
          io.socket.get('/users', function (data, jwr) {
            if (jwr.error) {
              // Display generic error, since there are no expected errors.
              $scope.userList.errorMsg = 'An unexpected error occurred: ' + (data||jwr.status);

              // Hide loading spinner
              $scope.userList.loading = false;
              return;
            }
            // Populate the userList with the newly fetched users.
            $scope.userList.contents = data;

            // Initially set `isActive` on the user referred to by `$scope.me`
            // because if you're loading this page, your user must be active.
            var currentUser = _.find($scope.userList.contents, {id: $scope.me.id});
            currentUser.isActive = true;

            // Also initially set `msUntilInactive` to whatever the server told us
            // on any user marked as `isActive` by the server.
            var activeUsers = _.each($scope.userList.contents, function (user){
              if (user.msUntilInactive > 0){
                user.isActive = true;
              }
            });

            // Hide loading spinner
            $scope.userList.loading = false;

            // Because `io.socket.on` isn't `io.socket.$on` or something
            // we have to do this to render our changes into the DOM.
            $scope.$apply();
          });
        }]
      })


      // #/users/:id
      .when('/users/:id', {
        templateUrl: 'templates/dashboard/show-user.html',
        controller: ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {
          // Don't allow non-admins to access #/users/:id.
          if (!$scope.me.isAdmin) {
            $location.path('/');
            $location.replace();
            return;
          }

          // Lookup user with the specified id from the server
          $scope.userProfile.loading = false;
          $scope.userProfile.errorMsg = '';
          io.socket.get('/users/'+$routeParams.id, function onResponse(data, jwr){
            if (jwr.error) {
              $scope.userProfile.errorMsg = data||jwr.status;
              $scope.userProfile.loading = false;
              return;
            }
            angular.extend($scope.userProfile.properties, data);
            $scope.userProfile.loading = false;
            $scope.$apply();
          });
        }]
      })


      // #/users/:id/edit
      .when('/users/:id/edit', {
        templateUrl: 'templates/dashboard/edit-user.html',
        controller: ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {
          // Don't allow non-admins to access #/users/:id/edit.
          if (!$scope.me.isAdmin) {
            $location.path('/');
            $location.replace();
            return;
          }


          // Lookup user with the specified id from the server
          $scope.userProfile.loading = false;
          $scope.userProfile.errorMsg = '';
          $http.get('/users/'+$routeParams.id)
            .then(function onSuccess(res){
              // TODO FIX THIS
              if(localStorage.getItem("reload") != "1"){
                localStorage.setItem("reload","1");
                window.location.reload();
              }
              else{
                localStorage.removeItem("reload");
              }
              angular.extend($scope.userProfile.properties, res.data);
            })
            .catch(function onError(res){
              $scope.userProfile.errorMsg = res.data||res.status;
            })
            .finally(function eitherWay(){
              $scope.userProfile.loading = false;
            });
        }]
      })

      // #/profile
      .when('/profile', {
        templateUrl: 'templates/dashboard/show-user.html',
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {

          // We already have this data in $scope.me, so we don't need to show a loading state.
          $scope.userProfile.loading = false;

          // We only talk to the server here in order to subscribe to ourselves
          io.socket.get('/users/'+$scope.me.id, function onResponse(data, jwr){
            if (jwr.error){
              console.error('Unexpected error from Sails:', jwr.error);
              return;
            }
            // angular.extend($scope.userProfile.properties, res.data);
          });

          // Pass `$scope.me` in to `$scope.userProfile`
          angular.extend($scope.userProfile.properties, $scope.me);

        }]
      })

      // #/profile/edit
      .when('/profile/edit', {
        templateUrl: 'templates/dashboard/my-profile.html',
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {

          // We already have this data in $scope.me, so we don't need to show a loading state.
          $scope.userProfile.loading = false;

          // We only talk to the server here in order to subscribe to ourselves
          io.socket.get('/users/'+$scope.me.id, function onResponse(data, jwr){
            if (jwr.error){
              console.error('Unexpected error from Sails:', jwr.error);
              return;
            }
          });

          // Pass `$scope.me` in to `$scope.userProfile`
          // TODO FIX THIS
          if(localStorage.getItem("reload") != "1"){
            localStorage.setItem("reload","1");
            window.location.reload();
          }
          else{
            localStorage.removeItem("reload");
          }
          angular.extend($scope.userProfile.properties, $scope.me);

        }]
      })

      // /breweries/new
      .when('/breweries/new', {
        templateUrl: 'templates/dashboard/create-brewery.html',
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {

          // TODO FIX THIS
          if(localStorage.getItem("reload") != "1"){
            localStorage.setItem("reload","1");
            window.location.reload();
          }
          else{
            localStorage.removeItem("reload");
          }
          angular.extend($scope.userProfile.properties, $scope.me);
        }]
      })


      // #/breweries
      .when('/breweries', {
        templateUrl: 'templates/dashboard/my-breweries.html',
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {

          // Send request to Sails to fetch list of breweries.
          $scope.userBreweryList.loading = true;
          $scope.userBreweryList.errorMsg = '';
          io.socket.get('/breweries', function(data, jwr) {
            if (jwr.error) {
              // Display generic error, since there are no expected errors.
              $scope.userBreweryList.errorMsg = 'An unexpected error occurred: ' + (data||jwr.status);

              // Hide loading spinner
              $scope.userBreweryList.loading = false;
              return;
            }

            // Populate the userBreweryList with the newly fetched breweries
            $scope.userBreweryList.contents = data;

            // Hide loading spinner
            $scope.userBreweryList.loading = false;

            // render changes into the DOM
            $scope.$apply();
          });
        }]
      })


      // #/breweries/:id
      .when('/breweries/:id', {
        templateUrl: 'templates/dashboard/show-brewery.html',
        controller: ['$scope', '$location', '$routeParams', '$http', '$route', function($scope, $location, $routeParams, $http, $route) {

          // Lookup brewery with the specified id from the server
          $scope.userBrewery.loading = false;
          $scope.userBrewery.errorMsg = '';
          io.socket.get('/breweries/' + $routeParams.id, function onResponse(data, jwr) {
            if (jwr.error) {
              $scope.userBrewery.errorMsg = data||jwr.status;
              $scope.userBrewery.loading = false;
              return;
            }
            angular.extend($scope.userBrewery.properties, data);

            $scope.breweryBatchList.loading = true;
            $scope.breweryBatchList.errorMsg = '';
            io.socket.get('/batches', function(batchData, jwr) {
              if (jwr.error) {
                // Display generic error, since there are no expected errors.
                $scope.breweryBatchList.errorMsg = 'An unexpected error occurred: ' + (batchData||jwr.status);

                // Hide loading spinner
                $scope.breweryBatchList.loading = false;
                return;
              }

              // Populate the userBreweryList with the newly fetched breweries
              $scope.breweryBatchList.contents = batchData;

              // Hide loading spinner
              $scope.breweryBatchList.loading = false;

              // render changes into the DOM
              $scope.$apply();
            });

            $scope.userBrewery.loading = false;
            // A VERY temporary fix for issues with Material Design not loading properly through angular
            // TODO FIX THIS
            if(localStorage.getItem("reload") != "1"){
              localStorage.setItem("reload","1");
              window.location.reload();
            }
            else{
              localStorage.removeItem("reload");
            }
            $scope.$apply();
          });
        }]
      })


      // #/breweries/:id/edit
      .when('/breweries/:id/edit', {
        templateUrl: 'templates/dashboard/edit-brewery.html',
        controller: ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {
          // Lookup brewery with the specified id from the server
          $scope.userBrewery.loading = false;
          $scope.userBrewery.errorMsg = '';
          $http.get('/breweries/' + $routeParams.id)
            .then(function onSuccess(res) {
              // TODO FIX THIS
              if(localStorage.getItem("reload") != "1"){
                localStorage.setItem("reload","1");
                window.location.reload();
              }
              else{
                localStorage.removeItem("reload");
              }
              angular.extend($scope.userBrewery.properties, res.data);
            })
            .catch(function onError(res) {
              $scope.userBrewery.errorMsg = res.data||res.status;
            })
            .finally(function eitherWay() {
              $scope.userBrewery.loading = false;
            });
        }]
      })

      // /batches/new
      .when('/batches/new', {
        templateUrl: 'templates/dashboard/create-batch.html',
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {

          // TODO FIX THIS
          if(localStorage.getItem("reload") != "1"){
            localStorage.setItem("reload","1");
            window.location.reload();
          }
          else{
            localStorage.removeItem("reload");
          }
          angular.extend($scope.userProfile.properties, $scope.me);
        }]
      })


      // #/batches
      .when('/batches', {
        templateUrl: 'templates/dashboard/my-batches.html',
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {

          // Send request to Sails to fetch list of breweries.
          $scope.breweryBatchList.loading = true;
          $scope.breweryBatchList.errorMsg = '';
          io.socket.get('/batches', function(data, jwr) {
            if (jwr.error) {
              // Display generic error, since there are no expected errors.
              $scope.breweryBatchList.errorMsg = 'An unexpected error occurred: ' + (data||jwr.status);

              // Hide loading spinner
              $scope.breweryBatchList.loading = false;
              return;
            }

            // Populate the userBreweryList with the newly fetched breweries
            $scope.breweryBatchList.contents = data;

            // Hide loading spinner
            $scope.breweryBatchList.loading = false;

            // render changes into the DOM
            $scope.$apply();
          });
        }]
      })


      // #/batches/:id
      .when('/batches/:id', {
        templateUrl: 'templates/dashboard/show-batch.html',
        controller: ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {

          // Lookup batch with the specified id from the server
          $scope.breweryBatch.loading = false;
          $scope.breweryBatch.errorMsg = '';
          io.socket.get('/batches/' + $routeParams.id, function onResponse(data, jwr) {
            if (jwr.error) {
              $scope.breweryBatch.errorMsg = data||jwr.status;
              $scope.breweryBatch.loading = false;
              return;
            }
            angular.extend($scope.breweryBatch.properties, data);
            $scope.breweryBatch.loading = false;
            // A VERY temporary fix for issues with Material Design not loading properly through angular
            // TODO FIX THIS
            if(localStorage.getItem("reload") != "1"){
              localStorage.setItem("reload","1");
              window.location.reload();
            }
            else{
              localStorage.removeItem("reload");
            }
            $scope.$apply();
          });
        }]
      })


      // #/batches/:id/edit
      .when('/batches/:id/edit', {
        templateUrl: 'templates/dashboard/edit-batch.html',
        controller: ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {
          // Lookup batch with the specified id from the server
          $scope.breweryBatch.loading = false;
          $scope.breweryBatch.errorMsg = '';
          $http.get('/batches/' + $routeParams.id)
            .then(function onSuccess(res) {
              // TODO FIX THIS
              if(localStorage.getItem("reload") != "1"){
                localStorage.setItem("reload","1");
                window.location.reload();
              }
              else{
                localStorage.removeItem("reload");
              }
              angular.extend($scope.breweryBatch.properties, res.data);
            })
            .catch(function onError(res) {
              $scope.breweryBatch.errorMsg = res.data||res.status;
            })
            .finally(function eitherWay() {
              $scope.breweryBatch.loading = false;
            });
        }]
      })

      // #/batchTemps
      .when('/batchTemps', {
        templateUrl: '',
        controller: ['$scope', '$location', '$http', function($scope, $location, $http) {

          // Send request to Sails to fetch list of breweries.
          $scope.batchTempList.loading = true;
          $scope.batchTempList.errorMsg = '';
          io.socket.get('/batchTemps', function(data, jwr) {
            if (jwr.error) {
              // Display generic error, since there are no expected errors.
              $scope.batchTempList.errorMsg = 'An unexpected error occurred: ' + (data||jwr.status);

              // Hide loading spinner
              $scope.batchTempList.loading = false;
              return;
            }

            // Populate the batchTempList with the newly fetched temperatures
            $scope.batchTempList.contents = data;

            // Hide loading spinner
            $scope.batchTempList.loading = false;

            // render changes into the DOM
            $scope.$apply();
          });
        }]
      })


      // #/batchTemps/:id
      .when('/batchTemps/:id', {
        templateUrl: '',
        controller: ['$scope', '$location', '$routeParams', '$http', function($scope, $location, $routeParams, $http) {

          // Lookup batch with the specified id from the server
          $scope.batchTemp.loading = false;
          $scope.batchTemp.errorMsg = '';
          io.socket.get('/batchTemps/' + $routeParams.id, function onResponse(data, jwr) {
            if (jwr.error) {
              $scope.batchTemp.errorMsg = data||jwr.status;
              $scope.batchTemp.loading = false;
              return;
            }
            angular.extend($scope.batchTemp.properties, data);
            $scope.batchTemp.loading = false;
            $scope.$apply();
          });
        }]
      })

      // #/about
      .when('/about', {
        templateUrl: 'templates/public/about.html'
      })

      // #/?????     (i.e. anything else)
      .otherwise({
        redirectTo: '/'
      });

  }]);
