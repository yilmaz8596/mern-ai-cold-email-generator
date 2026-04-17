#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/setup-aws-ci.sh <ACCOUNT_ID> <ROLE_NAME> <REPO_OWNER> <REPO_NAME>
# Example: ./scripts/setup-aws-ci.sh 123456789012 ci-deploy-role myorg repo
# The script will:
# - create an IAM policy for ECS/ECR deploy
# - create an OIDC-assumable role for GitHub Actions and attach the policy
# - print the role ARN and the gh CLI command to set the GitHub secret `AWS_ROLE_TO_ASSUME`

ACCOUNT_ID=${1:-}
ROLE_NAME=${2:-}
REPO_OWNER=${3:-}
REPO_NAME=${4:-}

if [ -z "$ACCOUNT_ID" ] || [ -z "$ROLE_NAME" ] || [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
  echo "Usage: $0 <ACCOUNT_ID> <ROLE_NAME> <REPO_OWNER> <REPO_NAME>"
  exit 1
fi

AWS_REGION=$(grep -E '^AWS_REGION=' api/.env.amazon 2>/dev/null | cut -d'=' -f2- || true)
if [ -z "$AWS_REGION" ]; then
  AWS_REGION=${AWS_REGION:-us-east-1}
fi

POLICY_NAME="CI-ECS-ECR-Deploy-Policy"
POLICY_FILE=$(mktemp /tmp/ci-policy.XXXX.json)
TRUST_FILE=$(mktemp /tmp/ci-trust.XXXX.json)

cat > "$POLICY_FILE" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeTasks",
        "ecs:ListTasks"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": "*"
    }
  ]
}
JSON

OIDC_PROVIDER="token.actions.githubusercontent.com"
cat > "$TRUST_FILE" <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${OIDC_PROVIDER}" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${REPO_OWNER}/${REPO_NAME}:*"
        }
      }
    }
  ]
}
JSON

echo "Creating IAM policy ${POLICY_NAME}..."
create_policy_out=$(aws iam create-policy --policy-name "$POLICY_NAME" --policy-document file://"$POLICY_FILE" --query 'Policy.Arn' --output text || true)
if [ -z "$create_policy_out" ]; then
  echo "Policy may already exist; trying to use existing policy arn..."
  create_policy_out="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
fi

echo "Policy ARN: $create_policy_out"

echo "Creating role $ROLE_NAME with OIDC trust..."
role_out=$(aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file://"$TRUST_FILE" --query 'Role.Arn' --output text || true)
if [ -z "$role_out" ]; then
  echo "Role may already exist; retrieving role ARN..."
  role_out=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
fi

echo "Role ARN: $role_out"

echo "Attaching policy to role..."
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "$create_policy_out"

echo
echo "Done. Role ARN: $role_out"
echo
echo "Set the GitHub repository secret 'AWS_ROLE_TO_ASSUME' to this role ARN. Example using gh CLI (run in your repo):"
echo
echo "  gh secret set AWS_ROLE_TO_ASSUME --body '$role_out' --repo ${REPO_OWNER}/${REPO_NAME}"
echo
echo "Verify with:
  aws sts get-caller-identity
  aws ecs describe-services --cluster YOUR_CLUSTER --services YOUR_SERVICE --region ${AWS_REGION}
"

rm -f "$POLICY_FILE" "$TRUST_FILE"

exit 0
