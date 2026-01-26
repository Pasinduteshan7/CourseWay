variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "Subnet CIDR block"
  type        = string
  default     = "10.0.1.0/24"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_pair_name" {
  description = "EC2 key pair name (must already exist in AWS)"
  type        = string
  default     = "courseway-key"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access (e.g., your IP)"
  type        = string
  default     = "0.0.0.0/0" # Change this to your IP for security
}

variable "root_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 20
}

variable "docker_hub_username" {
  description = "Docker Hub username"
  type        = string
  sensitive   = true
}

variable "docker_hub_password" {
  description = "Docker Hub password"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
