#!/usr/bin/env bash
# Scale ECS services to 0 and stop RDS to minimise cost between sessions.
# ALB keeps billing (~$0.54/day) — only `terraform destroy` stops that.
# RDS auto-restarts after 7 days; if paused longer, run resume.sh first.
#
# Usage:
#   ./scripts/idle.sh
set -euo pipefail

cd "$(dirname "$0")/.."

REGION=$(terraform output -raw region)
CLUSTER=$(terraform output -raw cluster_name)
DB_ID="${CLUSTER}-db"

echo "→ Scaling ECS services to 0"
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service "${CLUSTER}-api" --desired-count 0 >/dev/null
aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service "${CLUSTER}-web" --desired-count 0 >/dev/null

echo "→ Stopping RDS ${DB_ID}"
aws rds stop-db-instance --region "$REGION" --db-instance-identifier "$DB_ID" >/dev/null

echo "✅ Idle. Run resume.sh to bring the stack back."
