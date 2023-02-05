import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface VpcBProps {}

export class VpcB extends Construct {
  readonly vpc: cdk.aws_ec2.IVpc;

  constructor(scope: Construct, id: string, props?: VpcBProps) {
    super(scope, id);

    this.vpc = new cdk.aws_ec2.Vpc(this, "Vpc", {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr("10.1.2.0/24"),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 27,
          mapPublicIpOnLaunch: false,
        },
        {
          name: "Tgw",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });
  }
}
