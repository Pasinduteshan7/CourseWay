output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.courseway_instance.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.courseway_eip.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.courseway_instance.public_dns
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.courseway_sg.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.courseway_vpc.id
}

output "ssh_command" {
  description = "Command to SSH into the instance"
  value       = "ssh -i /path/to/key.pem ubuntu@${aws_eip.courseway_eip.public_ip}"
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.courseway_eip.public_ip}:5173"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://${aws_eip.courseway_eip.public_ip}:5000"
}
