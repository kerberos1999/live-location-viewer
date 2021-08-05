

window.onload = function(){
    var conn;

    players = new Map();
    playerIndex = -1;
    paused = true;
    mapWidth = 4;
    mapHeight = 4;

    alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
                          "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

    startButton = document.getElementById("startButton"),
    closeButton = document.getElementById("closeButton");

    if(window["WebSocket"]){
        conn = new WebSocket("ws://" + document.location.host + "/ws");
        conn.onclose = function (e){
            paused = true;
            startButton.disabled = true;
            closeButton.disabled = true;
            players.clear();
            gameLog("Game closed!");
        };
        conn.onmessage = function (e){
            console.log(e.data);
            var answer = JSON.parse(e.data);
            switch(answer.action){
                case 0: // receive client array
                    var clients = JSON.parse(answer.message);
                    // find client with the greatest index because this is the new player!
                    client = clients[0];
                        for(var i = 1; i < clients.length; i++){
                            if(clients[i].index > client.index){
                                client = clients[i];
                            } 
                        }
                    // if player index is not set, the client was not connected before so create all players!
                    if(playerIndex == -1) {
                        for(var i = 0; i < clients.length; i++){
                            players.set(clients[i].index, new Player(clients[i].index, clients[i].role, clients[i].positionX, clients[i].positionY));
                            gameLog(answer.timestamp + " - <b class='text" + clients[i].role + "'>" + clients[i].role + "</b> joined the game!");
                        }
                        playerIndex = client.index; // last client in array is this client
                        updateRole(playerIndex, client.role)
                    }else{
                        // player was already connected so a player joins
                        players.set(client.index, new Player(client.index, client.role, client.positionX, client.positionY));
                        gameLog(answer.timestamp + " - <b class='text" + client.role + "'>" + client.role + "</b> joined the game!");
                    }
                    if(players.size >= 2){
                        startButton.disabled = false;
                    }
                break;
                case 1: // remove client
                    var client = JSON.parse(answer.message)
                    players.delete(client.index);
                    if(players.size <= 1){
                        closeButton.click();
                        startButton.disabled = true;
                        closeButton.disabled = true;
                        paused = true;
                    }
                    gameLog(answer.timestamp + " - <b class='text" + client.role + "'>" + client.role + "</b> left the game!");
                break;
                case 2: // normal message
                    gameLog(answer.timestamp + " - " + answer.message);
                break;
                case 3: // start game
                    paused = false;
                    var clients = JSON.parse(answer.message);
                    for(var i = 0; i < clients.length; i++)
                    {
                        playGround.updatePosition(clients[i].index, clients[i].positionX, clients[i].positionY);
                    }
                    startButton.disabled = true;
                    closeButton.disabled = false;
                break;
                case 4: // position request
                    gameLog(answer.timestamp + " - " + answer.message);
                    var request = {
                        action: 3,
                        timestamp: "",
                        message: JSON.stringify(players.get(playerIndex))
                    };
                    conn.send(JSON.stringify(request));
                break;
                case 5: // position update
                    var client = JSON.parse(answer.message),
                        player = players.get(playerIndex);
                    playGround.updatePosition(client.index, client.positionX, client.positionY);
                    gameLog(answer.timestamp + " - <b class='text" + client.role + "'>" + client.role + "</b> location: " + client.positionX + alphabet[client.positionY]);
                    gameLog(answer.timestamp + " - <b class='text" + player.role + "'>" + player.role + "</b> location: " + player.positionX + alphabet[player.positionY]);
                    gameLog(" ");
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
    });

    closeButton.addEventListener("click", function(){
        var request = {
            action: 2,
            timestamp: "",
            message: ""
        }
        conn.send(JSON.stringify(request));
    });

    playGround = new PlayGround(mapWidth, mapHeight);
}