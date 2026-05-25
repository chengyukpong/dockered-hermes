const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const dotenv = require('dotenv');

function loadProfiles(cwd) {
  const filePath = path.join(cwd, 'profiles.yaml');
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `profiles.yaml not found in ${cwd}\n\nExample format:\n` +
      'defaults:\n  config:\n    cpu: "1"\n    memory: "1g"\n  env:\n    KEY: value\n  soul: ./souls/default.md\n\n' +
      'profiles:\n  my-profile:\n    soul: ./souls/custom.md'
    );
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(content);

  if (!parsed.defaults) {
    throw new Error("profiles.yaml must contain a 'defaults' section");
  }
  if (!parsed.profiles) {
    throw new Error("profiles.yaml must contain a 'profiles' section");
  }
  if (Object.keys(parsed.profiles).length === 0) {
    throw new Error('profiles.yaml must contain at least one profile');
  }

  return parsed;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function resolveProfile(profiles, profileName) {
  const profile = profiles.profiles[profileName];
  if (!profile) {
    const available = Object.keys(profiles.profiles).join(', ');
    throw new Error(`Profile '${profileName}' not found. Available: ${available}`);
  }

  const merged = {
    config: deepMerge(profiles.defaults.config || {}, profile.config || {}),
    env: deepMerge(profiles.defaults.env || {}, profile.env || {}),
    soul: profile.soul || profiles.defaults.soul,
    model: profile.model || profiles.defaults.model,
    provider: profile.provider || profiles.defaults.provider,
    base_url: profile.base_url || profiles.defaults.base_url,
  };

  return merged;
}

function interpolateEnv(env, cwd) {
  const envFilePath = path.join(cwd, '.env');
  let dotEnvVars = {};
  if (fs.existsSync(envFilePath)) {
    dotEnvVars = dotenv.parse(fs.readFileSync(envFilePath, 'utf-8'));
  }

  const result = {};
  for (const [key, value] of Object.entries(env)) {
    const strValue = String(value);
    result[key] = strValue.replace(/\$\{([^}]+)\}/g, (_, varName) => {
      if (process.env[varName] !== undefined) {
        return process.env[varName];
      }
      if (dotEnvVars[varName] !== undefined) {
        return dotEnvVars[varName];
      }
      throw new Error(`Cannot resolve \${${varName}}: not in host env or ./.env`);
    });
  }
  return result;
}

function resolveSoulPath(soulPath, cwd) {
  const resolved = path.resolve(cwd, soulPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Soul file not found: ${resolved}`);
  }
  return resolved;
}

module.exports = { loadProfiles, deepMerge, resolveProfile, interpolateEnv, resolveSoulPath };
