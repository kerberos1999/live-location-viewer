

class Map{
    
    map = [];
    table;

    constructor(mapWidth, mapHeight){
        this.mapWidth = mapWidth; 
        this.mapHeight = mapHeight;
        this.createMap();
    }

    createMap(){
        // create table
        this.table = document.getElementById("map");

        var str = "";
        const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        for(var i = 0; i < this.mapHeight; i++){
            str += "<tr>";
            for(var j = 0; j < this.mapWidth; j++){
                str += "<td></td>";
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

        // fill array
        for(var i = 0; i < this.mapWidth; i++){
            this.map[i] = [];
            for(var j = 0; j < this.mapHeight; j++){
                this.map[i][j] = -1;
            }
        }
    }

    updatePositions(){
        for(var index = 0; index < players.length; index++){
            var cell = this.table.rows[players[index].positionY].cells[players[index].positionX];

            // remove old position if it exists
            for(var i = 0; i < this.mapWidth; i++){
                for(var j = 0; j < this.mapHeight; j++){
                    if(this.map[i][j] != -1 && this.map[i][j] == index){
                        this.map[i][j] = -1;
                        this.table.rows[j].cells[i].innerHTML = "";
                        this.table.rows[j].cells[i].className = "";
                    }
                }
            }
            
            // show updated position
            if(players[index].positionX < this.mapWidth && players[index].positionY < 4){
                cell.innerHTML += index == 0 ? "We ": "Them ";
                cell.classList.add(players[index].role);

                // save index to map array
                this.map[players[index].positionX][players[index].positionY] = index;
            }
        }
    }

}