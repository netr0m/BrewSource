/**
 * BrewSourcePublic
 *
 * An angular module for BrewSource's "frontoffice" pages (like `signup.ejs` or `homepage.ejs`)
 *
 * Usage:
 * ```
 * <div ng-app="BrewSourcePublic"></div>
 * ```
 */

angular.module('BrewSourcePublic', ['ngRoute', 'toastr', 'compareTo']);


angular.module('BrewSourcePublic')
  .config(['toastrConfig', function (toastrConfig) {
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
      timeOut: 4000,
      titleClass: 'toast-title',
      toastClass: 'toast'
    });
  }]);


// Set up all of our HTTP requests to use a special header
// which contains the CSRF token.
// More about CSRF here: http://sailsjs.org/#/documentation/concepts/Security/CSRF.html
angular.module('BrewSourcePublic')
  .config(['$httpProvider', function ($httpProvider) {

    // Set the X-CSRF-Token header on every http request.
    // (this doesn't take care of sockets!  We do that elsewhere.)
    $httpProvider.defaults.headers.common['X-CSRF-Token'] = window.SAILS_LOCALS._csrf;
  }]);


// Listen for url fragment changes like "#/foo/bar-baz" so we can change the contents
// of the <ng-view> tag (if it exists)
angular.module('BrewSourcePublic')
  .config(['$routeProvider', function ($routeProvider) {

    $routeProvider

      .when('/about', {
        templateUrl: 'templates/public/about.html'
      })

      .otherwise({
        redirectTo: '/'
      });
  }]);
