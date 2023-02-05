import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface TgwProps {}

export class Tgw extends Construct {
  readonly tgwId: string;

  constructor(scope: Construct, id: string, props?: TgwProps) {
    super(scope, id);

    // Transit Gateway
    const tgw = new cdk.aws_ec2.CfnTransitGateway(this, "Tgw", {
      amazonSideAsn: 64512,
      autoAcceptSharedAttachments: "enable",
      defaultRouteTableAssociation: "enable",
      defaultRouteTablePropagation: "enable",
    });

    this.tgwId = tgw.ref;
  }
}
