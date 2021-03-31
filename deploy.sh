docker build -t dinesh1408/multi-client:latest -t dinesh1408/multi-clent:$SHA -f ./client/Dockerfile ./client
docker build -t dinesh1408/multi-server:latest -t dinesh1408/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t dinesh1408/multi-worker:latest -t dinesh1408/multi-worker:$SHA -f ./worker/Dockerfile ./worker

docker push dinesh1408/multi-client:latest
docker push dinesh1408/multi-server:latest
docker push dinesh1408/multi-worker:latest

docker push dinesh1408/multi-client:$SHA
docker push dinesh1408/multi-server:$SHA
docker push dinesh1408/multi-worker:$SHA

kubectl apply -f k8s

kubectl set image deployments/client-deployment client=dinesh1408/multi-client:$SHA
kubectl set image deployments/server-deployment server=dinesh1408/multi-server:$SHA
kubectl set iamge deployments/worker-deployment worker=dinesh1408/multi-worker:$SHA