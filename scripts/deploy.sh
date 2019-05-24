#!/usr/bin/env bash

# Copyright 2018 Novo Nordisk Foundation Center for Biosustainability, DTU.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -eu

if [ "${TRAVIS_BRANCH}" = "master" ]; then
  DEPLOYMENT=caffeine-production
elif [ "${TRAVIS_BRANCH}" = "devel" ]; then
  DEPLOYMENT=caffeine-staging
else
  echo "Skipping deployment for branch ${TRAVIS_BRANCH}"
  exit 0
fi

# Install google cloud sdk
curl https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-200.0.0-linux-x86_64.tar.gz | tar -zx
./google-cloud-sdk/install.sh --quiet
source ./google-cloud-sdk/path.bash.inc
echo ${GCLOUD_KEY} | base64 --decode > travis-ci.key.json
gcloud --quiet config set project dd-decaf-cfbf6
gcloud --quiet config set compute/zone europe-west1-b
gcloud --quiet auth activate-service-account ${GCLOUD_EMAIL} --key-file travis-ci.key.json
docker login -u _json_key --password-stdin https://gcr.io < travis-ci.key.json

# Install kubectl
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin
gcloud --quiet container clusters get-credentials dd-decaf

# Build the static files
if [ "${TRAVIS_BRANCH}" = "master" ]; then
  npx vue-cli-service build --mode production --dest nginx/dist
elif [ "${TRAVIS_BRANCH}" = "devel" ]; then
  npx vue-cli-service build --mode staging --dest nginx/dist
fi

# Build the nginx image
docker build -t ${IMAGE_REPO}:${TRAVIS_COMMIT::12} -t ${IMAGE_REPO}:${TRAVIS_BRANCH} nginx
docker push ${IMAGE_REPO}:${TRAVIS_COMMIT::12}
docker push ${IMAGE_REPO}:${TRAVIS_BRANCH}

kubectl set image deployment/${DEPLOYMENT} web=${IMAGE_REPO}:${TRAVIS_COMMIT::12}

if [ "${TRAVIS_BRANCH}" = "master" ]; then
  curl -X POST --data-urlencode "payload={\"channel\": \"decaf-vue-rewrite\", \"username\": \"Caffeine Production\", \"text\": \"Deployed @ <https://caffeine.dd-decaf.eu|*${TRAVIS_COMMIT::8}*>\", \"icon_emoji\": \":dd-decaf:\"}" ${SLACK_WEBHOOK_URL}
elif [ "${TRAVIS_BRANCH}" = "devel" ]; then
  curl -X POST --data-urlencode "payload={\"channel\": \"decaf-vue-rewrite\", \"username\": \"Caffeine Staging\", \"text\": \"Deployed @ <https://staging.dd-decaf.eu|*${TRAVIS_COMMIT::8}*>\", \"icon_emoji\": \":decaf-giraffe:\"}" ${SLACK_WEBHOOK_URL}
fi
