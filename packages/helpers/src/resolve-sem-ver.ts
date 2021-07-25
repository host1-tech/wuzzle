import findUp from 'find-up';
import fs from 'fs';
import path from 'path';
import semver, { SemVer } from 'semver';
import { resolveRequire } from './resolve-require';

export function resolveCommandSemVer(commandPath: string): SemVer {
  const packageJsonPath = findUp.sync('package.json', { cwd: commandPath });
  if (packageJsonPath === undefined) {
    throw new Error(`Cannot locate package of command '${commandPath}'`);
  }
  const { version } = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  const parsedVersion = semver.parse(version);
  if (!parsedVersion) {
    throw new Error(`Cannot parse version of command '${commandPath}'`);
  }
  return parsedVersion;
}

export function resolveWebpackSemVer(commandPath: string): SemVer {
  const webpackEntryPath = resolveRequire('webpack', {
    basedir: path.dirname(commandPath),
  });
  const packageJsonPath = findUp.sync('package.json', { cwd: webpackEntryPath });
  if (packageJsonPath === undefined) {
    throw new Error(`Cannot locate webpack package from command '${commandPath}'`);
  }
  const { version } = JSON.parse(fs.readFileSync(packageJsonPath).toString());
  const parsedVersion = semver.parse(version)!;
  if (!parsedVersion) {
    throw new Error(`Cannot parse webpack version from command '${commandPath}'`);
  }
  return parsedVersion;
}
