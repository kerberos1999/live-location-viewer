

class Map{
    
    table;

    constructor(mapWidth, mapHeight){
        this.mapWidth = mapWidth; 
        this.mapHeight = mapHeight;
        this.createMap();
    }

    createMap(){
        // create table
        this.table = document.getElementById("map");

        // control position
        document.addEventListener("keydown", (e) => {
            if(!paused){
                var newPosX = players[playerIndex].positionX, newPosY = players[playerIndex].positionY;
                switch(e.code){
                    case "ArrowUp": 
                        newPosY--;
                    break;
                    case "ArrowRight": 
                        newPosX++;
                    break;
                    case "ArrowDown": 
                        newPosY++;
                    break;
                    case "ArrowLeft": 
                        newPosX--;
                    break;
                }
                if(newPosX < 0) newPosX = this.mapWidth - 1;
                if(newPosX >= this.mapWidth) newPosX = 0;
                if(newPosY < 0) newPosY = this.mapHeight - 1;
                if(newPosY >= this.mapHeight) newPosY = 0; 
                this.updatePosition(playerIndex, newPosX, newPosY);
            }
        });

        var str = "";
        const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
                          "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        for(var i = 0; i < this.mapHeight; i++){
            str += "<tr>";
            for(var j = 0; j < this.mapWidth; j++){
                str += "<td>⠀</td>";
                if(j + 1 == this.mapWidth){
                    str += "<td>" + alphabet[i] + "</td>"
                }
            }
            str += "</tr>";
            if(i + 1 == this.mapHeight){
                str += "<tr>";
                for(var j = 0; j < this.mapWidth; j++){
                    str += "<td>" + (j + 1) + "</td>";
                }
                str += "<td></td>";
                str += "</tr>";
            }
        }
        this.table.innerHTML = str;
    }

    updatePosition(index, positionX, positionY){
        if(!paused && positionX >= 0 && positionY >= 0){
            var cell = this.table.rows[players[index].positionY].cells[players[index].positionX];

            // remove undefined role if role is defined suddenly
            if(players[index].role != "undefined"){
                cell.classList.remove("undefined");
            }

            // remove old position
            cell.innerText = cell.innerText.replace(index == playerIndex ? "We" : "Them", "");
            cell.classList.remove(players[index].role);

            // update position
            players[index].positionX = positionX;
            players[index].positionY = positionY;

            // show updated position
            if(players[index].positionX < this.mapWidth && players[index].positionY < this.mapHeight &&
            players[index].positionX >= 0 && players[index].positionY >= 0){
                cell = this.table.rows[players[index].positionY].cells[players[index].positionX];
                cell.innerHTML += index == playerIndex ? "We": "Them";
                cell.classList.add(players[index].role);
            }
        }
    }

}