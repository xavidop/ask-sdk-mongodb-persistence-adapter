#!/bin/bash

docker pull mongo

docker run \
-d \
--name mongo \
-p 27018:27017 \
-e MONGO_INITDB_ROOT_USERNAME='my_user' \
-e MONGO_INITDB_ROOT_PASSWORD='my_password' \
mongo 