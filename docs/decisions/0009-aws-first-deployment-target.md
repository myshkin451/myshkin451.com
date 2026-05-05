# 0009: AWS-First Deployment Target

Status: Accepted

Date: 2026-05-05

## Context

Myshkin 451 has closed the Phase 2 public-site baseline and is entering deployment and operations
planning.

The owner wants the first real deployment path to support AWS SAA study, so the production target
should be AWS even if a non-AWS managed platform could be simpler for a personal site.

The application is a Next.js 16 and Payload CMS modular monolith with PostgreSQL and media uploads.
It needs a runtime that can serve dynamic public routes, Payload admin/API routes, database-backed
content reads, and durable media storage.

Current AWS service facts affect the decision:

- AWS Amplify Hosting documentation currently describes managed Next.js SSR support through Next.js
  15. This project is already on Next.js 16, so Amplify should not be the first production target
  unless compatibility is revisited.
- AWS App Runner is moving to maintenance for new customers after April 30, 2026. AWS recommends
  Amazon ECS Express Mode as the migration direction for App Runner-like simplicity.
- Amazon ECS Express Mode creates an ECS service on Fargate with a load balancer, SSL/TLS,
  autoscaling, monitoring, and networking from a container image and IAM roles.

## Decision

Use AWS as the first production cloud target.

Plan the first deployment around a containerized application running on Amazon ECS Express Mode over
AWS Fargate, with manual ECS/Fargate plus Application Load Balancer as the fallback if Express Mode
does not fit the account, region, cost, or operational constraints during implementation.

The intended first AWS shape is:

- Amazon ECR for the application container image.
- Amazon ECS Express Mode on Fargate for the Next.js/Payload web application.
- Application Load Balancer managed by the ECS service path.
- Amazon RDS for PostgreSQL as the production database.
- Amazon S3 for Payload media storage, with CloudFront optional after the first launch path is clear.
- AWS Secrets Manager or SSM Parameter Store for runtime secrets and configuration.
- Amazon Route 53 and AWS Certificate Manager for `www.myshkin451.com` DNS and TLS when domain cutover
  begins.
- Amazon CloudWatch for logs, metrics, and initial alarms.

Keep deployment automation out of this decision. The next slice should produce a manual launch
runbook and implementation prerequisites before any CI/CD or infrastructure-as-code work.

## Alternatives Considered

- AWS Amplify Hosting:
  - Attractive for a Next.js-first deployment, but not the first target while this repository is on
    Next.js 16 and the current documented managed Next.js SSR support is through Next.js 15.
- AWS App Runner:
  - Operationally simple for a containerized web app, but it is no longer a good new-project target
    because AWS is closing App Runner to new customers and points customers toward ECS Express Mode.
- Manual Amazon ECS on Fargate with an Application Load Balancer:
  - More explicit and excellent for learning SAA concepts, but a little more infrastructure shape to
    choose before the first launch. Keep it as the fallback and later deepening path.
- EC2 or Lightsail:
  - Useful for server fundamentals, but it would teach more host administration than managed AWS
    application operations. This project benefits more from managed database, container, IAM,
    networking, and observability concepts first.
- Non-AWS managed platforms:
  - Potentially faster for a personal site, but they do not serve the owner's AWS learning goal.

## Non-Goals

- Do not implement deployment automation in this decision.
- Do not add Terraform, CDK, or CloudFormation yet.
- Do not change CMS models, public content models, or Payload admin behavior.
- Do not connect production AWS resources from local code in this decision.
- Do not finalize CDN, ISR, or revalidation behavior here.

## Consequences

- Positive: The deployment path now aligns with both the project and AWS SAA study.
- Positive: ECS/Fargate, RDS, S3, IAM, Secrets, Route 53, ACM, ALB, and CloudWatch become concrete
  learning surfaces instead of abstract exam topics.
- Positive: App Runner is avoided before it becomes a maintenance-mode dependency for a new project.
- Negative: The first deployment will be more complex than a non-AWS personal-site host.
- Negative: ECS Express Mode is newer than the lower-level ECS path, so the first implementation must
  preserve a manual ECS/Fargate fallback.
- Follow-up: Write the manual AWS launch runbook and implementation prerequisites, including Docker
  image shape, production environment variables, RDS setup, S3 media storage, health checks, and
  rollback expectations.

## References Checked

- AWS Amplify Hosting Next.js SSR support:
  <https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html>
- AWS App Runner availability change:
  <https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html>
- Amazon ECS Express Mode:
  <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html>
- Amazon RDS for PostgreSQL:
  <https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html>
- Amazon S3 objects overview:
  <https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingObjects.html>
