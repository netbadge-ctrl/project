package main

import (
	"fmt"
	"net/http"
	"log"
)

func main() {
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Test server is working! IP: %s\n", r.RemoteAddr)
	})
	
	log.Println("Test server starting on 0.0.0.0:8080")
	if err := http.ListenAndServe("0.0.0.0:8080", nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}