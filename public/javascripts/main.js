$(function () {

    var tick = function() {
    };

    setInterval(function() {
      tick();
    }, 1000);

    var login = function () {
        $("#login").removeClass("hidden");
        $("#logout_button").addClass("hidden");
    };

    var start = function (token) {
        $("#logout_button").removeClass("hidden");
        $("#main").removeClass("hidden");

        var updateState = function (state) {
            if (state.status === 'open') {
                var start = new Date();
                tick = function() {
                  var duration = state.duration + Math.round((new Date().getTime() - start.getTime())/1000);
                  if (duration > 60) {
                      $("#message").html("Door has been <b>open</b> for " + Math.round(duration/60) + " minutes and " + Math.round(duration % 60)+ " seconds.")
                  } else {
                      $("#message").html("Door has been <b>open</b> for " + duration + " seconds.")
                  }

                };
                tick();
                $("#open_button").addClass("hidden");
                $("#close_button").removeClass("hidden");
                $("#message")
                    .removeClass("alert-warning")
                    .removeClass("alert-info")
                    .addClass("alert-danger");
            } else if (state.status === 'closed') {
                tick = function() {};
                $("#open_button").removeClass("hidden");
                $("#close_button").addClass("hidden");
                $("#message")
                    .html("Door is currently <b>closed</b>.")
                    .removeClass("alert-warning")
                    .addClass("alert-info")
                    .removeClass("alert-danger");
            } else if (state.status === 'moving') {
                tick = function() {};
                $("#open_button").addClass("hidden");
                $("#close_button").addClass("hidden");
                $("#message")
                    .html("Door is currently <b>moving</b>.")
                    .addClass("alert-warning")
                    .removeClass("alert-info")
                    .removeClass("alert-danger");
            }
        };

        var updatePicture = function () {
            $("#webcam").attr("src","webcam.jpg?token=" + token + "&date=" + new Date().toISOString());
        };

        var updateCount = function (count) {
            $("#count").text(count);
        };

        var buildLogRow = function(message) {

        }

        var log = function (message, append) {
            var row = $("<tr></tr>");

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
            } else if (message.operation === 'notice') {
                row.append('<td><span class="label label-warning">Notice</span></td>');
            } else {
                row.append('<td><span class="label label-default">' + _.escape(message.operation) + '</span></td>');
            }
            row.append('<td>' + _.escape(message.user) + '</td>');
            row.append('<td>' + _.escape(message.message) + '</td>');
            row.append('<td>' + _.escape(message.agent) + '</td>');

            if (append) {
                $("#log").append(row);
            } else {
                row.hide();
                $("#log").prepend(row);
                row.fadeIn();
            }
        };

        // open socket
        var socket = io.connect('?token=' + token);
        socket.on('state', updateState);
        socket.on('updatedPicture', updatePicture);
        socket.on('connectionCount', updateCount);
        socket.on('log', log);
        socket.on('logStart', function(data) {
            _.each(data, function(m) {log(m, true);})
        });
        socket.on("connect", function () {
            $("button").removeClass("disabled") ;
            $("#log > tr").remove();
        });
        socket.on("disconnect", function() {
           $("button").addClass("disabled") ;
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
