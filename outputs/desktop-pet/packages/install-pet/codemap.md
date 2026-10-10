# packages/install-pet/

Standalone pet installer from OpenPets gallery catalog.

## Responsibility

Provides a standalone CLI tool for installing pets from the OpenPets gallery catalog. Can operate through the running desktop app (preferred) or directly download and extract pet ZIP files.

## Design

**Dual Install Modes**:
1. **Via Running App**: Uses `@open-pets/client` to request installation through the desktop app
2. **Direct Install**: Downloads from catalog, validates, extracts to user data directory

**Catalog Integration**:
- URL: `https://openpets.dev/pets/catalog.v2.json`
- Validation: Schema version, unique IDs, URL host/path allowlisting
- Pet structure: `{ id, displayName, description, preview, zip }`

**ZIP Handling**:
- Library: `yauzl` for streaming ZIP extraction
- Security: Path traversal prevention, symlink rejection, size limits
- Limits: 50MB download, 200MB extracted, 500 files, 100MB per file
- Required files: `pet.json`, `spritesheet.webp`
- Extraction: Atomic (temp dir → rename), permission 0o600/0o700

**State Management**:
- User data path: Platform-specific (macOS: `~/Library/Application Support/OpenPets`, Windows: `%APPDATA%/OpenPets`, Linux: `~/.config/OpenPets`)
- State file: `openpets-state.json`
- Lock file: `.install-pet.lock` (prevents concurrent installs, 10min stale timeout)
- Pet directory: `pets/<petId>/`

**Validation**:
- Pet ID: `^[a-z0-9][a-z0-9_-]{0,63}$`, excludes "builtin"
- Catalog URLs: HTTPS only, specific host allowlist
- ZIP entries: No encryption, supported compression (stored/deflate), valid Unix modes

## Flow

```
installPet({ petId, preferRunningApp })
    ↓
tryInstallThroughRunningApp() → createOpenPetsClient().installPet()
    ↓ (fallback on unavailable/timeout)
installPetDirectly()
    ↓
acquireDirectInstallLock() → mkdir lock, write owner.json
    ↓
fetchCatalog() → GET https://openpets.dev/pets/catalog.v2.json
    ↓
getCatalogPet(petId) → Validate exists in catalog
    ↓
downloadPetZip(zipUrl) → Stream to buffer, validate magic bytes
    ↓
extractPetZip(buffer, tempDir) → yauzl streaming extract
    ↓
validateExtractedPet() → Check pet.json, spritesheet.webp exist
    ↓
rename(tempDir, finalDir) → Atomic move
    ↓
writeInstalledPetState() → Update openpets-state.json
    ↓
releaseLock() → rm lock directory
```

## Integration Points

**Dependencies**:
- `@open-pets/client` - Fallback IPC to running app
- `yauzl` - ZIP file handling

**External Services**:
- `openpets.dev` - Catalog JSON and pet metadata
- `zip.openpets.dev` - ZIP file downloads

**CLI Usage**:
- Binary: `install-pet <pet-id>`
- Also invocable via `npx -y install-pet <pet-id>`

**Exports**:
- `installPet()` - Main install function
- `parseArgs()` - CLI argument parsing
- `getOpenPetsUserDataPath()` - Platform-specific path resolution
- `validatePetId()` - ID format validation
