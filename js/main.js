

window.onload = function(){
    var conn;

    players = [];
    playerIndex = -1;
    paused = true;
    mapWidth = 20;
    mapHeight = 20;

    startButton = document.getElementById("startButton"),
    closeButton = document.getElementById("closeButton");

    if(window["WebSocket"]){
        conn = new WebSocket("ws://" + document.location.host + "/ws");
        conn.onclose = function (e){
            gameLog("Connection closed!");
        };
        conn.onmessage = function (e){
            console.log(e.data);
            var answer = JSON.parse(e.data);
            switch(answer.action){
                case 0: // received new player
                    var client = JSON.parse(answer.message);
                    players[client.index] = new Player(client.role, client.positionX, client.positionY)
                    gameLog("<b>" + client.role + "</b> joined the game!");
                    if(playerIndex == -1) playerIndex = client.index;
                    if(client.index >= 1) startButton.disabled = false;
                    updateRole(client.index, client.role);
                break;
                case 1: // normal message
                    gameLog(answer.timestamp + " - " + answer.message);
                break;
                case 2: // position update
                    var clients = JSON.parse(answer.message);
                    for(var i = 0; i < clients.length; i++)
                    {
                        if(players[clients[i].index] == undefined){ // create if undefined
                            players[clients[i].index] = new Player(clients[i].role, clients[i].positionX, clients[i].positionY);
                            updateRole(clients[i].index, clients[i].role);
                        }
                        map.updatePosition(clients[i].index, clients[i].positionX, clients[i].positionY);
                    }
                    paused = false;
                break;
                case 3: // position request

                break;
            }
        }
    }else{
        gameLog("Your browser does not support WebSockets! Go get a better one ;^)");
    }

    conn.onopen = function (e){
        var request = {
            action: 0,
            timestamp: "",
            message: Math.floor(Math.random() * mapWidth) + "_" + Math.floor(Math.random() * mapHeight) // random start position
        };
        conn.send(JSON.stringify(request));
    };

    startButton.addEventListener("click", function(){
        var request = {
            action: 1,
            timestamp: "",
            message: ""
        }
        conn.send(JSON.stringify(request));
        closeButton.disabled = false;
    });

    map = new Map(mapWidth, mapHeight);
}