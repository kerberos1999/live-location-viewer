
// updates role of a given player and visualizes it
function updateRole(index, role){
    if(index == playerIndex){
        var roleText = document.getElementById("role");
        roleText.innerHTML = "Current Role: <span class='text" + role + "'>" + role.toUpperCase() + "</span>";
    }
    var player = players.get(playerIndex);
    player.role = role;
    playGround.updatePosition(index, player.positionX, player.positionY);
}

// prints a message into the gamelog div
function gameLog(message){
    var log = document.getElementById("gamelog");
    log.innerHTML += "<p>" + message +"</p>";
    log.scrollTop = log.scrollHeight;
}