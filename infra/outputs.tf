output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "web_url" {
  value = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  value = "http://${aws_lb.main.dns_name}:8080"
}

output "ecr_api_url" {
  value = aws_ecr_repository.api.repository_url
}

output "ecr_web_url" {
  value = aws_ecr_repository.web.repository_url
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "region" {
  value = var.region
}

output "github_deploy_role_arn" {
  value       = aws_iam_role.github_deploy.arn
  description = "Paste into GitHub → Settings → Secrets → Actions as AWS_DEPLOY_ROLE_ARN"
}
