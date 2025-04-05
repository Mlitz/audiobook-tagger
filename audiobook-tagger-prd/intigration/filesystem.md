# File System Integration

## 5.2 File System Integration

The Audiobook Tagger provides robust filesystem integration with various media server platforms and organizational structures to ensure compatibility with popular audiobook consumption methods.

### 5.2.1 Media Server Compatibility

#### Plex Integration

- **Full compliance with Plex naming conventions**
  - Standard folder structures (Author/Series/Book)
  - Proper handling of multi-part audiobooks
  - Series numbering in Plex-compatible format

- **Audiobook agent compatibility**
  - Metadata formatting for optimal agent matching
  - Support for Plex Audiobook agent requirements
  - Compatibility with popular community agents

- **Support for Plex's metadata structure**
  - Local metadata files in Plex format
  - Poster and cover art in expected locations
  - Chapter data in compatible format

#### Jellyfin/Emby Support

- **Compatible metadata embedding**
  - Standard tagging formats recognized by Jellyfin/Emby
  - NFO file generation when preferred
  - XML metadata in compatible schema

- **Cover art optimization for these platforms**
  - Properly sized cover images
  - Platform-specific cover file naming
  - Multiple resolution options for different views

- **Chapter marker compatibility**
  - Chapter data in recognized format
  - Accurate timestamp synchronization
  - Chapter image handling when available

#### DLNA/UPnP Readiness

- **Standard-compliant metadata embedding**
  - Universally recognized tag formats
  - Compatible folder structure
  - Streamable file format verification

- **Device discovery integration options**
  - DLNA announcement capability
  - Service advertisement
  - Device compatibility profiles

- **Media streaming capability preparation**
  - Transcoding verification
  - Bitrate optimization options
  - Format compatibility checking

### 5.2.2 File Management

#### Watch Folder Monitoring

- **Real-time detection of new audiobooks**
  - FileSystem monitoring for changes
  - Instant detection of added files
  - Smart handling of in-progress file transfers

- **Automatic processing of detected files**
  - Configurable auto-processing rules
  - Processing delay options for large file transfers
  - Priority assignment for new content

- **Rule-based handling of incoming content**
  - Content routing based on metadata
  - Automatic organization based on patterns
  - Customizable handling based on source or format

#### Organizational Structure

- **Standardized folder hierarchy creation**
  - Configurable folder structure templates
  - Variable substitution (e.g., `%author%/%series%/%title%`)
  - Special character handling for cross-platform compatibility

- **Configurable naming patterns**
  - File naming templates
  - Auto-replacement of problematic characters
  - Length limitations handling

- **Automatic file sorting and organization**
  - Move/copy/link options for preserving originals
  - Multi-stage organization workflows
  - Cleanup of empty folders

#### Backup Integration

- **Metadata export for backup systems**
  - JSON/XML export of complete metadata
  - Incremental backup support
  - Selective metadata backup

- **Version tracking for metadata changes**
  - Change history for important fields
  - Reversion capability for accidental changes
  - Modification timestamps

- **Restoration procedures for metadata recovery**
  - Re-import from backup files
  - Partial or complete restoration options
  - Conflict resolution for restored data

### 5.2.3 File Format Support

#### Audio Format Compatibility

- **Primary format support**
  - MP3 (ID3v1, ID3v2.3, ID3v2.4)
  - M4A/M4B (iTunes-style metadata)
  - FLAC (Vorbis comments)
  - OGG (Vorbis comments)

- **Multi-file audiobook handling**
  - Proper sequencing of multi-file books
  - Consistent metadata across files
  - Chapter marker distribution

- **Container format processing**
  - M4B chapter extraction and manipulation
  - MP3 Audiobook container support
  - Multi-chapter single file handling

#### Tagging Standards

- **ID3 tag management**
  - Complete ID3v2.4 support
  - Legacy tag version compatibility
  - Extended tag fields for audiobooks

- **Vorbis comment support**
  - Standard and extended field mapping
  - Multiple value handling
  - Unicode support

- **Custom tag fields**
  - Audiobook-specific tag extension
  - App-specific fields for enhanced features
  - Standards compliance with extensions

#### Cover Art Management

- **Embedded cover art**
  - Multiple format embedding (JPEG, PNG)
  - Resolution optimization
  - Multiple image role support (front, back, etc.)

- **External cover images**
  - Standard file naming conventions
  - Resolution variants for different purposes
  - Format conversion as needed

- **Art extraction and embedding**
  - High-quality extraction from embedded sources
  - Web-sourced image processing
  - Size and quality optimization