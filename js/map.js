class Map{
    
    map = [[]];
    alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

    constructor(mapWidth, mapHeight){
        this.mapWidth = mapWidth; 
        this.mapHeight = mapHeight;
        this.createMap();
    }

    createMap(){
        let table = document.getElementById("map");
        var str = "";
        for(var i = 0; i < this.mapHeight; i++){
            str += "<tr>"
            for(var j = 0; j < this.mapWidth; j++){
                map[j, i] = 0;
                str += "<td></td>";
                if(j + 1 == this.mapWidth){
                    str += "<td>" + this.alphabet[i] + "</td>"
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
        table.innerHTML = str;
    }

}