var app = angular.module('gbpApp', ['LocalStorageModule']);

app.config(['localStorageServiceProvider', function (localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix("gbp");
}]);

app.controller('gbpController', function ($http, $timeout, $interval, localStorageService) {

    var ctrl = this;

    /* ====== AUTHENTICATION =============================================== */

    var auth = null;

    (function () {
        // if we have pre-existing token, verify it to see if it's still good.
        var savedToken = localStorageService.get('auth');
        if (savedToken) {
            $http.post('api/auth/verify', {token: savedToken.token})
                .success(function (data) {
                    if (data.status) {
                        auth = savedToken;
                        start_refresh();

                    }
                })
        }
    })();

    ctrl.loginForm = {};
    ctrl.loginError = null;

    ctrl.user = function () {
        return auth && auth.username;
    };

    ctrl.isAuthenticated = function () {
        return !!auth;
    };

    ctrl.login = function () {
        ctrl.loginError = null;
        $http.post('api/auth/login', ctrl.loginForm)
            .success(function (data) {
                if (data.status) {
                    auth = {
                        token: data.token,
                        username: ctrl.loginForm.username
                    };
                    localStorageService.set('auth', auth);
                } else {
                  ctrl.loginError = data.message;
                }
                ctrl.loginForm = {};
                start_refresh();
            });
    };

    ctrl.logout = function () {
        auth = null;
        localStorageService.remove('auth');
    };

    /* ====== GBP MAIN =============================================== */

    ctrl.state = null;
    ctrl.working = false;

    // kick state every second so clock updates
    $interval(function () {}, 1000);
    var stateTimestamp = null;
    ctrl.readableDuration = function () {
        if (!ctrl.state || stateTimestamp === null) {
            return 'NA';
        }
        // duration in current state since at time of API call
        var duration = ctrl.state.duration;
        // + duration since laste API call
        duration += Math.round((new Date().getTime() - stateTimestamp.getTime()) / 1000);
        if (duration > 60) {
            return Math.round(duration / 60) + " minutes and " + (duration % 60) + " seconds"
        } else {
            return duration + " seconds"
        }
    };

    var start_refresh = function () {
        var refresh = function () {
            // assuming we are authenticated, pull status from service
            if (!auth) return;
            $http.post('api/garage/status', {token: auth.token, serial: ctrl.state && ctrl.state.serial})
                .success(function (data) {
                    ctrl.working = false;
                    stateTimestamp = new Date();
                    ctrl.state = data;
                    $timeout(refresh, 500);
                })
                .error(function () {
                    $timeout(refresh, 2000);
                });
        };
        refresh();
    };

    ctrl.open = function () {
        ctrl.working = true;
        $http.post('api/garage/open', {token: auth.token});
        return false;
    };

    ctrl.close = function () {
        ctrl.working = true;
        $http.post('api/garage/close', {token: auth.token});
        return false;
    };

});
