import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface NetworkFirewallProps {
  vpc: cdk.aws_ec2.IVpc;
}

export class NetworkFirewall extends Construct {
  constructor(scope: Construct, id: string, props: NetworkFirewallProps) {
    super(scope, id);

    // Network Firewall rule group
    const networkFirewallRuleGroup = new cdk.aws_networkfirewall.CfnRuleGroup(
      this,
      "Network Firewall Rule Group",
      {
        capacity: 100,
        ruleGroupName: "network-firewall-rule-group",
        type: "STATEFUL",
        ruleGroup: {
          rulesSource: {
            statefulRules: [
              {
                action: "PASS",
                header: {
                  destination: "0.0.0.0/0",
                  destinationPort: "ANY",
                  direction: "FORWARD",
                  protocol: "IP",
                  source: "$HOME_NET",
                  sourcePort: "ANY",
                },
                ruleOptions: [
                  {
                    keyword: `msg:"HOME_NET pass"`,
                  },
                  {
                    keyword: "sid:1000001",
                  },
                  {
                    keyword: "rev:1",
                  },
                ],
              },
            ],
          },
          statefulRuleOptions: {
            ruleOrder: "STRICT_ORDER",
          },
        },
      }
    );

    // Network Firewall policy
    const networkFirewallPolicy = new cdk.aws_networkfirewall.CfnFirewallPolicy(
      this,
      "Network Firewall Policy",
      {
        firewallPolicyName: "network-firewall-policy",
        firewallPolicy: {
          statelessDefaultActions: ["aws:forward_to_sfe"],
          statelessFragmentDefaultActions: ["aws:forward_to_sfe"],
          statefulDefaultActions: ["aws:alert_strict"],
          statefulEngineOptions: {
            ruleOrder: "STRICT_ORDER",
          },
          statefulRuleGroupReferences: [
            {
              priority: 1,
              resourceArn: networkFirewallRuleGroup.attrRuleGroupArn,
            },
          ],
        },
      }
    );

    // Network Firewall
    const networkFirewall = new cdk.aws_networkfirewall.CfnFirewall(
      this,
      "Network Firewall",
      {
        firewallName: "network-firewall",
        firewallPolicyArn: networkFirewallPolicy.attrFirewallPolicyArn,
        vpcId: props.vpc.vpcId,
        subnetMappings: props.vpc
          .selectSubnets({
            subnetGroupName: "Firewall",
          })
          .subnetIds.map((subnetId) => {
            return {
              subnetId: subnetId,
            };
          }),
        deleteProtection: false,
        subnetChangeProtection: false,
      }
    );

    // Routing NAT Gateway to Network Firewall
    props.vpc.publicSubnets.forEach((subnet, index) => {
      const az = subnet.availabilityZone;

      const targetSubnets = props.vpc.selectSubnets({
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZones: [az],
      }).subnets;

      targetSubnets.forEach((targetSubnet) => {
        const destinationCidrBlock = targetSubnet.ipv4CidrBlock;

        new cdk.aws_ec2.CfnRoute(
          this,
          `Route Nat Gateway To Network Firewall ${az} ${destinationCidrBlock}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock,
            vpcEndpointId: cdk.Fn.select(
              1,
              cdk.Fn.split(
                ":",
                cdk.Fn.select(index, networkFirewall.attrEndpointIds)
              )
            ),
          }
        );
      });
    });

    // Routing Egress Subnet to Network Firewall
    props.vpc
      .selectSubnets({ subnetGroupName: "Egress" })
      .subnets.forEach((subnet, index) => {
        const defaultRoute = subnet.node.children.find(
          (child) => child.node.id == "DefaultRoute"
        ) as cdk.aws_ec2.CfnRoute;
        defaultRoute.addDeletionOverride("Properties.NatGatewayId");

        defaultRoute.addOverride(
          "Properties.VpcEndpointId",
          cdk.Fn.select(
            1,
            cdk.Fn.split(
              ":",
              cdk.Fn.select(index, networkFirewall.attrEndpointIds)
            )
          )
        );
      });
  }
}
