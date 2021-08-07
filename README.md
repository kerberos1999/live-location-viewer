# live-location-viewer by David Fröse

## how to use
1. start the server by executing main.go and server.go simultaneously
2. open webbrowser and connect to localhost:8080
3. open a second tab and connect to localhost:8080 as well
4. the start button should now be activated
5. click the start button 
6. you can move the player with the arrow keys

## parameters
You can change some parameters of the game to modify it. 
- map size:
    - open main.js and change mapWidth and mapHeight to the values you want (52x52 is max!!)
    - if you change it: reload page with shift to avoid cache issues
- seconds to wait until position request:
    - in server.go change waitUntilRequest to a value in seconds you like

# features
- when you reload the page
    - the game is closed and you receive the same role as before
    - you can just start the game again
- when someone leaves
    - you cannot start the game anymore (no 2 clients)
    - if you wait for someone to join, starting the game will be possible again

## future tasks
- implement spectators
- implement real GPS locations

## requests from server to client
| index | description |
|---|---|
| 0 | receive client array |
| 1 | remove player |
| 2 | normal message |
| 3 | start game |
| 4 | position request |
| 5 | position update |

## requests from client to server
| index | description |
|---|---|
| 0 | request client array |
| 1 | start game |
| 2 | close game |
| 3 | provide position |