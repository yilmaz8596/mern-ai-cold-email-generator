# Deployment Summary & Step-by-step Guide

This document summarizes what has been completed so far for the project and provides step-by-step deployment instructions for Docker, Kubernetes (optional), AWS (ECR / ECS / ALB / ACM / Route 53), GoDaddy DNS, CI/CD and remaining items.

## 1) What we've completed

- Frontend: fixed TypeScript/Vite build and produced production `dist/`.
- Frontend: multi-stage Dockerfile and production Nginx stage created and image built/pushed.
- Backend: Node/Express app with REST endpoints (including `POST /api/auth/login`, delete-account, etc.).
- ECR: Images built and pushed to your account ECR repositories (frontend and backend).
- ECS/Fargate: Task definitions and services created for frontend and backend (cluster `graceful-deer-j02mm1`).
- ALB: Application Load Balancer created with HTTPS listener using ACM certificate.
- ACM: Certificate requested and DNS validated; certificate issued.
- DNS: `www` CNAME pointed to the ALB; registrar apex forwarded to `https://www.sitesolutions.info`.
- Secrets: Env values moved to AWS Secrets Manager and referenced by ECS/ECS task execution role; execution role updated for S3 env-file access.
- CI: A GitHub Actions workflow added at `.github/workflows/deploy-to-aws.yml` to build, push and deploy images (needs repo secrets configured).
- Routing fix: ALB rules updated to forward `/api/*` to backend target group `mern-backend-tg` (created during debugging).

## 2) Quick status (current)

- Site is reachable at https://www.sitesolutions.info and ALB serves valid certificate for `www`.
- Backend now responds (previous 405 fixed by adding path rule). Backend returns 400 when body missing (correct validation).

## 3) Docker (local builds and images)

1. Build frontend production image locally (example):

```bash
cd client
docker build -t frontend:local -f Dockerfile .
```

2. Build backend image locally:

```bash
cd api
docker build -t backend:local -f Dockerfile .
```

3. Tag and push to ECR (example variables):

```bash
AWS_ACCOUNT_ID=211125593865
AWS_REGION=eu-central-1
ECR_REPO_FRONTEND=mern-ai-cold-email-gen/frontend
ECR_REPO_BACKEND=mern-ai-cold-email-gen/backend

docker tag frontend:local ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_FRONTEND}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_FRONTEND}:latest

docker tag backend:local ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_BACKEND}:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_BACKEND}:latest
```

Note: authenticate docker to ECR first with `aws ecr get-login-password` or use `aws-actions/amazon-ecr-login` in CI.

## 4) Kubernetes (optional)

- If you prefer Kubernetes instead of ECS, Kubernetes manifests or Helm charts are required:
  - Create Deployment + Service for frontend/backend.
  - Use an Ingress with TLS (In AWS use ALB ingress controller or NGINX ingress + ACM + external DNS).
  - Store secrets in Kubernetes secrets or use external secret managers (IRSA/Secrets Store CSI Driver for AWS Secrets Manager).

This repo is currently deployed to ECS/Fargate; Kubernetes docs are provided here for reference only.

## 5) AWS — ECS / Fargate recommended production flow

Summary of key steps (expanded):

1. Create ECR repositories

- `aws ecr create-repository --repository-name mern-ai-cold-email-gen/frontend`
- `aws ecr create-repository --repository-name mern-ai-cold-email-gen/backend`

2. Push images (see Docker section).

3. Create / update ECS task definitions

- Ensure `containerDefinitions` include correct `image`, `portMappings` and `logConfiguration` (CloudWatch). Ensure `environment` variables are removed and referenced from Secrets Manager where possible.

4. Create or update ECS services

- For each service, set the desired count, network (awsvpc subnets+security groups) and associate the correct target group for ALB.
- If you created `mern-backend-tg`, configure the backend service `loadBalancers` entry to use it (containerName `backend`, containerPort `5000`). Example:

```bash
aws ecs update-service \
  --region eu-central-1 \
  --cluster graceful-deer-j02mm1 \
  --service mern-ai-backend-service \
  --load-balancers '[{"targetGroupArn":"arn:aws:elasticloadbalancing:eu-central-1:211125593865:targetgroup/mern-backend-tg/101248f95cdf20ff","containerName":"backend","containerPort":5000}]' \
  --force-new-deployment
```

5. ALB and path-based routing

- Listener on 443 uses ACM certificate.
- Add a rule: `/api/*` -> backend target group; default route -> frontend target group.

6. ACM certificate

- Request in `eu-central-1` and validate DNS records (CNAME) in GoDaddy.

7. Route53 or Registrar configuration

- If using Route53, create an ALIAS record for the apex and `www` record pointing to ALB. If using GoDaddy, set `www` CNAME to ALB DNS and create forwarding on apex to `https://www.sitesolutions.info`.

8. Secrets Manager / SSM

- Store DB connection strings, JWT secrets, third-party keys in AWS Secrets Manager and reference them from the ECS task definition.

9. IAM

- Task execution role needs s3:GetObject/HeadObject if using S3 env-file; grant least privilege.
- Task role should be scoped to the application needs (DB, Secrets Manager read only, etc).

10. Logging & Monitoring

- Configure each container to write logs to CloudWatch Logs (`awslogs` config). Create CloudWatch alarms for 5xx spike, high CPU, target unhealthy.

11. Backups

- MongoDB Atlas: ensure snapshot/backup schedule is enabled.
- Redis (Upstash): review retention/backup options.

## 6) GoDaddy DNS steps (what we did)

1. Add CNAME for `www` pointing to the ALB DNS name (e.g. `mern-frontend-alb-29796550.eu-central-1.elb.amazonaws.com`).
2. For the apex, either use Route53 ALIAS (preferred) or set GoDaddy forwarding for apex to `https://www.sitesolutions.info`.
3. Wait for propagation and verify with `nslookup www.sitesolutions.info`.

## 7) GitHub Actions CI/CD (what's in the repo)

- File: .github/workflows/deploy-to-aws.yml — builds frontend & backend, pushes to ECR, registers new task definitions, and updates ECS services. Configure these repository secrets:
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_ACCOUNT_ID
  - ECR_REPO_FRONTEND, ECR_REPO_BACKEND
  - FRONTEND_CLUSTER, FRONTEND_SERVICE, BACKEND_CLUSTER, BACKEND_SERVICE
  - FRONTEND_CONTAINER_NAME, BACKEND_CONTAINER_NAME

## 8) Health checks & readiness

- Implement `/health` (HTTP 200) for backend and configure ALB target health path to `/health` (port 5000). Keep health check interval and thresholds conservative while deploying.

## 9) Security & hardening checklist

- Use least-privilege IAM roles.
- Lock security group rules to necessary ports only (443 from internet to ALB; ALB to targets on 80/5000 as needed).
- Ensure ACM certificate only in region of ALB.
- Rotate secrets and use short-lived credentials where possible.

## 10) Troubleshooting (common issues & fixes)

- 405 from Nginx: ALB forwarded `/api/*` to frontend TG — fix by adding path rule `/api/*` -> backend TG or proxy `/api` in frontend nginx.
- 403 S3 HeadObject for env file: update task execution role to allow `s3:HeadObject` and `s3:GetObject` on the env-file object.
- 503 from ALB: target group had no registered (or healthy) targets — ensure ECS service is attached to the TG or register task IPs manually for testing.
- TLS / SNI checks: use `curl --resolve 'www.sitesolutions.info:443:<ALB_IP>' -v https://www.sitesolutions.info` to test SNI to a specific ALB IP.

## 11) Next recommended steps

- Finish CI/CD secret setup and test a full push/deploy cycle.
- Add CloudWatch alarms for production monitoring.
- Consider migrating DNS to Route53 to use ALIAS records for the apex instead of registrar forwarding.
- Add CloudFront in front of ALB if you need CDN, WAF, or improved TLS options.

---

If you want, I can now:

- (A) Commit and push any final changes and run a CI test, or
- (B) Add a `README` summary into `README.md` instead of this `DEPLOYMENT.md`, or
- (C) Create a condensed checklist for the ops team with exact commands and secret names.
