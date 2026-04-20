# 🏗️ infra — ECS Fargate POC on AWS

Cheapest possible Fargate deployment. **Fargate Spot** tasks at the minimum size (0.25 vCPU / 0.5 GB), a **single ALB** serving web on `:80` and api on `:8080`, **RDS `db.t4g.micro`** for Postgres. Public subnets only, so no NAT gateway.

## 💸 Cost (eu-west-1, rough)

| Resource | Price |
| --- | --- |
| ALB (fixed) | ~$16.20/mo |
| 2× Fargate **Spot** tasks (256 CPU / 512 MB) | ~$6/mo |
| RDS db.t4g.micro + 20 GB gp3 | ~$14/mo |
| ECR storage (~500 MB per image) | < $0.10/mo |
| CloudWatch logs (14-day retention, light traffic) | < $1/mo |
| **Total** | **~$37/mo** |

> ⚠️ **POC, not production.** Single-AZ RDS, no backups, no TLS, no HA. Fargate Spot tasks can be interrupted. Fine to demo; don't ship real users here.

## 🧱 Architecture

```
         Internet
             │
        ┌────▼────┐
        │   ALB   │  (public, single)
        └────┬────┘
   :80 ─────┤├──── :8080
   web TG   ││    api TG
            ││
    ┌───────▼┴───────┐
    │  ECS Fargate   │
    │  web  +  api   │  (Spot, 0.25 vCPU, 0.5 GB each)
    └───────┬────────┘
            │
     ┌──────▼──────┐
     │    RDS      │  (private SG, ECS-only)
     │ Postgres 16 │
     └─────────────┘
```

CORS is set to `http://<alb-dns>` because the web runs on `:80` and the API on `:8080` — different origins. Web bundles `NEXT_PUBLIC_API_URL=http://<alb-dns>:8080` at build time.

## 🚀 First deploy

Terraform creates everything **first**, then the build script pushes images and rolls the services.

```bash
# 1️⃣ Prereqs: AWS credentials configured, Docker running, Terraform ≥ 1.5
cd infra
cp terraform.tfvars.example terraform.tfvars   # edit region if needed

# 2️⃣ Provision AWS resources (~5 min). Services will come up but tasks
#    will fail to pull until images exist — that's expected.
terraform init
terraform apply

# 3️⃣ Build & push images, then force a new ECS deployment.
./scripts/build-and-push.sh

# 4️⃣ Open the site
terraform output web_url
```

Give ECS ~2 minutes after the script finishes for health checks to pass.

## 🔄 Subsequent deploys

Just re-run the build script:

```bash
cd infra && ./scripts/build-and-push.sh
```

The script builds, pushes to ECR, and calls `aws ecs update-service --force-new-deployment` for both services.

## 🔍 Peek at the DB

No public access. Use **ECS Exec**:

```bash
aws ecs execute-command \
  --cluster rd-portal \
  --task $(aws ecs list-tasks --cluster rd-portal --service-name rd-portal-api --query 'taskArns[0]' --output text) \
  --container api --interactive --command "/bin/sh"
# then inside: npx prisma studio --browser none
```

> ⚠️ Enabling ECS Exec properly requires `enable_execute_command = true` on the service and an IAM policy. Add that to `ecs.tf` if you want to use this — left off by default to keep surface area small.

## 🧭 What's skipped (and how to harden for prod)

| Skipped | Reason | Upgrade path |
| --- | --- | --- |
| 🔒 HTTPS | No domain | Route 53 + ACM cert + HTTPS listener |
| 🌍 CloudFront | Extra cost | Drop CF in front of the web ALB |
| 🗄️ Multi-AZ RDS + backups | Cost | `multi_az = true`, `backup_retention_period = 7` |
| 🧩 Private subnets + NAT | ~$32/mo for NAT | Move tasks to private subnets once NAT is worth it |
| 🔑 Rotation-aware secrets | POC simplicity | Secrets Manager rotation lambdas |
| 📈 Autoscaling | 1 task each is enough | `aws_appautoscaling_target` on CPU/memory |
| 🚦 Shared throttler state | In-memory is fine at 1 task | ElastiCache Redis + throttler Redis storage |

## 🧱 Files

- [main.tf](main.tf) — VPC, subnets, IGW, security groups
- [alb.tf](alb.tf) — ALB, listeners, target groups
- [rds.tf](rds.tf) — RDS instance + `DATABASE_URL` secret
- [ecs.tf](ecs.tf) — ECR, IAM, log groups, cluster, tasks, services
- [variables.tf](variables.tf) / [outputs.tf](outputs.tf) — inputs and URLs
- [scripts/build-and-push.sh](scripts/build-and-push.sh) — build → ECR → roll services

## 🧹 Tear down

```bash
terraform destroy
```
