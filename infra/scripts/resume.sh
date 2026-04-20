#!/usr/bin/env bash
# Start RDS and scale ECS services back to 1. Waits for RDS to be available
# before starting tasks so the API doesn't crash-loop on connection errors.
#
# Usage:
#   ./scripts/resume.sh
set -euo pipefail

cd "$(dirname "$0")/.."

REGION=$(terraform output -raw region)
CLUSTER=$(terraform output -raw cluster_name)
DB_ID="${CLUSTER}-db"

echo "→ Starting RDS ${DB_ID}"
aws rds start-db-instance --region "$REGION" --db-instance-identifier "$DB_ID" >/dev/null || true

echo "→ Waiting for RDS to be available (can take a few minutes)"
aws rds wait db-instance-available --region "$REGION" --db-instance-identifier "$DB_ID"

echo "→ Scaling ECS services to 1"
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service "${CLUSTER}-api" --desired-count 1 >/dev/null
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service "${CLUSTER}-web" --desired-count 1 >/dev/null

ALB=$(terraform output -raw alb_dns)
echo "✅ Resumed. Web: http://${ALB}  API: http://${ALB}:8080"
