package main

import (
	"encoding/json"
	"strconv"
	"time"
)

// time that needs to pass for the serer to request the locations
var waitUntilRequest = 3

type Hub struct {
	clients map[*Client]bool

	broadcast chan []byte

	register chan *Client

	unregister chan *Client
}

func createHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				timeStamp, _ := time.Parse("2006-01-02 15:04:05", time.Now().Format("2006-01-02 15:04:05"))
				hr, min, _ := timeStamp.Clock()
				timecode := strconv.Itoa(hr) + strconv.Itoa(min)
				clientJson, _ := json.Marshal(client)
				message, _ := json.Marshal(Request{4, timecode, string(clientJson)})
				delete(h.clients, client)
				close(client.send)
				for client := range h.clients {
					select {
					case client.send <- message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
