function updateRole(index, role){
    if(index == playerIndex){
        var roleText = document.getElementById("role");
        roleText.innerHTML = "Current Role: <span class='text" + role + "'>" + role.toUpperCase() + "</span>";
    }
    players[index].role = role;
    map.updatePosition(index, players[index].positionX, players[index].positionY);
}

function gameLog(message){
    var log = document.getElementById("gamelog");
    log.innerHTML += "<p>" + message +"</p>";
}