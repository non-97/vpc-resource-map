import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface VgwProps {
  vpc: cdk.aws_ec2.IVpc;
}

export class Vgw extends Construct {
  readonly tgwId: string;

  constructor(scope: Construct, id: string, props: VgwProps) {
    super(scope, id);

    // VGW
    const vgw = new cdk.aws_ec2.CfnVPNGateway(this, "Vgw", {
      type: "ipsec.1",
      amazonSideAsn: 64513,
    });

    // VGW Attachment
    new cdk.aws_ec2.CfnVPCGatewayAttachment(this, "Vgw Attachment", {
      vpcId: props.vpc.vpcId,
      vpnGatewayId: vgw.ref,
    });

    // Route to VGW
    props.vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.aws_ec2.CfnRoute(this, `Route Tp Vgw ${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: "172.16.0.0/12",
        gatewayId: vgw.ref,
      });
    });
  }
}
