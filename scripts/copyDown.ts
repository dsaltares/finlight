import { execFileSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'dotenv';
import { getLogger } from '@/server/logger';

const logger = getLogger('copyDown');

const SshHost = process.env.COPY_DOWN_SSH_HOST || 'homelab';
const ComposeDirectory = process.env.COPY_DOWN_COMPOSE_DIR || 'repos/homelab';
const Service = process.env.COPY_DOWN_SERVICE || 'finlight';
const LocalUrl = 'http://localhost:3010';
const DefaultDatabaseFile = './data/db.sqlite';
const EnvFile = '.env';
const SetAsideSuffix = '.before-copy-down';
const SqliteSidecars = ['', '-wal', '-shm'];
const SqliteHeader = 'SQLite format 3\0';
const ContainerOnlyVariables = ['NODE_ENV', 'PORT', 'HOSTNAME'];
const SerializeScript =
  "const S=require('better-sqlite3');const db=new S(process.env.DATABASE_URL,{readonly:true,fileMustExist:true});process.stdout.write(db.serialize());db.close();";

type Environment = Record<string, string | null | undefined>;

const shellQuote = (value: string) => `'${value.replaceAll("'", `'\\''`)}'`;

const setAside = (file: string) => {
  rmSync(`${file}${SetAsideSuffix}`, { force: true });
  if (existsSync(file)) renameSync(file, `${file}${SetAsideSuffix}`);
};

const readLocalEnvironment = (): Environment =>
  existsSync(EnvFile) ? parse(readFileSync(EnvFile, 'utf8')) : {};

type LocalEnvironmentArgs = {
  production: Environment;
  local: Environment;
  databaseFile: string;
};

const buildLocalEnvironment = ({
  production,
  local,
  databaseFile,
}: LocalEnvironmentArgs) => {
  const merged: Record<string, string> = {};
  for (const [name, value] of Object.entries({ ...local, ...production })) {
    if (value != null && !ContainerOnlyVariables.includes(name)) {
      merged[name] = value;
    }
  }
  merged.DATABASE_URL = databaseFile;
  merged.BETTER_AUTH_URL = LocalUrl;
  return merged;
};

const quoteEnvValue = (value: string) => {
  if (/^[\w./:@,+-]*$/.test(value)) return value;
  if (!value.includes("'") && !value.includes('\n')) return `'${value}'`;
  return JSON.stringify(value);
};

const formatEnvFile = (environment: Record<string, string>) => {
  const expanded = Object.entries(environment)
    .filter(([, value]) => value.includes('$'))
    .map(([name]) => name);
  if (expanded.length > 0) {
    throw new Error(
      `${expanded.join(', ')} contain a $, which would be expanded when reading .env.`,
    );
  }
  return Object.entries(environment)
    .map(([name, value]) => `${name}=${quoteEnvValue(value)}\n`)
    .join('');
};

const copyDown = () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('copy-down refuses to run with NODE_ENV=production');
  }
  const local = readLocalEnvironment();
  const databaseFile = local.DATABASE_URL || DefaultDatabaseFile;
  const work = mkdtempSync(join(tmpdir(), 'finlight-copy-down-'));
  const copy = `${databaseFile}.copy-down`;
  const multiplex = [
    '-o',
    'ControlMaster=auto',
    '-o',
    `ControlPath=${join(work, 'ssh')}`,
    '-o',
    'ControlPersist=60',
  ];
  const onHost = (
    command: string[],
    stdout: 'inherit' | 'pipe' | number = 'inherit',
  ) =>
    execFileSync(
      'ssh',
      [
        ...multiplex,
        SshHost,
        `cd ${shellQuote(ComposeDirectory)} && ${command.map(shellQuote).join(' ')}`,
      ],
      {
        stdio: ['inherit', stdout, 'inherit'],
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      },
    );

  mkdirSync(dirname(databaseFile), { recursive: true });
  try {
    logger.info(`Copying ${Service} database from ${SshHost}`);
    const file = openSync(copy, 'w');
    try {
      onHost(
        [
          'docker',
          'compose',
          'exec',
          '-T',
          Service,
          'node',
          '-e',
          SerializeScript,
        ],
        file,
      );
    } finally {
      closeSync(file);
    }
    if (
      readFileSync(copy).subarray(0, 16).toString('latin1') !== SqliteHeader
    ) {
      throw new Error(
        `What came back from ${SshHost} is not a SQLite database`,
      );
    }

    const composeConfig = onHost(
      ['docker', 'compose', 'config', '--format', 'json', Service],
      'pipe',
    );
    const compose = JSON.parse(composeConfig) as {
      services: Record<string, { environment?: Environment }>;
    };
    const environment = formatEnvFile(
      buildLocalEnvironment({
        production: compose.services[Service]?.environment ?? {},
        local,
        databaseFile,
      }),
    );

    for (const suffix of SqliteSidecars) {
      setAside(`${databaseFile}${suffix}`);
    }
    renameSync(copy, databaseFile);
    setAside(EnvFile);
    writeFileSync(EnvFile, environment, { mode: 0o600 });
    logger.info(
      `Copied production into ${databaseFile} and ${EnvFile}; previous files kept as *${SetAsideSuffix}`,
    );
  } finally {
    try {
      execFileSync('ssh', [...multiplex, '-O', 'exit', SshHost], {
        stdio: 'ignore',
      });
    } catch {}
    rmSync(copy, { force: true });
    rmSync(work, { recursive: true, force: true });
  }
};

try {
  copyDown();
} catch (error) {
  logger.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
