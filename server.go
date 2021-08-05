package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Request struct {
	Action    int    `json:"action"`
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
}

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

type Client struct {
	hub *Hub

	conn *websocket.Conn

	send chan []byte

	Index     int    `json:"index"`
	PositionX int    `json:"positionX"`
	PositionY int    `json:"positionY"`
	Role      string `json:"role"`
}

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
		c.hub.unregister <- c
		c.conn.Close()
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
			role := ""
			if len(c.hub.clients) == 1 {
				role = "hunter"
			} else if len(c.hub.clients) == 2 {
				// check which role the other client has to determine your role
				otherRole := ""
				for client := range c.hub.clients {
					if client.Role != "undefined" {
						otherRole = client.Role
						break
					}
				}
				if otherRole == "runner" {
					role = "hunter"
				} else {
					role = "runner"
				}
			} else if len(c.hub.clients) > 2 {
				role = "undefined"
			}
			c.Role = role
			// save position
			position := strings.Split(request.Message, "_")
			c.PositionX, _ = strconv.Atoi(position[0])
			c.PositionY, _ = strconv.Atoi(position[1])
			client, _ := json.Marshal(c)
			answer, _ := json.Marshal(Request{0, timeStamp, string(client)})

			c.hub.broadcast <- []byte(answer)
		case 1: // start game and return all positions
			timeStampStart = time.Now()
			gameRunning = true
			var clientArray []Client
			for client := range c.hub.clients {
				clientArray = append(clientArray, *client)
			}
			message, _ := json.Marshal(clientArray)
			answer, _ := json.Marshal(Request{2, timeStamp, string(message)})

			c.hub.broadcast <- []byte(answer)
		case 2: // close game and remove all clients
			answer, _ := json.Marshal(Request{1, timeStamp, "Reload page to restart..."})
			c.hub.broadcast <- []byte(answer)

			for client := range c.hub.clients {
				c.hub.unregister <- client
			}
			gameRunning = false
			return
		case 3: // update positions: runner gets position of hunter and the other way around
			for client := range c.hub.clients {
				if client.Role == "runner" {

				}
			}
		}
	}
}

func (c *Client) requestPositions() {
	for {
		if gameRunning {
			if time.Since(timeStampStart)/1000000000 > time.Duration(waitUntilRequest) {
				timeStamp := getTimeStamp()
				request, _ := json.Marshal(Request{3, timeStamp, "REQUEST LOCATION"})
				timeStampStart = time.Now()
				c.send <- request
			}
		}
	}
}

func getTimeStamp() string {
	timeStamp, _ := time.Parse("2006-01-02 15:04:05", time.Now().Format("2006-01-02 15:04:05"))
	hr, min, _ := timeStamp.Clock()
	timecode := strconv.Itoa(hr) + strconv.Itoa(min)
	return timecode
}

func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	if len(hub.clients) >= 2 {
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{
		hub:       hub,
		conn:      conn,
		send:      make(chan []byte, 256),
		Index:     len(hub.clients),
		Role:      "undefined",
		PositionX: 0,
		PositionY: 0,
	}
	client.hub.register <- client

	go client.write()
	go client.read()
	go client.requestPositions()
}
