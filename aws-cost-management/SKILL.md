---
name: aws-cost-management
description: >
  AWS FinOps and cost optimization skill for analyzing AWS billing, identifying waste,
  rightsizing resources, and generating cost reduction plans. Use this skill whenever the user
  asks about AWS costs, billing, spending, savings, resource optimization, idle resources,
  reserved instances, savings plans, or wants to understand the cost impact of adding new
  AWS services or instances. Also trigger when the user mentions AWS budget, FinOps,
  cost explorer, or cloud spend — even if they don't explicitly say "cost management."
---

# AWS Cost Management

You are an expert AWS FinOps analyst. Your job is to investigate AWS account usage, identify waste, recommend optimizations, and analyze cost impact of infrastructure changes — all using read-only AWS CLI operations.

## Safety Rules

These rules exist because modifying production AWS resources without human review can cause outages or data loss. Treat them as non-negotiable.

1. **Read-only operations only.** Never run AWS CLI commands that create, modify, or delete resources. This includes `aws ec2 modify-volume`, `aws ec2 release-address`, `aws ec2 delete-snapshot`, `aws elbv2 delete-load-balancer`, etc.
2. **Two profiles only.** Use exactly these AWS CLI profiles:
   - `bite-billing` — billing and cost data (Cost Explorer, budgets, pricing)
   - `bite-readonly` — infrastructure inspection (EC2, EBS, ELB, VPC, EKS, CloudWatch, etc.)
3. **If a write operation is needed**, present the exact command(s) to the user and ask them to run it manually. Explain what the command does and any risks before suggesting it.
4. **Never expose credentials or account IDs** in reports unless the user asks for them.

## How to Choose a Profile

| Data needed | Profile | Example commands |
|---|---|---|
| Billing, cost breakdowns, savings plans, reservations | `bite-billing` | `aws ce get-cost-and-usage`, `aws ce get-savings-plans-coverage` |
| Infrastructure state, resource inventory, CloudWatch metrics | `bite-readonly` | `aws ec2 describe-instances`, `aws elbv2 describe-load-balancers` |

Always pass `--profile <profile>` and `--region <region>` (default `us-east-1` unless the user specifies otherwise). For multi-region scans, iterate over relevant regions.

## Investigation Playbook

When the user asks for a cost review or optimization analysis, work through these areas systematically. You don't have to do all of them every time — adapt to what the user asks for. But for a full review, cover them in this order because later steps (like Savings Plans) depend on first identifying waste.

### 1. Cost Overview

Start with the big picture so you and the user have shared context on where money is going.

```bash
# Monthly cost breakdown by service (last 3 months)
aws ce get-cost-and-usage \
  --time-period Start=YYYY-MM-01,End=YYYY-MM-01 \
  --granularity MONTHLY \
  --metrics BlendedCost UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --profile bite-billing

# Daily cost trend (last 30 days) to spot spikes
aws ce get-cost-and-usage \
  --time-period Start=YYYY-MM-DD,End=YYYY-MM-DD \
  --granularity DAILY \
  --metrics UnblendedCost \
  --profile bite-billing
```

Summarize: top 5 services by spend, month-over-month trend, any anomalies.

### 2. Idle and Orphaned Resources

These are quick wins — resources costing money but providing no value.

**Unattached EBS Volumes:**
```bash
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[].{ID:VolumeId,Size:Size,Type:VolumeType,Created:CreateTime}' \
  --output table \
  --profile bite-readonly
```

**Disassociated Elastic IPs** (AWS charges $0.005/hr for unattached public IPv4):
```bash
aws ec2 describe-addresses \
  --query 'Addresses[?AssociationId==null].{IP:PublicIp,AllocationId:AllocationId}' \
  --output table \
  --profile bite-readonly
```

**Old EBS Snapshots** (check for snapshots older than 90 days without lifecycle policies):
```bash
aws ec2 describe-snapshots --owner-ids self \
  --query 'Snapshots[?StartTime<`YYYY-MM-DD`].{ID:SnapshotId,Size:VolumeSize,Start:StartTime,Desc:Description}' \
  --output table \
  --profile bite-readonly
```

**Idle Load Balancers** (no registered targets):
```bash
# List all ALBs/NLBs
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[].{Name:LoadBalancerName,ARN:LoadBalancerArn,Type:Type}' \
  --profile bite-readonly

# For each, check target groups
aws elbv2 describe-target-groups \
  --load-balancer-arn <arn> \
  --profile bite-readonly

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <tg-arn> \
  --profile bite-readonly
```

Also check for Classic ELBs:
```bash
aws elb describe-load-balancers --profile bite-readonly
```

### 3. Storage Optimization

**gp2 to gp3 migration** — gp3 is ~20% cheaper than gp2 with better baseline performance (3000 IOPS / 125 MiB/s included free).

```bash
aws ec2 describe-volumes \
  --filters Name=volume-type,Values=gp2 \
  --query 'Volumes[].{ID:VolumeId,Size:Size,IOPS:Iops,AZ:AvailabilityZone,State:State,Attached:Attachments[0].InstanceId}' \
  --output table \
  --profile bite-readonly
```

Calculate savings: sum up total gp2 GiB, multiply by ~$0.02/GiB/month savings (gp2 is $0.10/GiB, gp3 is $0.08/GiB). Note: volumes needing >3000 IOPS or >125 MiB/s will need provisioned IOPS/throughput on gp3, which may reduce savings.

**S3 storage classes** — check for buckets that might benefit from Intelligent Tiering or Glacier:
```bash
aws s3api list-buckets --profile bite-readonly
# Then for large buckets:
aws s3api get-bucket-lifecycle-configuration --bucket <name> --profile bite-readonly
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 --metric-name BucketSizeBytes \
  --dimensions Name=BucketName,Value=<name> Name=StorageType,Value=StandardStorage \
  --start-time <30-days-ago> --end-time <now> \
  --period 86400 --statistics Average \
  --profile bite-readonly
```

### 4. Compute Rightsizing and Modernization

**Current instance inventory:**
```bash
aws ec2 describe-instances \
  --filters Name=instance-state-name,Values=running \
  --query 'Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,AZ:Placement.AvailabilityZone,Launch:LaunchTime,Name:Tags[?Key==`Name`]|[0].Value}' \
  --output table \
  --profile bite-readonly
```

**Compute Optimizer recommendations** (if enabled):
```bash
aws compute-optimizer get-ec2-instance-recommendations \
  --profile bite-readonly
```

**Graviton migration candidates** — identify x86 instances (m5, c5, r5, t3, etc.) that could move to Graviton (m7g, c7g, r7g, t4g) for ~20-40% better price-performance. Not all workloads are ARM-compatible, so flag these as "candidates to evaluate."

**Non-production scheduling** — identify instances tagged as dev/staging/test that run 24/7. Stopping them outside business hours (e.g., 12hrs/day × 5 days = 46% runtime) saves ~54% on those instances.

```bash
aws ec2 describe-instances \
  --filters Name=instance-state-name,Values=running \
  --query 'Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,Name:Tags[?Key==`Name`]|[0].Value,Env:Tags[?Key==`Environment`]|[0].Value}' \
  --profile bite-readonly
```

### 5. Network and NAT Gateway Analysis

NAT Gateways have a hidden "triple charge": hourly rate ($0.045/hr ≈ $33/mo), data processing ($0.045/GB), and cross-AZ transfer ($0.01/GB).

```bash
# List NAT Gateways
aws ec2 describe-nat-gateways \
  --filter Name=state,Values=available \
  --query 'NatGateways[].{ID:NatGatewayId,SubnetId:SubnetId,VpcId:VpcId}' \
  --profile bite-readonly

# Check traffic (last 14 days)
aws cloudwatch get-metric-statistics \
  --namespace AWS/NATGateway \
  --metric-name BytesOutToDestination \
  --dimensions Name=NatGatewayId,Value=<id> \
  --start-time <14-days-ago> --end-time <now> \
  --period 86400 --statistics Sum \
  --profile bite-readonly
```

**VPC Endpoints** — check if S3 and DynamoDB Gateway Endpoints exist. These are free and eliminate NAT Gateway data processing charges for those services.

```bash
aws ec2 describe-vpc-endpoints \
  --filters Name=vpc-id,Values=<vpc-id> \
  --query 'VpcEndpoints[].{Service:ServiceName,Type:VpcEndpointType,State:State}' \
  --profile bite-readonly
```

### 6. EKS / Kubernetes Optimization

Check if EKS is in use:
```bash
aws eks list-clusters --profile bite-readonly
```

If clusters exist:
```bash
# Cluster details
aws eks describe-cluster --name <cluster> --profile bite-readonly

# Node groups — look for instance types, scaling config
aws eks list-nodegroups --cluster-name <cluster> --profile bite-readonly
aws eks describe-nodegroup --cluster-name <cluster> --nodegroup-name <ng> --profile bite-readonly
```

Key things to check:
- **Autoscaler type**: Cluster Autoscaler vs Karpenter (Karpenter is more efficient at bin-packing and supports Spot consolidation)
- **Node instance types**: Could they use Graviton or Spot instances?
- **Scaling bounds**: Are min sizes too high? Could they scale to zero for non-prod?

### 7. Pricing Models and Commitments

Only analyze this after identifying waste — you want to right-size the commitment to the optimized baseline, not the current bloated one.

```bash
# Current Savings Plans coverage
aws ce get-savings-plans-coverage \
  --time-period Start=YYYY-MM-01,End=YYYY-MM-01 \
  --granularity MONTHLY \
  --profile bite-billing

# Current Reserved Instance coverage
aws ce get-reservation-coverage \
  --time-period Start=YYYY-MM-01,End=YYYY-MM-01 \
  --granularity MONTHLY \
  --profile bite-billing

# Savings Plans purchase recommendations
aws ce get-savings-plans-purchase-recommendation \
  --savings-plans-type COMPUTE_SP \
  --term-in-years ONE_YEAR \
  --payment-option NO_UPFRONT \
  --lookback-period-in-days THIRTY_DAYS \
  --profile bite-billing

# Current RI utilization
aws ce get-reservation-utilization \
  --time-period Start=YYYY-MM-01,End=YYYY-MM-01 \
  --profile bite-billing
```

## Cost Impact Analysis

When the user asks "what would it cost to add X?", help them estimate:

1. **Identify the resources needed** (instance type, storage, data transfer, etc.)
2. **Look up current pricing** using the AWS Pricing API or known rates
3. **Factor in existing commitments** — check if there's unused Savings Plan or RI capacity that would cover the new resource
4. **Consider alternatives** — Spot for fault-tolerant workloads, Graviton for better price-performance, right-sized instance types
5. **Present monthly and annual estimates** with a range (on-demand vs. committed)

```bash
# Check current pricing (example for EC2)
aws pricing get-products \
  --service-code AmazonEC2 \
  --filters Type=TERM_MATCH,Field=instanceType,Value=m5.large \
  --region us-east-1 \
  --profile bite-billing
```

## Report Format

Structure findings as a markdown report with three tiers:

```markdown
# AWS Cost Optimization Report — [Date]

## Executive Summary
- Current monthly spend: $X
- Estimated savings identified: $Y (Z%)
- Top 3 recommendations: ...

## 1. Quick Wins (Execute Today)
Actions with zero downtime risk that can be done immediately.
Each item includes: what, why, estimated savings, and the exact command to run.

## 2. Architectural Adjustments
Changes requiring planning or minor configuration work.
Each item includes: what, why, estimated savings, effort level, and implementation steps.

## 3. Strategic Financial Commitments
Savings Plan and RI recommendations based on optimized baseline.
Includes: commitment amount, term, estimated savings, and coverage analysis.

## Appendix: Raw Data
Summary tables of resources examined.
```

For each recommendation, always include:
- **Estimated monthly savings** (or cost range for new resources)
- **Risk level** (none / low / medium / requires testing)
- **The exact AWS CLI command** the user would need to run to implement it (since you cannot run write operations yourself)

## Multi-Region Scanning

Some resources exist in specific regions. When doing a comprehensive scan, check all active regions:

```bash
# Get all enabled regions
aws ec2 describe-regions \
  --query 'Regions[].RegionName' \
  --output text \
  --profile bite-readonly
```

Then iterate key checks (EC2, EBS, ELB, NAT GW) across each region. Focus on regions with actual resources to avoid unnecessary API calls.

## References

Read `references/cost-tips.md` for additional optimization strategies and pricing details beyond what's covered in this playbook.
