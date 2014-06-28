$(function () {

    var login = function () {
        $("#login").removeClass("hidden");
        $("#logout_button").addClass("hidden");
    };

    var start = function (token) {
        $("#logout_button").removeClass("hidden");
        var updateState = function (state) {
            if (state.status === 'open') {
                var duration;
                if (state.duration > 60) {
                    duration = Math.round(state.duration / 60) + ' minutes';
                } else {
                    duration = state.duration + ' seconds';
                }
                $("#open_button").addClass("hidden");
                $("#close_button").removeClass("hidden");
                $("#message").html("Door is currently <b>open</b> for " + duration + ".");
            } else if (state.status === 'closed') {
                $("#open_button").removeClass("hidden");
                $("#close_button").addClass("hidden");
                $("#message").html("Door is currently <b>closed</b>.");
            } else if (state.status === 'moving') {
                $("#open_button").addClass("hidden");
                $("#close_button").addClass("hidden");
                $("#message").html("Door is currently <b>moving</b>.");
            }
        };

        var updatePicture = function () {
            console.log('updatePicture');
        };

        var updateCount = function (count) {
            $("#count").text(count);
        };

        // Show main form body
        $("#main").removeClass("hidden");

        // open socket
        var socket = io.connect('?token=' + token);
        socket.on("connect", function () {
            socket.on('state', updateState);
            socket.on('updatedPicture', updatePicture);
            socket.on('connectionCount', updateCount);
        });

        $("#open_button").click(function () {
            socket.emit("open");
            return false;
        });

        $("#close_button").click(function () {
            socket.emit("close");
            return false;
        });
    };

    $("#login_button").click(function () {
            $.post("/api/auth/login", {
                username: $("input#username").val(),
                password: $("input#password").val()
            }, function (data, status, xhr) {
                if (data.status) {
                    $.jStorage.set("token", data.token);
                    $("#login").addClass("hidden");
                    start(data.token);
                } else {
                    $("input#password").val('');
                    $("#login_message").text(data.message).removeClass("hidden");
                }
            });
            return false;
        }
    );
    $("#logout_button").click(function () {
        $.post("/api/auth/logout", {
            token: $.jStorage.get('token')
        }, function (data, status, xhr) {
            if (data.status) {
                $.jStorage.deleteKey("token");
                window.location.reload();
            }
        });
        return false;
    });


    // Determine if we have a valid session
    if ($.jStorage.get('token')) {
        $.post("/api/auth/verify", {
            token: $.jStorage.get('token')
        }, function (data, status, xhr) {
            if (data.status) {
                start($.jStorage.get('token'));
            } else {
                login();
            }
        });
    } else {
        login();
    }
});