terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state storage in S3 (optional)
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "courseway/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region
}

# Security Group for EC2
resource "aws_security_group" "courseway_sg" {
  name        = "courseway-sg"
  description = "Security group for CourseWay application"
  vpc_id      = aws_vpc.courseway_vpc.id

  # Allow SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # Allow HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow backend port (5000)
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow frontend port (5173)
  ingress {
    from_port   = 5173
    to_port     = 5173
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow MongoDB port (27017)
  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "courseway-sg"
  }
}

# VPC
resource "aws_vpc" "courseway_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "courseway-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "courseway_igw" {
  vpc_id = aws_vpc.courseway_vpc.id

  tags = {
    Name = "courseway-igw"
  }
}

# Public Subnet
resource "aws_subnet" "courseway_subnet" {
  vpc_id                  = aws_vpc.courseway_vpc.id
  cidr_block              = var.subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "courseway-subnet"
  }
}

# Route Table
resource "aws_route_table" "courseway_rt" {
  vpc_id = aws_vpc.courseway_vpc.id

  route {
    cidr_block      = "0.0.0.0/0"
    gateway_id      = aws_internet_gateway.courseway_igw.id
  }

  tags = {
    Name = "courseway-rt"
  }
}

# Route Table Association
resource "aws_route_table_association" "courseway_rta" {
  subnet_id      = aws_subnet.courseway_subnet.id
  route_table_id = aws_route_table.courseway_rt.id
}

# EC2 Instance
resource "aws_instance" "courseway_instance" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.courseway_subnet.id
  vpc_security_group_ids = [aws_security_group.courseway_sg.id]
  key_name               = aws_key_pair.courseway.key_name

  # User data script to install Docker and pull images
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    docker_hub_username = var.docker_hub_username
    docker_hub_password = var.docker_hub_password
  }))

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    delete_on_termination = true
  }

  tags = {
    Name = "courseway-instance"
  }

  depends_on = [aws_internet_gateway.courseway_igw]
}

# Elastic IP for the instance
resource "aws_eip" "courseway_eip" {
  instance = aws_instance.courseway_instance.id
  domain   = "vpc"

  tags = {
    Name = "courseway-eip"
  }

  depends_on = [aws_internet_gateway.courseway_igw]
}

# Data source for Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Create SSH key pair resource
resource "aws_key_pair" "courseway" {
  key_name   = "courseway-key"
  public_key = file("${path.module}/../.ssh/courseway-key.pub")

  tags = {
    Name = "courseway-key-pair"
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
