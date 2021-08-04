package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Client struct {
	hub *Hub

	conn *websocket.Conn

	send chan []byte

	positionX int
	positionY int
}

var upgrader = websocket.Upgrader{}

func (c *Client) write() {

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
		var f interface{}
		json.Unmarshal(message, &f)
		m := f.(map[string]interface{})
		for _, v := range m {
			fmt.Println(v)
		}
		c.hub.broadcast <- []byte(message)
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
		positionX: 0,
		positionY: 0,
	}
	client.hub.register <- client

	go client.write()
	go client.read()
}
