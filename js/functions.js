function updateRole(index, role){
    if(index == 0){
        var roleText = document.getElementById("role");
        roleText.innerText = "Current Role: " + role.toUpperCase();
    }
    players[index].role = role;
    map.updatePosition(index, players[index].positionX, players[index].positionY);
}