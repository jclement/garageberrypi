$(function () {

    var login = function() {
        $("#login").removeClass("hidden");
    };

    var start = function(token) {
        console.log('Starting');
        $("#main").removeClass("hidden");
        var socket = io.connect('?token=' + token);
        socket.on("connect", function() {
            console.log('connect');
            // Login code goes here?
            socket.emit('auth');
            socket.on('tick', function() {
                console.log('tick');
            });
        });

        $("#open_button").removeClass("hidden");

        $("#open_button").click(function() {
            socket.emit("open");
            return false;
        });

        $("#close_button").click(function() {
            socket.emit("close");
            return false;
        });
    };

    $("#login_button").click(function(){
        $.post("/auth/login", {
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
    $("#logout_button").click(function(){
        $.post("/auth/logout", {
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
    if ($.jStorage.get('token')){
        $.post("/auth/test", {
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