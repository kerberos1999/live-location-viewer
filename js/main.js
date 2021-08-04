

window.onload = function(){
    var conn;
    var gameLog = document.getElementById("gamelog");

    if(window["WebSocket"]){
        conn = new WebSocket("ws://" + document.location.host + "/ws");
        conn.onclose = function (e){
            gameLog.innerHTML += "<p><b>Connection closed!</b></p>";
        };
        conn.onmessage = function (e){
            gameLog.innerHTML += "<p>" + e.data + "</p>";
            console.log("received message! " + e.data);
        }
    }else{
        gameLog.innerHTML += "<p><b>Your browser does not support WebSockets! Go get a better one ;^)</b></p>";
    }
    
    players = [new Player("undefined", 0, 0), new Player("undefined", 0, 0)];

    conn.onopen = function (e){
        var request = {
            action: 0,
            timestamp: "",
            positionX: players[0].positionX,
            positionY: players[0].positionY
        };
        conn.send(JSON.stringify(request));
    };

    map = new Map(4, 4);
    
    map.updatePosition(0, 0, 0);
    map.updatePosition(1, 0, 0);

    updateRole(0, "runner");
    updateRole(1, "hunter");
}