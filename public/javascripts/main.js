$(function () {

    var login = function() {
        $("#login").removeClass("hidden");
    }

    var start = function(token) {
        $("#main").removeClass("hidden");
        var socket = io.connect('?token=' + token);
        socket.on("connect", function() {
            // Login code goes here?
            socket.emit('auth');
        });
    };

    if (!$.jStorage.get('token')) {
        login();
    } else {
        start();
    }

    $("#login_button").click(function(){
        $.post("/login", {
            username: $("input#username").val(),
            password: $("input#password").val()
        }, function (data, status, xhr) {
            if (data.status) {
                $.jStorage.set("token", data.token);
                $("#login").addClass("hidden");
                start();
            } else {
                $("input#password").val('');
                $("#login_message").text(data.message).removeClass("hidden");
            }
        });
        return false;
    });
});