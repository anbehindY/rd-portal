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
