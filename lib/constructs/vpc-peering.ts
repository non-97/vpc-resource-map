import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface VpcPeeringProps {
  vpc: cdk.aws_ec2.IVpc;
  peerVpc: cdk.aws_ec2.IVpc;
}

export class VpcPeering extends Construct {
  readonly tgwId: string;

  constructor(scope: Construct, id: string, props: VpcPeeringProps) {
    super(scope, id);

    // VPC Peering
    const vpcPeering = new cdk.aws_ec2.CfnVPCPeeringConnection(
      this,
      "Vpc Peering",
      {
        peerVpcId: props.vpc.vpcId,
        vpcId: props.peerVpc.vpcId,
      }
    );

    // Route to VPC Peering
    props.peerVpc.publicSubnets.forEach((subnet, index) => {
      new cdk.aws_ec2.CfnRoute(this, `Peer Vpc Route To Vpc Peering ${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: props.vpc.vpcCidrBlock,
        vpcPeeringConnectionId: vpcPeering.ref,
      });
    });
    props.vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.aws_ec2.CfnRoute(this, `Vpc Route To Vpc Peering ${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: props.peerVpc.vpcCidrBlock,
        vpcPeeringConnectionId: vpcPeering.ref,
      });
    });
  }
}
