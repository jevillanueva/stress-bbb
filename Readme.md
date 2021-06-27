# Test Stress Big Blue Button Public Session
1. Build Image
```
$ docker-compose build
```
2. Copy .env.sample to .env
3. Modify .env
4. Execute
```
$ docker-compose up
```

# In Docker Swarm
4. Execute
```
$ docker stack deploy -c stack-deploy.yml stress
```
5. Logs Service
```
$ docker service logs -f stress_app
```
6. Delete Stack
```
$ docker stack rm stress
```