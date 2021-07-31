

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
        }
    }else{
        gameLog.innerHTML += "<p><b>Your browser does not support WebSockets! Go get a better one ;^)</b></p>";
    }
    
    conn.onopen = function (e){
        conn.send("Der Boss ist da");
    };

    map = new Map(4, 4);
    players = [new Player("runner", 2, 1), new Player("hunter", 3, 1)];
    
    map.updatePositions();

    players[1].positionX = 1;

    map.updatePositions();
}