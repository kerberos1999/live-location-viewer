package main

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

type Client struct {
	hub *Hub

	conn *websocket.Conn

	send chan []byte
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 256),
	}
	client.hub.register <- client

	//go client.writePump()
	//go client.readPump()
}
