package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

// seconds to wait until server requests positions of clients
var waitUntilRequest = 1

type Request struct {
	Action    int    `json:"action"`
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
}

type Client struct {
	conn *websocket.Conn
	send chan []byte

	Index     int    `json:"index"`
	PositionX int    `json:"positionX"`
	PositionY int    `json:"positionY"`
	Role      string `json:"role"`
}

var clients map[*Client]bool = make(map[*Client]bool)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
)

var timeStampStart = time.Now()
var gameRunning = false

var upgrader = websocket.Upgrader{}

func (c *Client) write() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) read() {
	defer func() {
		c.conn.Close()
		delete(clients, c)
		// request client to delete client who left from array
		for client := range clients {
			timeStamp := getTimeStamp()
			clientJson, _ := json.Marshal(c)
			message, _ := json.Marshal(Request{1, timeStamp, string(clientJson)})
			client.send <- message
		}
	}()
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		var request Request
		json.Unmarshal(message, &request)
		timeStamp := getTimeStamp()
		switch request.Action {
		case 0: // new player
			// determine role of player
			role := "undefined"
			if len(clients) == 1 {
				// first player is hunter
				role = "hunter"
			} else if len(clients) == 2 {
				// find out which role the other player has and determine role accordingly
				for client := range clients {
					if client.Role == "runner" {
						role = "hunter"
						break
					} else if client.Role == "hunter" {
						role = "runner"
						break
					}
				}
			}
			c.Role = role

			// save position
			position := strings.Split(request.Message, "_")
			c.PositionX, _ = strconv.Atoi(position[0])
			c.PositionY, _ = strconv.Atoi(position[1])

			// send whole client array to clients
			message, _ := json.Marshal(getClientArray())
			answer, _ := json.Marshal(Request{0, timeStamp, string(message)})

			for client := range clients {
				client.send <- answer
			}
		case 1: // start game
			timeStampStart = time.Now()

			// send whole client array to clients
			message, _ := json.Marshal(getClientArray())
			answer, _ := json.Marshal(Request{3, timeStamp, string(message)})

			for client := range clients {
				client.send <- answer
			}

			gameRunning = true
		case 2: // close game and remove all clients
			delete(clients, c)
			gameRunning = false
			return
		case 3: // update positions: hunter receives runner position and runner receives hunter's
			var client Client
			json.Unmarshal([]byte(request.Message), &client)

			// send position to all clients where the index is not the same
			answer, _ := json.Marshal(Request{5, timeStamp, request.Message})
			for cl := range clients {
				if client.Index != cl.Index {
					cl.send <- answer
				}
			}

		}
	}
}

func getClientArray() []Client {
	var clientArray []Client
	for client := range clients {
		clientArray = append(clientArray, *client)
	}
	return clientArray
}

func (c *Client) requestPositions() {
	for {
		if gameRunning {
			if time.Since(timeStampStart)/1000000000 > time.Duration(waitUntilRequest) {
				timeStamp := getTimeStamp()
				request, _ := json.Marshal(Request{4, timeStamp, "REQUEST LOCATION"})
				timeStampStart = time.Now()
				c.send <- request
			}
		}
	}
}

func getTimeStamp() string {
	timeStamp, _ := time.Parse("2006-01-02 15:04:05", time.Now().Format("2006-01-02 15:04:05"))
	hr, min, _ := timeStamp.Clock()
	timecode := fmt.Sprintf("%02d%02d", hr, min)
	return timecode
}

func serveWs(w http.ResponseWriter, r *http.Request) {
	if len(clients) >= 2 {
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	// determine index: index for a new client is greatest index in map + 1
	index := 0
	for client := range clients {
		if client.Index > index {
			index = client.Index
			break
		}
	}

	client := &Client{
		conn:      conn,
		send:      make(chan []byte, 256),
		Index:     index + 1,
		Role:      "undefined",
		PositionX: 0,
		PositionY: 0,
	}
	clients[client] = true

	go client.write()
	go client.read()
	go client.requestPositions()
}
