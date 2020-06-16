const Path = require('path');
const Fs = require('fs');
const Convict = require('convict');
const Dotenv = require('dotenv');

Dotenv.config({
  silent: true,
});

const configSchema = {
  // General
  projectName: {
    doc: 'The project name.',
    format: String,
    default: 'App API',
    env: 'PROJECT_NAME',
  },
  env: {
    doc: 'The application environment.',
    format: ['production', 'staging', 'qa', 'development', 'test', 'local'],
    default: 'development',
    env: 'NODE_ENV',
  },
  ip: {
    doc: 'The IP address to bind.',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'IP_ADDRESS',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 8080,
    env: 'PORT',
    arg: 'port',
  },
  customApiPort: {
    doc: 'Custom port',
    format: 'port',
    default: 8080,
    env: 'CUSTOM_API_PORT',
  },
  isHttps: {
    doc: 'Enable HTTPS.',
    format: Boolean,
    default: false,
    env: 'IS_HTTPS',
  },

  // API
  apiURL: {
    doc: 'The api URI.',
    format: 'url',
    default: 'http://127.0.0.1:8080/',
    env: 'API_URI',
  },
  platformURL: {
    doc: 'The client URL of the main platform.',
    format: 'url',
    default: 'http://127.0.0.1:3000/',
    env: 'PLATFORM_URL',
  },
  cmsURL: {
    doc: 'The Admin CMS Portal URL.',
    format: 'url',
    default: 'http://127.0.0.1:3001/',
    env: 'CMS_URL',
  },
  cors: {
    additionalHeaders: {
      doc: 'List of headers for cors.',
      format: Array,
      default: ['X-Access-Token', 'X-Refresh-Token'],
    },
    additionalExposedHeaders: {
      doc: 'The project name.',
      format: Array,
      default: ['X-Access-Token', 'X-Refresh-Token'],
    },
  },
  apiPath: {
    doc: 'Root of API controllers and routes',
    format: String,
    default: Path.join(__dirname, '/../src/api'),
  },
  startupMigrations: {
    doc: 'Flag to enable/disable startup Migrations',
    format: Boolean,
    default: true,
  },
  policyPath: {
    doc: 'Root of policies',
    format: String,
    default: Path.join(__dirname, '/../core/lib/policies'),
  },

  files: {
    uploadSize: {
      doc: 'Upload File Size Limit',
      format: Number,
      default: 209715200,
    },
  },

  // DB
  db: {
    name: {
      doc: 'Database name',
      format: String,
      default: 'example_dev',
      env: 'DB_NAME',
    },
    user: {
      doc: 'Database username',
      format: String,
      default: 'postgres',
      env: 'DB_USER',
    },
    password: {
      doc: 'Database password',
      format: String,
      default: '',
      env: 'DB_PASS',
    },
    host: {
      doc: 'Database host name/IP',
      format: '*',
      default: '127.0.0.1',
      env: 'DB_HOST',
    },
    port: {
      doc: 'Database port',
      format: 'port',
      default: 5432,
      env: 'DB_PORT',
    },
    ssl: {
      doc: 'Enable SSL',
      format: Boolean,
      default: false,
      env: 'DB_SSL',
    },
    customMigrations: {
      doc: 'Enable Custom Migrations',
      format: Boolean,
      default: true,
      env: 'DB_CUSTOM_MIGRATIONS',
    },
    customSeeds: {
      doc: 'Enable Custom Seeds',
      format: Boolean,
      default: true,
      env: 'DB_CUSTOM_SEEDS',
    },
    enableSeeds: {
      doc: 'Enable Seeds',
      format: Boolean,
      default: false,
      env: 'DB_CUSTOM_SEEDS',
    },
    useSchemaFile: {
      doc: 'Enable usage of a schema sql file',
      format: Boolean,
      default: false,
      env: 'DB_USE_SCHEMA_FILE',
    },
  },

  // JWT
  token: {
    secret: {
      doc: 'JWT Secret',
      format: '*',
      default: 'CHANGE_ME_TOKEN',
      env: 'JWT_SECRET',
    },
  },

  // LOGGING
  logging: {
    doc: 'The logging configs for bunyan.',
    format: Array,
    default: [{
      level: 'error',
      type: 'rotating-file',
      period: '1d',
      count: 3,
      path: './logs/error.log',
    },
    {
      level: 'debug',
      type: 'rotating-file',
      period: '1d',
      count: 3,
      path: './logs/debug.log',
    },
    {
      level: 'error',
      stream: process.stdout,
    },
    ],
    env: 'LOGGING_CONFIG',
  },

  // SendGrid
  sendgrid: {
    apiKey: {
      doc: 'The sendgrid apiKey.',
      format: String,
      default: 'XXX',
      env: 'SENDGRID_API_KEY',
    },
  },

  // EMAILER SMTP
  emailer: {
    mode: {
      doc: 'The transport mode.',
      format: ['SMTP', 'SENDGRID'],
      default: 'SENDGRID',
      env: 'EMAILER_MODE',
    },
    host: {
      doc: 'The emailer host server.',
      format: String,
      default: 'smtp.gmail.com',
      env: 'EMAILER_HOST',
    },
    port: {
      doc: 'The emailer port.',
      format: 'port',
      default: 465,
      env: 'EMAILER_PORT',
    },
    secure: {
      doc: 'The emailer secure.',
      format: Boolean,
      default: true,
      env: 'EMAILER_SECURE',
    },
    auth: {
      user: {
        doc: 'The emailer user.',
        format: String,
        default: 'example@example.com',
        env: 'EMAILER_USER',
      },
      pass: {
        doc: 'The emailer password.',
        format: String,
        default: 'changethis',
        env: 'EMAILER_PASSWORD',
      },
    },
  },

  // EMAILS
  emails: {
    debug: {
      doc: 'The debug email.',
      format: '*',
      default: '',
      env: 'EMAILS_DEBUG',
    },
    defaults: {
      doc: 'The default email.',
      format: 'email',
      default: 'example@example.com',
      env: 'EMAILS_DEFAULT',
    },
    system: {
      fromName: {
        doc: 'The system from name.',
        format: String,
        default: 'system',
        env: 'EMAILS_SYSTEM_FROM_NAME',
      },
      fromAddress: {
        doc: 'The system from email.',
        format: 'email',
        default: 'example@example.com',
        env: 'EMAILS_SYSTEM_FROM',
      },
      toName: {
        doc: 'The system to name.',
        format: String,
        default: 'system',
        env: 'EMAILS_SYSTEM_TO_NAME',
      },
      toAddress: {
        doc: 'The system to email.',
        format: 'email',
        default: 'example@example.com',
        env: 'EMAILS_SYSTEM_TO',
      },
    },
  },

  // AWS
  AWS: {
    accessKeyId: {
      doc: 'The accessKeyId.',
      format: String,
      default: '',
      env: 'AWS_ACCESS_KEY',
    },
    secretAccessKey: {
      doc: 'The secretAccessKey.',
      format: String,
      default: '',
      env: 'AWS_SECRET_ACCESS_KEY',
    },
  },

  S3: {
    bucketName: {
      doc: 'S3 bucket.',
      format: String,
      default: 'shoeshine-dev',
      env: 'S3_BUCKET',
    },
    publicBucketName: {
      doc: 'S3 public bucket.',
      format: String,
      default: 'shoeshine-dev-public',
      env: 'S3_PUBLIC_BUCKET',
    },
    maxRetries: {
      doc: 'The S3 upload max retries',
      format: String,
      default: '1',
      env: 'S3_MAX_RETRIES',
    },
    region: {
      doc: 'The S3 bucket region.',
      format: String,
      default: 'us-west-2',
      env: 'S3_REGION',
    },
    presignedUrlExpire: {
      doc: 'The S3 presigned request expiration in seconds',
      format: 'int',
      default: '86400',
      env: 'S3_PRESINED_EXPIRATION',
    },
    apiVersion: {
      doc: 'AWS API Version',
      format: String,
      default: '2006-03-01',
      env: 'AWS_API_VERSION',
    },
    signatureVersion: {
      doc: 'AWS API signature version',
      format: String,
      default: 'v4',
      env: 'AWS_API_SIGNATURE_VERSION',
    },
  },

  redis: {
    host: {
      doc: 'The redis queue cluster',
      format: String,
      default: '127.0.0.1',
      env: 'REDIS_HOST',
    },
    port: {
      doc: 'The port to connect.',
      format: 'port',
      default: 6379,
      env: 'REDIS_PORT',
    },
    cluster: {
      doc: 'Is redis a cluster',
      format: Boolean,
      default: false,
      env: 'REDIS_IS_CLUSTER',
    },
    password: {
      doc: 'Redis password',
      format: String,
      default: '',
      env: 'REDIS_PASSWORD',
    },
    queuePrefix: {
      doc: 'Queue names prefix',
      format: String,
      default: 'local',
      env: 'REDIS_QUEUE_PREFIX',
    },
  },

  queue: {
    delay: {
      doc: 'Enable Queue server processing, otherwise executed immediately',
      format: Boolean,
      default: false,
      env: 'QUEUE_DELAY',
    },
  },
};

const config = Convict(configSchema);
const env = config.get('env');
const configFile = Path.resolve(`./config/${env}.json`);

if (Fs.existsSync(configFile)) {
  config.loadFile(configFile);
}
config.validate({
  allowed: 'strict',
});

module.exports = config;
