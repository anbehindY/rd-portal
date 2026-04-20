#!/usr/bin/env bash
# Build and push the web + api images to ECR, then force a new ECS deployment.
#
# Usage:
#   cd infra && terraform output   # confirm outputs exist
#   ./scripts/build-and-push.sh
set -euo pipefail

cd "$(dirname "$0")/.."

REGION=$(terraform output -raw region 2>/dev/null || echo "eu-west-1")
ALB=$(terraform output -raw alb_dns)
API_REPO=$(terraform output -raw ecr_api_url)
WEB_REPO=$(terraform output -raw ecr_web_url)
CLUSTER=$(terraform output -raw cluster_name)
API_URL="http://${ALB}:8080"

echo "→ Logging into ECR"
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "${API_REPO%/*}"

cd ..

echo "→ Building API"
docker build -f apps/api/Dockerfile -t "${API_REPO}:latest" .
docker push "${API_REPO}:latest"

echo "→ Building Web (NEXT_PUBLIC_API_URL=${API_URL})"
docker build \
  -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="${API_URL}" \
  -t "${WEB_REPO}:latest" .
docker push "${WEB_REPO}:latest"

echo "→ Rolling ECS services"
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service rd-portal-api --force-new-deployment >/dev/null
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service rd-portal-web --force-new-deployment >/dev/null

echo "✅ Done. Web: http://${ALB}  API: ${API_URL}"
