# Build demo image and push to dockerhub (you need to login to dockerhub first)
npx vue-cli-service build --mode demo --dest nginx/dist
docker build -t dddecaf/caffeine-vue-demo nginx
docker push dddecaf/caffeine-vue-demo
