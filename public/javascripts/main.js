$(function () {

    var login = function () {
        $("#login").removeClass("hidden");
        $("#logout_button").addClass("hidden");
    };

    var start = function (token) {
        $("#logout_button").removeClass("hidden");
        $("#main").removeClass("hidden");

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
                $("#message")
                    .html("Door has been <b>open</b> for " + duration + ".")
                    .removeClass("alert-warning")
                    .removeClass("alert-default")
                    .addClass("alert-danger");
            } else if (state.status === 'closed') {
                $("#open_button").removeClass("hidden");
                $("#close_button").addClass("hidden");
                $("#message")
                    .html("Door is currently <b>closed</b>.")
                    .removeClass("alert-warning")
                    .addClass("alert-default")
                    .removeClass("alert-danger");
            } else if (state.status === 'moving') {
                $("#open_button").addClass("hidden");
                $("#close_button").addClass("hidden");
                $("#message")
                    .html("Door is currently <b>moving</b>.")
                    .addClass("alert-warning")
                    .removeClass("alert-default")
                    .removeClass("alert-danger");
            }
        };

        var updatePicture = function () {
            $("#webcam").attr("src","webcam.jpg?token=" + token + "&date=" + new Date().toISOString());
        };

        var updateCount = function (count) {
            $("#count").text(count);
        };

        var log = function (message) {
            var row = $("<tr></tr>");
            row.hide();
            row.append('<td>' +
                (new Date(message.date)).toLocaleDateString() + ' ' +
                (new Date(message.date)).toLocaleTimeString()
                + '</td>');

            if( message.operation === 'open') {
                row.append('<td><span class="label label-success">Open</span></td>');
            } else if (message.operation === 'close') {
                row.append('<td><span class="label label-danger">Close</span></td>');
            } else if (message.operation === 'login') {
                row.append('<td><span class="label label-info">Login</span></td>');
            } else if (message.operation === 'logout') {
                row.append('<td><span class="label label-primary">Logout</span></td>');
            } else {
                row.append('<td><span class="label label-default">' + _.escape(message.operation) + '</span></td>');
            }
            row.append('<td>' + _.escape(message.user) + '</td>');
            row.append('<td>' + _.escape(message.agent) + '</td>');
            $("#log").prepend(row);
            row.fadeIn();
        };

        // open socket
        var socket = io.connect('?token=' + token);
        socket.on("connect", function () {
            socket.on('state', updateState);
            socket.on('updatedPicture', updatePicture);
            socket.on('connectionCount', updateCount);
            socket.on('log', log);
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