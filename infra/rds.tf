# db.t4g.micro single-AZ. ~$12/mo. Not production-grade: no Multi-AZ, no
# read replica. 20 GB gp3 is the smallest storage tier.

resource "aws_db_subnet_group" "main" {
  name       = "${var.name}-db-subnets"
  subnet_ids = aws_subnet.public[*].id
}

resource "random_password" "db" {
  length  = 32
  special = false # keep it simple in URLs
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.name}-db"
  engine                 = "postgres"
  engine_version         = "16.13"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "rdportal"
  username               = "rdportal"
  password               = random_password.db.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
  backup_retention_period = 0
  deletion_protection    = false
}

# Compose the full DATABASE_URL as a Secrets Manager secret so ECS can inject
# it directly into the API task.
resource "aws_secretsmanager_secret" "db_url" {
  name                    = "${var.name}/database-url"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id     = aws_secretsmanager_secret.db_url.id
  secret_string = "postgresql://rdportal:${random_password.db.result}@${aws_db_instance.postgres.address}:5432/rdportal?schema=public"
}
