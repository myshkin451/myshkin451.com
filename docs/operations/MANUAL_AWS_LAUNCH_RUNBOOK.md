# Manual AWS Launch Runbook

Status: Draft manual runbook
Last updated: 2026-05-05

Related records:

- `docs/decisions/0009-aws-first-deployment-target.md`
- `docs/operations/DEPLOYMENT_AND_OPERATIONS_PLAN.md`

This runbook is the manual launch path for the first AWS production deployment of Myshkin 451.
It is intentionally not deployment automation. Do not create resources, change DNS, or connect
production services until the preflight checklist is complete and the owner has explicitly accepted
the launch timing.

## Scope And Guardrails

The preferred compute path is Amazon ECS Express Mode on AWS Fargate. It keeps the first launch
close to the accepted AWS-first decision while still exposing the real AWS surfaces: ECR, ECS,
Fargate, ALB, RDS, S3, IAM, Secrets Manager or SSM Parameter Store, Route 53, ACM, and CloudWatch.

Keep manual Amazon ECS on Fargate behind an Application Load Balancer as the fallback path. Use the
fallback if Express Mode is unavailable, too opaque for the launch, too costly in the chosen region,
or blocks required networking, health-check, custom-domain, logging, or rollback behavior.

Non-goals for this runbook:

- Do not create AWS resources from this repository.
- Do not add CI/CD, Terraform, CDK, CloudFormation, or shell deployment scripts.
- Do not add new CMS collections, fields, permissions, comments, messages, or workflow models.
- Do not migrate the local development database as production data.
- Do not commit real environment values, endpoints, ARNs, account IDs, secrets, or DNS validation
  records.

## Launch Journal

Create a private launch journal outside Git before touching AWS. Record every resource name, ARN,
endpoint, image digest, secret path, DNS value, and rollback point there. The public repository may
use placeholder examples only.

| Record | Why It Matters |
| --- | --- |
| AWS account alias and account ID | Confirms the target account before resource creation. |
| Primary Region | Keeps ECR, ECS, RDS, S3, ACM for ALB, logs, and DNS choices aligned. |
| Naming prefix | Keeps resources searchable, for example `myshkin451-prod-*`. |
| Git commit SHA | Ties the deployed image back to reviewed source. |
| ECR repository URI | Identifies the container source for ECS. |
| Image tag and immutable digest | Enables exact application rollback. |
| Task execution role ARN | Lets ECS pull from ECR and write container logs. |
| Infrastructure role ARN | Required for ECS Express Mode service orchestration. |
| Task role ARN | Lets the application read or write AWS services such as S3. |
| RDS instance identifier and endpoint | Required for `DATABASE_URL` and database operations. |
| RDS snapshot identifiers | Required before launch and before risky changes. |
| S3 bucket name, Region, and prefix | Owns production media storage. |
| Secret or parameter names | Keeps real values out of task definitions and docs. |
| CloudWatch log group names | Gives launch verification and rollback evidence. |
| Express service ARN and URL | Primary compute record for the preferred path. |
| Manual ECS cluster, service, task definition, target group, and ALB DNS name | Required if the fallback path is used. |
| ACM certificate ARN and validation method | Required before serving `www.myshkin451.com` over HTTPS. |
| Route 53 hosted zone ID and record names | Required for domain cutover and DNS rollback. |
| Previous DNS target and TTL | Enables DNS rollback if cutover fails. |

## Preflight Checklist

This checklist must be complete before the first production launch. A missing item should block AWS
resource creation unless the owner explicitly accepts the residual risk.

| Gate | Required Evidence |
| --- | --- |
| Repository state | `main` is clean, intended changes are committed, and CI is green or the failed check is understood. |
| Local checks | Format check, lint, typecheck, integration tests, production build, and browser e2e have passed for the launch commit. |
| Container build path | A production Docker image path exists, is documented, and can run the app with `pnpm start` or an accepted runtime command. |
| Runtime port | Container port is recorded, expected to be `3000` unless the container path chooses another value. |
| Health check | A stable health-check path exists. Root `/` may be used only as a temporary launch risk; a dedicated `/api/health` path should be preferred before production traffic. |
| Production data policy | Production starts from a clean database or from reviewed public content only. Local proof records and test users are excluded. |
| RDS plan | PostgreSQL version, instance class, storage, backup retention, maintenance window, security group, subnet group, and snapshot plan are chosen. |
| Media plan | Payload media storage has a production S3 implementation plan or merged implementation. Local filesystem media is not used for production. |
| Secrets plan | Secret names, owning service, rotation expectations, and task injection method are defined before values are entered. |
| IAM plan | Separate task execution role and task role are planned. S3 permissions belong on the task role, not static AWS keys. |
| Network plan | Public ingress, private database access, security groups, and outbound path for image pulls, logs, secrets, and S3 are understood. |
| DNS plan | `www.myshkin451.com` cutover target, previous target, TTL, hosted zone, and ACM DNS validation approach are recorded. |
| Observability plan | CloudWatch log group, service metrics, ALB 5xx alarm, target health check, and RDS storage or CPU alarm are defined. |
| Rollback plan | Previous image digest, previous task definition or Express service config, pre-launch RDS snapshot, S3 versioning decision, and DNS rollback target are recorded. |
| Cost guardrail | AWS Budgets or at least a manual monthly cost ceiling has been set for ECS/Fargate, ALB, RDS, NAT or VPC endpoints, CloudWatch, and data transfer. |
| Owner gate | The owner accepts launch timing, DNS cutover risk, production data policy, and any known gaps. |

Current known blockers before a real launch:

- The repository does not yet have a production Dockerfile or image publishing procedure.
- Payload still uses local filesystem media by default; S3 media storage is not implemented yet.
- The app does not yet expose a dedicated health-check endpoint.
- Public-route caching remains intentionally dynamic under decision `0008`; revisit this before
  production traffic.

## Environment Values To Record

Record values in the private launch journal and store secrets in AWS Secrets Manager or SSM Parameter
Store. Do not commit real values.

| Name | Secret | Current Status | Production Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Used by Payload PostgreSQL adapter. | Use the RDS PostgreSQL endpoint, database name, app user, strong password, and SSL mode if required by the chosen RDS settings. |
| `PAYLOAD_SECRET` | Yes | Used by Payload. | Generate a long production-only value. Changing it can invalidate signed Payload state, so record rotation impact before launch. |
| `NEXT_PUBLIC_SITE_URL` | No | Used by metadata, sitemap, and tests. | Use `https://www.myshkin451.com` for production cutover. Use the Express URL only before domain cutover if necessary. |
| `NODE_ENV` | No | Implied by production runtime. | Set to `production` in the container runtime if the image or command does not already do it. |
| `PORT` | No | Not currently required by code. | Record the container listener port. Use `3000` unless the production image chooses a different port. |
| `AWS_REGION` | No | Future S3/media implementation value. | Set to the production Region used by the app runtime. |
| S3 bucket variable | No | Not implemented yet. | Add the final variable name when Payload S3 media storage is implemented. Expected value is the production media bucket. |
| S3 prefix variable | No | Not implemented yet. | Optional prefix such as `media/production/` if the storage adapter supports it. |
| S3 public base URL variable | No | Not implemented yet. | Optional. Use only if the media implementation requires a public URL base or CDN origin. |
| AWS access keys | Yes | Should not be used for ECS tasks. | Prefer task role permissions for S3 and AWS API access. Static keys are not the launch default. |
| `BASE_URL` | No | Used by browser tests only. | Do not treat as a production runtime requirement unless a future implementation adds it. |

When the S3 media implementation lands, update this table with the exact variable names used by the
code.

## Resource Order

Use this order for the manual launch. It keeps the rollback path visible and avoids wiring compute
to unstable data or media resources.

| Step | Resource | Manual Action | Output To Record |
| --- | --- | --- | --- |
| 1 | Account and Region | Confirm target account, primary Region, service availability, budget, and naming prefix. | Account alias, account ID, Region, budget owner. |
| 2 | ECR | Create the private repository after the container build path exists. Push one image built from the launch commit. | Repository URI, image tag, immutable digest, commit SHA. |
| 3 | IAM | Create or select the ECS task execution role, ECS Express infrastructure role, and application task role. | Role ARNs, attached policies, trust policies. |
| 4 | Network | Confirm VPC, subnets, security groups, and outbound path. For manual fallback, prefer public ALB, private Fargate tasks, and private RDS. | VPC ID, subnet IDs, security group IDs, outbound approach. |
| 5 | RDS PostgreSQL | Create the production PostgreSQL instance or cluster, app database, app user, backup retention, and initial snapshot. | Endpoint, port, database, app user name, snapshot ID, backup window. |
| 6 | S3 media | Create the media bucket after the media implementation is ready. Keep Block Public Access on unless a reviewed design requires otherwise. | Bucket name, Region, prefix, encryption setting, versioning decision. |
| 7 | Secrets and parameters | Store `DATABASE_URL`, `PAYLOAD_SECRET`, and future media settings. Use task injection rather than plain task definition values for secrets. | Secret or parameter names and versions, not values. |
| 8 | CloudWatch | Create or confirm log groups and initial alarms before the service receives public traffic. | Log group names, alarm names, dashboard link if used. |
| 9 | ECS Express Mode | Create the Express Mode service from the ECR image, execution role, infrastructure role, task role, port, health path, environment, and secrets. | Service ARN, generated URL, cluster, task definition, managed ALB resources. |
| 10 | Express URL verification | Verify the generated HTTPS URL before DNS cutover. | Response checks, target health, logs, image digest, task count. |
| 11 | ACM | Request or select the public certificate for `www.myshkin451.com` in the same Region as the ALB. Prefer DNS validation. | Certificate ARN and validation record names. |
| 12 | Route 53 | After service verification, add the custom domain to the Express-managed ALB listener and create the Route 53 alias record. | Hosted zone ID, record name, record target, prior record, TTL. |
| 13 | Post-cutover verification | Re-run the production verification checklist on `https://www.myshkin451.com`. | Timestamped verification evidence and residual risks. |

## Preferred Path: ECS Express Mode On Fargate

Use ECS Express Mode first because ADR `0009` accepts it as the intended path. The service should be
created only after ECR, IAM, RDS, S3, secrets, and CloudWatch decisions are ready.

Manual creation notes:

- Use the ECR image URI with an immutable digest or a tag mapped to the launch commit.
- Use the task execution role for ECR pulls, secret injection, and CloudWatch logs.
- Use the infrastructure role required by ECS Express Mode.
- Use a separate task role for application access to S3 media storage.
- Configure container port `3000` unless the production container chooses another port.
- Configure environment and secrets explicitly. Secrets should be injected from Secrets Manager or
  SSM Parameter Store.
- Configure the health-check path. Prefer a dedicated health endpoint once implemented.
- Start with a small task size and minimum task count that matches cost and availability goals.
- Keep generated resources visible in the launch journal: cluster, task definition, service, load
  balancer, listener, target group, log group, and alarms.
- Treat direct edits to Express-managed resources as a manual override. Record them, because direct
  edits can affect how Express Mode manages coordinated updates.

Express Mode should return a generated HTTPS URL. Verify the app on that URL before adding the
custom domain.

Express Mode custom domain notes:

- Request an ACM certificate for `www.myshkin451.com`, preferably with DNS validation.
- Add the custom host condition and certificate to the Express-managed ALB listener only after the
  generated URL is healthy.
- Point Route 53 to the Express-managed Application Load Balancer with an alias record.
- Record the previous DNS value and TTL before cutover.

## Fallback Path: Manual ECS/Fargate With ALB

Use this path if Express Mode is blocked or if the owner chooses the more explicit SAA learning path
before launch.

Manual fallback sequence:

| Step | Resource | Notes |
| --- | --- | --- |
| 1 | ECR image | Reuse the same image and digest prepared for Express Mode. |
| 2 | CloudWatch log group | Create the log group before the task definition, with retention chosen intentionally. |
| 3 | IAM roles | Use a task execution role for ECR, logs, and secret injection; use a separate task role for S3. |
| 4 | ECS cluster | Create a small production cluster with Fargate capacity. |
| 5 | Task definition | Use `awsvpc`, Fargate compatibility, CPU and memory sizing, container port, `awslogs`, environment, and secrets. |
| 6 | ALB security group | Allow public HTTP/HTTPS only as required. Prefer redirecting HTTP to HTTPS after cert setup. |
| 7 | App security group | Allow inbound traffic only from the ALB security group on the app port. |
| 8 | RDS security group | Allow inbound PostgreSQL only from the app security group. |
| 9 | Target group | Use target type `ip`, protocol HTTP, app port, and a stable health-check path. |
| 10 | ALB listener | Use HTTPS with ACM certificate. Use HTTP only for redirect or temporary verification. |
| 11 | ECS service | Run tasks in the chosen app subnets, attach target group, and use rolling deployment settings. |
| 12 | Route 53 | Use an alias record to the ALB after target health and app checks pass. |

Preferred fallback topology is:

- Public subnets for the ALB.
- Private app subnets for Fargate tasks.
- Private database subnets for RDS.
- Outbound access through NAT or VPC endpoints for ECR, CloudWatch Logs, Secrets Manager or SSM, and
  S3.

If cost constraints force a simpler first topology with public Fargate tasks, restrict inbound
traffic to the ALB security group, do not expose RDS publicly, and record the choice as a temporary
risk.

## Verification Steps

Run verification in three passes: before DNS cutover, after DNS cutover, and after the first
production content update.

| Area | Checks |
| --- | --- |
| ECS service | Desired task count equals running healthy task count. The running task uses the recorded image digest. |
| Load balancer | Target group is healthy. Health checks use the expected path and return the expected status. |
| Logs | CloudWatch shows application startup logs, no repeated boot loops, and no secret values printed. |
| Database | Application can read from and write to RDS through Payload without using local data. |
| Media | Admin upload writes to S3 and public media renders from the chosen production media path. |
| Public routes | `/`, `/about`, `/articles`, `/projects`, `/knowledge`, `/labs`, `robots.txt`, and `sitemap.xml` respond successfully. |
| Content visibility | Draft and future-dated records stay hidden. Published records with `publishedAt <= now` render. |
| Admin | `/admin` loads over HTTPS and the production admin account policy is understood. |
| Metadata | Canonical URLs and Open Graph URLs use `https://www.myshkin451.com` after cutover. |
| DNS and TLS | `www.myshkin451.com` resolves to the intended ALB target and serves a valid ACM certificate. |
| Alarms | CloudWatch alarms exist and can be found by name; notification destination is known even if automated paging is not configured yet. |

Do not create throwaway public production posts as test data. Use reviewed first public content, a
private draft, or a staging environment for destructive content checks.

## Rollback Steps

Prefer the smallest rollback that matches the failure.

| Failure | Manual Rollback |
| --- | --- |
| New image fails before DNS cutover | Update Express Mode or the manual ECS service back to the previous image digest. Keep DNS pointed at the old target. |
| New image fails after DNS cutover | Revert the service to the previous image digest, watch target health, then re-run public route checks. |
| Bad environment value | Restore the previous secret or parameter version, force a new deployment, and verify logs without printing secret values. |
| Bad custom domain cutover | Restore the previous Route 53 record target and TTL. Keep the generated Express URL or ALB DNS name for diagnosis. |
| Bad database migration or destructive data issue | Stop writes, snapshot current state for forensics, restore the pre-launch snapshot to a new RDS instance, update `DATABASE_URL`, and redeploy only after the owner accepts possible data loss. |
| Bad media change | Restore S3 object versions if versioning is enabled, or point app/media config back to the previous known-good bucket or prefix if available. |
| Security exposure | Remove the public route or tighten the security group first, then rotate affected secrets and redeploy. |
| Uncontrolled cost or runaway errors | Scale the ECS service down or remove DNS traffic temporarily, then investigate from CloudWatch logs and metrics. |

Rollback evidence to record:

- Who approved rollback.
- Triggering symptom and timestamp.
- Previous image digest or configuration version.
- RDS snapshot or restored instance identifier if data was involved.
- DNS record before and after rollback.
- Verification checks after rollback.
- Follow-up fix owner.

## AWS SAA Learning Points

Tie study notes to this runbook rather than adding AWS services only for exam coverage.

| AWS Topic | Platform Surface | SAA Concepts To Practice |
| --- | --- | --- |
| IAM roles | ECS execution role, Express infrastructure role, app task role | Separation of task execution role vs task role, trust policies, least privilege. |
| ECR | Application image registry | Image tags vs digests, repository permissions, lifecycle cleanup, regional registries. |
| ECS and Fargate | Next.js/Payload runtime | Services, tasks, task definitions, deployment rollout, CPU and memory sizing, serverless containers. |
| Express Mode | Preferred compute path | Managed defaults, transparent underlying resources, when to accept abstraction and when to fall back. |
| ALB | Public HTTP/HTTPS entry point | Listener rules, target groups, health checks, 5xx metrics, TLS termination. |
| VPC and security groups | App, ALB, and RDS traffic boundaries | Public vs private subnets, security group referencing, NAT vs VPC endpoints, database isolation. |
| RDS PostgreSQL | Production content database | Backups, snapshots, restore, maintenance windows, Multi-AZ tradeoffs, SSL connections. |
| S3 | Payload media storage | Object storage, Block Public Access, encryption defaults, versioning, lifecycle, IAM access through task role. |
| Secrets Manager or SSM | Runtime secrets | Secret injection into ECS, versioning, rotation planning, avoiding static AWS keys. |
| Route 53 | `www.myshkin451.com` DNS | Hosted zones, alias records to ALB, TTL, cutover and rollback. |
| ACM | Public TLS certificate | DNS validation, certificate Region for ALB, renewal requirements. |
| CloudWatch | Logs, metrics, alarms | ECS logs, ALB 4xx/5xx, CPU and memory, RDS metrics, alarm-driven rollback evidence. |
| Backup and recovery | RDS snapshots, S3 versions, image rollback | RPO/RTO thinking, restore drills, data-loss acceptance. |
| Cost management | First production footprint | Budgets, Fargate/ALB/RDS/NAT/CloudWatch cost drivers, right-sizing. |

## References

- Amazon ECS Express Mode:
  <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html>
- Creating an Amazon ECS Express Mode service:
  <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-create-full.html>
- Express Mode direct resource customization and custom domain notes:
  <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-advanced-customization.html>
- Amazon ECS task execution IAM role:
  <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html>
- Amazon ECS task IAM role:
  <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html>
- Pushing images to Amazon ECR:
  <https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-push.html>
- Amazon RDS for PostgreSQL:
  <https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html>
- Amazon S3 Block Public Access:
  <https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html>
- ACM DNS validation:
  <https://docs.aws.amazon.com/acm/latest/userguide/domain-ownership-validation.html>
- Route 53 alias records to load balancers:
  <https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-elb-load-balancer.html>
- Application Load Balancer target health checks:
  <https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html>
- Sending Amazon ECS logs to CloudWatch:
  <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/using_awslogs.html>
