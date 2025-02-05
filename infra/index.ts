import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as random from "@pulumi/random";


const gitCommitHash = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString().trim()

const name = pulumi.getStack();
const isProduction = name === 'arena-prod';

// Store the non-references resources here so they don't look like they're never used.
const results: { [k: string]: Object } = {};

const pulumiConfig = new pulumi.Config();

const ecrRepositoryBase = "407725983764.dkr.ecr.eu-west-1.amazonaws.com";
const certificateArn = pulumiConfig.require('certificateArn');
const cognitoUserPoolArn = pulumiConfig.require('cognitoUserPoolArn');
const targetDomain = pulumiConfig.require('targetDomain');

const secret = (key: string) => {
    const secret = pulumiConfig.getSecret(key);
    if (!secret) {
        throw new Error(`Incomplete configuration: Secret missing: ${key}`);
    }
    return secret!
}


// Tag all resources with `arena_stack`.
const tags = { arena_stack: name };

const vpc = new awsx.ec2.Vpc(`${name}-vpc`, { tags });


// Create an ALB. One listener on port 80 redirects to port 443,
// while the 443 listener passes traffic through.
const alb = new awsx.lb.ApplicationLoadBalancer(`${name}-web-traffic`, { vpc, tags });

// Redirect HTTP to HTTPS for the load balancer:
results.httpListener = alb.createListener(`${name}-http-listener`, {
    port: 80,
    protocol: "HTTP",
    defaultAction: {
        type: "redirect",
        redirect: {
            protocol: "HTTPS",
            port: "443",
            statusCode: "HTTP_301",
        },
    },
});

// nginx, otherwise we would use 9090 for app_server
const targetGroup = alb.createTargetGroup(`${name}-web-target`, {
    port: 80,
    healthCheck: {
        path: '/healthcheck',
    },
});

const httpsListener = targetGroup.createListener(`${name}-https-listener`, {
    port: 443,
    certificateArn: certificateArn,
});


// We use the same zone for all configurations:
const hostedZone = aws.route53.getZone({ name: 'openforis-arena.org' });

// Point the domain to the load balancer
results.aliasRecord = new aws.route53.Record(targetDomain, {
    name: targetDomain.split('.')[0],
    zoneId: hostedZone.zoneId,
    type: "A",
    aliases: [
        {
            evaluateTargetHealth: true,
            name: httpsListener.endpoint.hostname,
            zoneId: alb.loadBalancer.zoneId,
        },
    ],
});


const cluster = new awsx.ecs.Cluster(`${name}-cluster`, { vpc, tags });
const securityGroupIds = cluster.securityGroups.map(g => g.id);

const dbSubnetGroup = new aws.rds.SubnetGroup(`${name}-db-subnet-group`, {
    subnetIds: vpc.publicSubnetIds,
    tags,
});

const dbPassword = new random.RandomPassword(`${name}-db-password`, {
    length: 32,
    special: false,
});

const db = new aws.rds.Instance(`${name}-db`, {
    engine: "postgres",
    engineVersion: '11.5',

    instanceClass: "db.t2.micro",
    allocatedStorage: 20,

    dbSubnetGroupName: dbSubnetGroup.id,
    vpcSecurityGroupIds: securityGroupIds,

    // Non-production instances can be accessed directly:
    publiclyAccessible: !isProduction,

    name: "arena",
    username: "arena",
    password: dbPassword.result,

    // don't keep store a snapshot of the DB upon deletion,
    // except for production instances:
    skipFinalSnapshot: !isProduction,
    tags,
});


const hosts = db.endpoint.apply(e => e.split(":")[0])

const cognitoArnParts = cognitoUserPoolArn.split('/')
const cognitoUserPoolId = cognitoArnParts[cognitoArnParts.length - 1]

const environment = hosts.apply(postgresHost => [
    { name: "PGHOST", value: postgresHost },
    { name: "PGPORT", value: db.port.apply(String) },
    { name: "PGDATABASE", value: db.name },
    { name: "PGUSER", value: db.username },
    { name: "PGPASSWORD", value: dbPassword.result },

    { name: "TEMP_FOLDER", value: '/tmp/arena_upload' },
    { name: "ANALYSIS_OUTPUT_DIR", value: '/tmp/arena_analysis' },
    { name: "ADMIN_EMAIL", value: secret('adminEmail') },
    { name: "SENDGRID_API_KEY", value: secret('sendgridApiKey') },

    { name: "COGNITO_REGION", value: aws.getRegion().name },
    { name: "COGNITO_USER_POOL_ID", value: cognitoUserPoolId },
    { name: "COGNITO_CLIENT_ID", value: secret('cognitoClientId') },

    { name: 'PORT', value: '9090' },
    { name: "ARENA_HOST", value: "localhost:9090" },
])

const ecsPolicy: aws.iam.PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
        {
            Action: "sts:AssumeRole",
            Principal: {"Service": "ecs-tasks.amazonaws.com"},
            Effect: "Allow",
            Sid: "",
        },
    ],
};

const taskRole = new aws.iam.Role(`${name}-task-role`, {
    assumeRolePolicy: ecsPolicy,
    tags,
});

const arenaServerPolicy: aws.iam.PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
        // Cognito requirements:
        // At least the following:
        // - AdminUpdateUserAttributes
        // - AdminDeleteUser
        {
            Action: "cognito-idp:*",
            Effect: "Allow",
            Resource: cognitoUserPoolArn,
        },
    ],
};

results.taskRolePolicy = new aws.iam.RolePolicy(`${name}-task-role-policy`, {
    role: taskRole,
    policy: arenaServerPolicy,
});

results.serviceLambdaPolicy = new aws.iam.PolicyAttachment(`${name}-service-lambda-policy`, {
    policyArn: "arn:aws:iam::aws:policy/AWSLambdaFullAccess",
    roles: [taskRole],
});
results.serviceEC2ContainerPolicy = new aws.iam.PolicyAttachment(`${name}-service-ec2-container-policy`, {
    policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerServiceFullAccess",
    roles: [taskRole],
});

// ECS resources can easily timeout:
const ecsResourceOpts = { customTimeouts: { create: '30m', update: '30m', delete: '30m' } }

const taskDefinition = new awsx.ecs.FargateTaskDefinition(`${name}-service-task`, {
    taskRole,
    tags,
    containers: {
        arena_server: {
            image: `${ecrRepositoryBase}/arena-server:${gitCommitHash}`,
            environment,
            // 512MB is too definitely too little for heavy things like Collect import jobs.
            memory: 1024,
            cpu: 512,
        },
        arena_web: {
            image: `${ecrRepositoryBase}/arena-web:${gitCommitHash}`,
            environment,
            memory: 512,
            cpu: 256,
            portMappings: [httpsListener],
        },
    },
}, ecsResourceOpts);

// NB: This often causes a timeout past the 10 minute default limit.
results.ecsService = new awsx.ecs.FargateService(`${name}-service`, {
    cluster,
    desiredCount: 1,
    tags,
    taskDefinition,
}, ecsResourceOpts)
