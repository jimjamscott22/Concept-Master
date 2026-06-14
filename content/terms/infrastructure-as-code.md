---
name: Infrastructure as Code
categories:
- devops
tags:
- automation
- infrastructure
- provisioning
code_lang: hcl
---

Infrastructure as Code (IaC) manages servers, networks, databases, and cloud resources with versioned configuration files instead of manual console changes.

IaC makes infrastructure repeatable: the same definition can create development, staging, and production environments with fewer hidden differences. It also gives teams review history, rollback points, and automated drift detection.

**Common tools:** Terraform, OpenTofu, Pulumi, AWS CloudFormation, Azure Bicep, and Ansible.

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "example-app-logs"

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```
