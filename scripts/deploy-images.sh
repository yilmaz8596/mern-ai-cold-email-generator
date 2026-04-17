#!/usr/bin/env bash
set -euo pipefail

# scripts/deploy-images.sh
# Build frontend/backend Docker images, push to ECR, register new task definitions, and update ECS services.
# Requires: aws, docker, jq
# Usage:
#  bash scripts/deploy-images.sh \ 
#    --account 211125593865 \ 
#    --region eu-central-1 \ 
#    --ecr-frontend mern-ai-cold-email-gen/frontend \ 
#    --ecr-backend mern-ai-cold-email-gen/backend \ 
#    --frontend-cluster FRONTEND_CLUSTER --frontend-service FRONTEND_SERVICE --frontend-container FRONTEND_CONTAINER_NAME \ 
#    --backend-cluster BACKEND_CLUSTER --backend-service BACKEND_SERVICE --backend-container BACKEND_CONTAINER_NAME \ 
#    --tag v1.2.3

usage(){
  sed -n '1,120p' "$0"
  exit 1
}

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found. Install and configure it first." >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found. Install Docker Desktop and ensure it's running." >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found. Install jq to enable task definition updates." >&2
  exit 1
fi

ARGS=$(getopt -o h --long account:,region:,ecr-frontend:,ecr-backend:,frontend-cluster:,frontend-service:,frontend-container:,backend-cluster:,backend-service:,backend-container:,tag: -n "$0" -- "$@")
if [ $? -ne 0 ]; then usage; fi
eval set -- "$ARGS"

while true; do
  case "$1" in
    --account) ACCOUNT="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    --ecr-frontend) ECR_FRONTEND="$2"; shift 2;;
    --ecr-backend) ECR_BACKEND="$2"; shift 2;;
    --frontend-cluster) FRONTEND_CLUSTER="$2"; shift 2;;
    --frontend-service) FRONTEND_SERVICE="$2"; shift 2;;
    --frontend-container) FRONTEND_CONTAINER="$2"; shift 2;;
    --backend-cluster) BACKEND_CLUSTER="$2"; shift 2;;
    --backend-service) BACKEND_SERVICE="$2"; shift 2;;
    --backend-container) BACKEND_CONTAINER="$2"; shift 2;;
    --tag) TAG="$2"; shift 2;;
    -h|--help) usage; break;;
    --) shift; break;;
  esac
done

if [ -z "${ACCOUNT:-}" ] || [ -z "${REGION:-}" ] || [ -z "${ECR_FRONTEND:-}" ] || [ -z "${ECR_BACKEND:-}" ]; then
  echo "Missing required args." >&2
  usage
fi

TAG=${TAG:-$(git rev-parse --short HEAD || date +%s)}

FRONTEND_IMAGE="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${ECR_FRONTEND}:${TAG}"
BACKEND_IMAGE="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${ECR_BACKEND}:${TAG}"

echo "Building frontend..."
docker build -t frontend:local -f client/Dockerfile client

echo "Building backend..."
docker build -t backend:local -f api/Dockerfile api

echo "Logging into ECR ${REGION}..."
aws ecr get-login-password --region "${REGION}" | docker login --username AWS --password-stdin "${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"

echo "Ensure ECR repositories exist..."
aws ecr describe-repositories --repository-names "${ECR_FRONTEND%%/*}" >/dev/null 2>&1 || true
aws ecr describe-repositories --repository-names "${ECR_BACKEND%%/*}" >/dev/null 2>&1 || true

echo "Tagging images..."
docker tag frontend:local "${FRONTEND_IMAGE}"
docker tag backend:local "${BACKEND_IMAGE}"

echo "Pushing frontend image: ${FRONTEND_IMAGE}"
docker push "${FRONTEND_IMAGE}"

echo "Pushing backend image: ${BACKEND_IMAGE}"
docker push "${BACKEND_IMAGE}"

update_task_definition(){
  local cluster="$1" service="$2" container_name="$3" new_image="$4"
  echo "Updating service ${service} in cluster ${cluster} to use image ${new_image} for container ${container_name}"

  current_td_arn=$(aws ecs describe-services --cluster "$cluster" --services "$service" --region "$REGION" --query 'services[0].taskDefinition' --output text)
  if [ -z "$current_td_arn" ] || [ "$current_td_arn" = "None" ]; then
    echo "Failed to get current task definition for ${service}" >&2
    return 1
  fi

  td_json=$(aws ecs describe-task-definition --task-definition "$current_td_arn" --region "$REGION" --query 'taskDefinition')

  new_td=$(echo "$td_json" | jq --arg cn "$container_name" --arg img "$new_image" '.containerDefinitions |= map(if .name == $cn then .image = $img else . end) | del(.taskDefinitionArn, .revision, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

  family=$(echo "$new_td" | jq -r '.family')

  echo "Registering new task definition for family $family..."
  new_td_arn=$(aws ecs register-task-definition --cli-input-json "$new_td" --region "$REGION" --query 'taskDefinition.taskDefinitionArn' --output text)

  echo "Updating service to use new task definition $new_td_arn"
  aws ecs update-service --cluster "$cluster" --service "$service" --task-definition "$new_td_arn" --region "$REGION"
}

if [ -n "${FRONTEND_CLUSTER:-}" ] && [ -n "${FRONTEND_SERVICE:-}" ] && [ -n "${FRONTEND_CONTAINER:-}" ]; then
  update_task_definition "$FRONTEND_CLUSTER" "$FRONTEND_SERVICE" "$FRONTEND_CONTAINER" "$FRONTEND_IMAGE"
fi

if [ -n "${BACKEND_CLUSTER:-}" ] && [ -n "${BACKEND_SERVICE:-}" ] && [ -n "${BACKEND_CONTAINER:-}" ]; then
  update_task_definition "$BACKEND_CLUSTER" "$BACKEND_SERVICE" "$BACKEND_CONTAINER" "$BACKEND_IMAGE"
fi

echo "Deployment complete. Images pushed with tag: ${TAG}"

exit 0
