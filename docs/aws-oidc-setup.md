Goal

Create an IAM role for GitHub Actions to assume via OIDC. Attach a policy that allows ECR push and ECS task updates (minimal, tighten ARNs later).

Summary (high-level)

1. Create an IAM OIDC provider for the GitHub Actions OIDC endpoint (one-time per AWS account).
2. Create an IAM role with a trust policy allowing GitHub Actions to assume it for the specific repository (or organization).
3. Attach a policy granting ECR, ECS and iam:PassRole permissions required by the workflow.
4. Put the role ARN into GitHub repo secret `AWS_ROLE_TO_ASSUME`.

Commands (replace placeholders)

# 1) Create OIDC provider (only once)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2) Create role trust policy file (trust-policy.json)
# Replace OWNER and REPO with your values or use 'repo:OWNER/REPO' condition.
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_OWNER/YOUR_REPO:*"
        }
      }
    }
  ]
}
EOF

# 3) Create role
aws iam create-role --role-name GitHubActions-DeployRole --assume-role-policy-document file://trust-policy.json

# 4) Create policy (ci-ecs-ecr-policy.json)
cat > ci-ecs-ecr-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:BatchGetImage",
        "ecr:DescribeRepositories",
        "ecr:CreateRepository"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeClusters",
        "ecs:ListTasks",
        "ecs:DescribeTasks"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy as an inline policy or create managed policy and attach
aws iam put-role-policy --role-name GitHubActions-DeployRole --policy-name CI-ECS-ECR-Policy --policy-document file://ci-ecs-ecr-policy.json

# 5) Copy role ARN and add to GitHub repo secret
# Get the role arn:
aws iam get-role --role-name GitHubActions-DeployRole --query 'Role.Arn' --output text

# Add that ARN value as GitHub repo secret named AWS_ROLE_TO_ASSUME

Notes
- The policy above uses Resource: "*" for simplicity; you should restrict ARNs to your ECR repositories, ECS clusters, services and the task role ARN used in your task definition.
- Consider using an IAM managed policy and attaching it to the role (instead of inline) for easier auditing.
- For improved security, use the token.actions.githubusercontent.com:sub condition to scope to a single repo or branch.

References
- https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect
- https://github.com/aws-actions/configure-aws-credentials
