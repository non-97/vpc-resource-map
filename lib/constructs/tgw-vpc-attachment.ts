import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface TgwVpcAttachmentProps {
  vpc: cdk.aws_ec2.IVpc;
  tgwId: string;
}

export class TgwVpcAttachment extends Construct {
  constructor(scope: Construct, id: string, props: TgwVpcAttachmentProps) {
    super(scope, id);

    // Transit Gateway attachment Subnets
    const tgwSubnetIds = props.vpc.selectSubnets({
      subnetGroupName: "Tgw",
    }).subnetIds;

    // Transit Gateway attachment
    const tgwVpcAttachment = new cdk.aws_ec2.CfnTransitGatewayVpcAttachment(
      this,
      "Tgw Attachment",
      {
        subnetIds: tgwSubnetIds,
        transitGatewayId: props.tgwId,
        vpcId: props.vpc.vpcId,
        options: {
          DnsSupport: "enable",
        },
      }
    );

    // Route to Transit Gateway
    [
      ...props.vpc.publicSubnets,
      ...props.vpc.privateSubnets,
      ...props.vpc.isolatedSubnets,
    ].forEach((subnet, index) => {
      // Route tables for subnets with Transit Gateway attachments are not changed
      if (tgwSubnetIds.includes(subnet.subnetId)) {
        return;
      }

      new cdk.aws_ec2.CfnRoute(
        this,
        `Route Table ${index} Route To Tgw For Class A Private IP Address `,
        {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: "10.0.0.0/8",
          transitGatewayId: props.tgwId,
        }
      ).addDependency(tgwVpcAttachment);
    });
  }
}
