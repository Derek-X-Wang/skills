# AWS Cost Optimization Reference

Additional strategies and pricing details to supplement the main playbook.

## Table of Contents
1. [EBS Pricing Quick Reference](#ebs-pricing)
2. [EC2 Instance Family Comparison](#ec2-families)
3. [Data Transfer Costs](#data-transfer)
4. [S3 Storage Classes](#s3-storage)
5. [Savings Plans vs Reserved Instances](#sp-vs-ri)
6. [Common Hidden Costs](#hidden-costs)
7. [Cost Allocation Tags](#cost-tags)

---

## EBS Pricing Quick Reference {#ebs-pricing}

| Volume Type | Price ($/GiB/mo) | Baseline IOPS | Baseline Throughput | Notes |
|---|---|---|---|---|
| gp3 | $0.08 | 3,000 (free) | 125 MiB/s (free) | Best general purpose value |
| gp2 | $0.10 | 3 per GiB (min 100) | Up to 250 MiB/s (burst) | Legacy, migrate to gp3 |
| io2 | $0.125 + IOPS | Up to 256,000 | 4,000 MiB/s | High-performance databases |
| st1 | $0.045 | N/A | 40 MiB/s per TiB | Sequential throughput workloads |
| sc1 | $0.015 | N/A | 12 MiB/s per TiB | Cold storage, infrequent access |

**gp2 → gp3 migration**: No downtime via Elastic Volumes. Saves 20% on storage. If the gp2 volume uses fewer than 3000 IOPS, gp3 is a straight upgrade. If it uses more, you'll need to provision additional IOPS on gp3 at $0.005/IOPS/mo.

## EC2 Instance Family Comparison {#ec2-families}

### Graviton (ARM64) Equivalents

| x86 Family | Graviton Equivalent | Typical Savings |
|---|---|---|
| m5 / m6i | m7g / m6g | 20-40% |
| c5 / c6i | c7g / c6g | 20-40% |
| r5 / r6i | r7g / r6g | 20-40% |
| t3 | t4g | 20% |

**Compatibility notes**: Most Linux workloads, containers, and interpreted languages (Node.js, Python, Java) work on Graviton without changes. Native compiled code needs ARM64 builds. Check for x86-specific dependencies before migrating.

### Burstable vs Fixed Performance

- **t3/t4g** (burstable): Good for variable workloads. Monitor CPU credits — if consistently depleting credits, switch to m-family.
- **m-family** (general purpose): Steady-state workloads with balanced compute/memory.
- **c-family** (compute optimized): CPU-bound workloads (batch processing, encoding).
- **r-family** (memory optimized): Memory-bound workloads (caches, in-memory databases).

## Data Transfer Costs {#data-transfer}

| Transfer Type | Cost |
|---|---|
| Inbound from internet | Free |
| Outbound to internet (first 100 GB/mo) | Free |
| Outbound to internet (next 10 TB/mo) | $0.09/GB |
| Same AZ (private IP) | Free |
| Cross-AZ (same region) | $0.01/GB each way |
| Cross-region | $0.02/GB |
| NAT Gateway processing | $0.045/GB |
| VPC Gateway Endpoint (S3, DynamoDB) | Free |
| VPC Interface Endpoint | $0.01/GB + $0.01/hr/AZ |

**Key insight**: Cross-AZ traffic is often invisible but expensive at scale. Services in multiple AZs for HA generate cross-AZ charges. Consider AZ-affinity for internal traffic where HA isn't critical.

## S3 Storage Classes {#s3-storage}

| Class | Storage ($/GB/mo) | Retrieval | Best for |
|---|---|---|---|
| Standard | $0.023 | Free | Frequently accessed |
| Intelligent-Tiering | $0.023 (frequent) | Free | Unknown access patterns |
| Standard-IA | $0.0125 | $0.01/GB | Monthly access |
| One Zone-IA | $0.01 | $0.01/GB | Reproducible infrequent data |
| Glacier Instant | $0.004 | $0.03/GB | Quarterly access, ms retrieval |
| Glacier Flexible | $0.0036 | $0.03-10/GB | Annual access, min-hr retrieval |
| Glacier Deep Archive | $0.00099 | $0.02/GB | 1-2x/year, 12hr retrieval |

**Recommendation**: Enable S3 Intelligent-Tiering on buckets with unpredictable access. It automatically moves objects between tiers with no retrieval fees. The monitoring fee ($0.0025/1000 objects/mo) is minimal.

## Savings Plans vs Reserved Instances {#sp-vs-ri}

| Feature | Savings Plans | Reserved Instances |
|---|---|---|
| Flexibility | Any instance family/region/OS (Compute SP) | Specific instance type + AZ |
| Max discount | Up to 72% | Up to 72% |
| Applies to | EC2, Fargate, Lambda | EC2 only |
| Exchangeable? | No (but flexible by design) | Yes (with limitations) |

**Strategy**:
1. Cover your stable baseline with **Compute Savings Plans** (most flexible)
2. For databases with fixed instance types, consider **EC2 Instance Savings Plans** (slightly deeper discount)
3. Use **On-Demand** for variable/spiky workloads
4. Use **Spot** for fault-tolerant batch/CI workloads (up to 90% savings)

**Commitment sizing**: Start conservative. Cover 60-70% of your steady-state usage with Savings Plans. It's better to under-commit and pay on-demand for the remainder than to over-commit and waste the commitment.

## Common Hidden Costs {#hidden-costs}

1. **Public IPv4 addresses**: $0.005/hr ($3.65/mo) per address, even when attached to running instances (as of Feb 2024). Audit all public IPs.

2. **CloudWatch Logs**: Ingestion at $0.50/GB, storage at $0.03/GB/mo. Log retention defaults to "never expire" — set retention policies.

3. **Secrets Manager**: $0.40/secret/month + $0.05 per 10,000 API calls. Audit unused secrets.

4. **KMS keys**: $1/mo per customer-managed key. Delete unused keys.

5. **Route 53 hosted zones**: $0.50/zone/month. Clean up unused zones.

6. **Elastic Container Registry (ECR)**: $0.10/GB/month for stored images. Set lifecycle policies to clean old images.

7. **CloudTrail**: First trail per region is free. Additional trails: $2.00 per 100,000 events. Data events (S3 object-level, Lambda invocations) cost extra.

8. **RDS storage**: Auto-scaling can silently grow. Monitor allocated vs. used storage.

## Cost Allocation Tags {#cost-tags}

Effective cost management requires good tagging. Recommended tags:

| Tag Key | Purpose | Example Values |
|---|---|---|
| `Environment` | Identify non-prod for scheduling | prod, staging, dev, test |
| `Team` | Cost attribution | platform, backend, frontend |
| `Service` | Application mapping | api, worker, web |
| `CostCenter` | Finance tracking | eng-001, ops-002 |

```bash
# Check tag coverage
aws ce get-tags \
  --time-period Start=YYYY-MM-01,End=YYYY-MM-01 \
  --profile bite-billing

# Find untagged resources
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Environment \
  --profile bite-readonly
# Compare count against total resources to find untagged ones
```

Good tag coverage enables per-team and per-service cost breakdowns, making it possible to hold teams accountable for their cloud spend.
