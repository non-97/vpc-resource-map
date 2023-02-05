import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VpcA } from "./constructs/vpc-a";
import { VpcB } from "./constructs/vpc-b";
import { Tgw } from "./constructs/tgw";
import { TgwVpcAttachment } from "./constructs/tgw-vpc-attachment";
import { NetworkFirewall } from "./constructs/network-firewall";
import { Vgw } from "./constructs/vgw";
import { VpcPeering } from "./constructs/vpc-peering";

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpcA = new VpcA(this, "Vpc A");
    const vpcB = new VpcB(this, "Vpc B");

    // Transit Gateway
    const tgw = new Tgw(this, "Tgw");

    // Transit Gateway attachment
    new TgwVpcAttachment(this, "Tgw Vpc Attachment Vpc A", {
      tgwId: tgw.tgwId,
      vpc: vpcA.vpc,
    });
    new TgwVpcAttachment(this, "Tgw Vpc Attachment Vpc B", {
      tgwId: tgw.tgwId,
      vpc: vpcB.vpc,
    });

    // VGW
    new Vgw(this, "Vgw Vpc A", {
      vpc: vpcA.vpc,
    });

    // Network Firewall
    new NetworkFirewall(this, "Network Firewall", {
      vpc: vpcA.vpc,
    });

    // VPC peering
    new VpcPeering(this, "Vpc Peering", {
      vpc: vpcA.vpc,
      peerVpc: vpcB.vpc,
    });
  }
}
