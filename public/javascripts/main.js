$(function () {
    var socket = io();
    $("#button").removeClass("hidden");
    $("#button").click(function() {
        socket.emit("open", {});
    })
});