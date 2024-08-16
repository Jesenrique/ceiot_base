#!/bin/bash

# Abrir una nueva terminal y ejecutar el primer conjunto de comandos
gnome-terminal -- bash -c "cd ~/ceiot_base; docker run -p 27017:27017 mongo:4.0.4; exec bash"

# Abrir una nueva terminal y ejecutar el segundo conjunto de comandos
gnome-terminal -- bash -c "cd ~/ceiot_base/api; node index.js; exec bash"

# Abrir una nueva terminal y ejecutar el tercer conjunto de comandos
gnome-terminal -- bash -c "cd ~/ceiot_base/api/spa; ./rebuild.sh; exec bash"
