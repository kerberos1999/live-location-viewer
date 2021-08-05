

class PlayGround{
    
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
                var player = players.get(playerIndex),
                    newPosX = player.positionX, 
                    newPosY = player.positionY;
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
            var player = players.get(index),
                cell = this.table.rows[player.positionY].cells[player.positionX];

            // remove undefined role if role is defined suddenly
            if(player.role != "undefined"){
                cell.classList.remove("undefined");
            }

            // remove old position
            cell.innerText = cell.innerText.replace(index == playerIndex ? "We" : "Them", "");
            cell.classList.remove(player.role);

            // update position
            player.positionX = positionX;
            player.positionY = positionY;

            // show updated position
            if(player.positionX < this.mapWidth && player.positionY < this.mapHeight &&
            player.positionX >= 0 && player.positionY >= 0){
                cell = this.table.rows[player.positionY].cells[player.positionX];
                cell.innerHTML += index == playerIndex ? "We": "Them";
                cell.classList.add(player.role);
            }
        }
    }

}