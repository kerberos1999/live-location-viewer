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

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

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
		timeStamp, _ := time.Parse("2006-01-02 15:04:05", time.Now().Format("2006-01-02 15:04:05"))
		hr, min, _ := timeStamp.Clock()
		timecode := strconv.Itoa(hr) + strconv.Itoa(min)
		switch request.Action {
		case 0: // new player
			role := ""
			switch {
			case len(c.hub.clients) == 1:
				role = "hunter"
			case len(c.hub.clients) == 2:
				role = "runner"
			case len(c.hub.clients) > 2:
				//role = "undefined"
				return
			}
			c.Role = role
			position := strings.Split(request.Message, "_")
			c.PositionX, _ = strconv.Atoi(position[0])
			c.PositionY, _ = strconv.Atoi(position[1])
			client, _ := json.Marshal(c)
			answer, _ := json.Marshal(Request{0, timecode, string(client)})

			c.hub.broadcast <- []byte(answer)
		case 1: // start game and return all positions
			var clientArray []Client
			for client := range c.hub.clients {
				clientArray = append(clientArray, *client)
			}
			message, _ := json.Marshal(clientArray)
			answer, _ := json.Marshal(Request{2, timecode, string(message)})

			c.hub.broadcast <- []byte(answer)
		case 2: // close game and remove all clients
		}
	}
}

func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
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
}
