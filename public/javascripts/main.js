$(function () {
    var socket = io();
    socket.on("connect", function() {
        // Login code goes here?
        socket.emit('auth');
    });
    $("#button").removeClass("hidden");
    $("#button").click(function() {
        socket.emit("open", {});
    })
});