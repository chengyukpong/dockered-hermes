## ADDED Requirements

### Requirement: Load and validate profiles.yaml
The system SHALL parse a `profiles.yaml` file from the current working directory. The file MUST contain both a `defaults` section and a `profiles` section with at least one profile entry. The system SHALL throw a descriptive error if the file is missing or structurally invalid.

#### Scenario: profiles.yaml exists and is valid
- **WHEN** `profiles.yaml` exists in cwd with valid `defaults` and `profiles` sections
- **THEN** the system returns a parsed object containing both sections

#### Scenario: profiles.yaml not found
- **WHEN** `profiles.yaml` does not exist in cwd
- **THEN** the system throws an error message "profiles.yaml not found in <cwd>" with an example format

#### Scenario: defaults section missing
- **WHEN** `profiles.yaml` is parsed but contains no `defaults` key
- **THEN** the system throws an error "profiles.yaml must contain a 'defaults' section"

#### Scenario: profiles section missing
- **WHEN** `profiles.yaml` is parsed but contains no `profiles` key
- **THEN** the system throws an error "profiles.yaml must contain a 'profiles' section"

#### Scenario: profiles section is empty
- **WHEN** `profiles.yaml` has a `profiles` key with no entries
- **THEN** the system throws an error "profiles.yaml must contain at least one profile"

### Requirement: Resolve a named profile
The system SHALL merge `defaults` and the named profile. The `env` and `config` fields SHALL be deep-merged with profile values overriding defaults on conflict. The `soul` field SHALL be replaced entirely by the profile value if present. The `model`, `provider`, and `base_url` fields SHALL be taken from the profile if present, falling back to defaults.

#### Scenario: Profile exists and merges correctly
- **WHEN** a profile name exists in the `profiles` section
- **THEN** the system returns a merged config where `env` and `config` are deep-merged, `soul` is the profile value (or default if not specified), and `model`, `provider`, `base_url` are resolved from profile or defaults

#### Scenario: Profile name not found
- **WHEN** the `--profile` value does not match any profile in `profiles`
- **THEN** the system throws an error "Profile '<name>' not found. Available: <list>"

### Requirement: Interpolate environment variable references
The system SHALL resolve `${VAR_NAME}` patterns in environment variable values. Resolution order: host environment (`process.env`) first, then `./.env` file in cwd. Unresolved variables SHALL produce an error.

#### Scenario: Variable found in host environment
- **WHEN** an env value contains `${API_KEY}` and `process.env.API_KEY` is set
- **THEN** the system replaces `${API_KEY}` with the host environment value

#### Scenario: Variable found in .env file fallback
- **WHEN** an env value contains `${API_KEY}`, `process.env.API_KEY` is not set, but `./.env` contains `API_KEY=abc123`
- **THEN** the system replaces `${API_KEY}` with the value from `./.env`

#### Scenario: Variable cannot be resolved
- **WHEN** an env value contains `${MISSING_VAR}` and it is not in host env or `./.env`
- **THEN** the system throws an error "Cannot resolve ${MISSING_VAR}: not in host env or ./.env"

### Requirement: Validate soul file path
The system SHALL resolve the `soul` path relative to cwd and verify the file exists. Paths from the profile replace the default path entirely.

#### Scenario: Soul file exists at resolved path
- **WHEN** the merged soul path resolves to an existing file
- **THEN** the system returns the absolute path to the soul file

#### Scenario: Soul file not found
- **WHEN** the merged soul path does not point to an existing file
- **THEN** the system throws an error "Soul file not found: <resolved-path>"
