sudo service redis-server start
redis-cli flushall

docker-compose up -d --no-deps --build <service_name>
echo "" > $(docker inspect --format='{{.LogPath}}' <container_name_or_id>)

docker logs -f --tail 100