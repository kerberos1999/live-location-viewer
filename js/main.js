

window.onload = function(){
    var conn;

    players = [];
    playerIndex = -1;
    paused = true;
    mapWidth = 4;
    mapHeight = 4;

    startButton = document.getElementById("startButton"),
    closeButton = document.getElementById("closeButton");

    if(window["WebSocket"]){
        conn = new WebSocket("ws://" + document.location.host + "/ws");
        conn.onclose = function (e){
            paused = true;
            startButton.disabled = true;
            closeButton.disabled = true;
            gameLog("Connection closed!");
        };
        conn.onmessage = function (e){
            console.log(e.data);
            var answer = JSON.parse(e.data);
            switch(answer.action){
                case 0: // received new player
                    var client = JSON.parse(answer.message);
                    players[client.index] = new Player(client.role, client.positionX, client.positionY)
                    gameLog(answer.timestamp + " - <b>" + client.role + "</b> joined the game!");
                    if(playerIndex == -1) playerIndex = client.index;
                    if(client.index >= 1) startButton.disabled = false;
                    updateRole(client.index, client.role);
                break;
                case 1: // normal message
                    gameLog(answer.timestamp + " - " + answer.message);
                break;
                case 2: // position update
                    paused = false;
                    var clients = JSON.parse(answer.message);
                    for(var i = 0; i < clients.length; i++)
                    {
                        if(players[clients[i].index] == undefined){ // create player if he is still undefined in array
                            players[clients[i].index] = new Player(clients[i].role, clients[i].positionX, clients[i].positionY);
                            updateRole(clients[i].index, clients[i].role);
                        }
                        map.updatePosition(clients[i].index, clients[i].positionX, clients[i].positionY);
                    }
                    startButton.disabled = true;
                    closeButton.disabled = false;
                break;
                case 3: // position request
                    gameLog(answer.timestamp + " - " + answer.message);
                break;
                case 4: // remove client
                    var client = JSON.parse(answer.message)
                    players.splice(client.index, 1);
                    if(players.length <= 1){
                        startButton.disabled = true;
                        closeButton.disabled = true;
                    }
                    gameLog(answer.timestamp + " - <b>" + client.role + "</b> left the game!");
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
        map.updatePosition();
    });

    closeButton.addEventListener("click", function(){
        var request = {
            action: 2,
            timestamp: "",
            message: ""
        }
        conn.send(JSON.stringify(request));
    });

    map = new Map(mapWidth, mapHeight);
}