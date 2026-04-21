variable "name" {
  type    = string
  default = "rd-portal"
}

variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "profile" {
  type        = string
  description = "AWS CLI profile to use (e.g. your SSO profile)"
  default     = null
}

variable "github_repo" {
  type        = string
  description = "GitHub repo allowed to assume the deploy role, e.g. anbehindY/rd-portal"
}

variable "deploy_branch" {
  type        = string
  description = "Only this branch can assume the deploy role via OIDC"
  default     = "main"
}
