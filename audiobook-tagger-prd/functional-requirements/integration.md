# Integration Capabilities

## 2.4 Integration Capabilities

The Audiobook Tagger provides robust integration with external services and systems to enhance functionality and interoperability.

### Current Integrations

#### Audnexus API (Primary Metadata Source)

- **Core data provider for audiobook metadata**
  - Complete audiobook details including title, author, narrator
  - Book descriptions, cover art, and runtime information
  - Series data and publication details

- **Chapter information retrieval**
  - Accurate chapter markers with titles
  - Timing data for precise navigation
  - Complete runtime verification

- **Author metadata**
  - Author biographical information
  - Bibliography and related works
  - Author images when available

#### Hardcover.app API Support

- **Push library information**
  - Synchronize local audiobook library with Hardcover.app account
  - Update reading/listening status
  - Share ratings and reviews

- **Potential two-way synchronization**
  - Pull updates from Hardcover.app to local library
  - Sync listening progress across platforms
  - Import collection organization and tags

### Potential Future Integrations

#### Custom API Support

- **Extensible API framework**
  - Pluggable architecture for adding new metadata sources
  - Standardized interface for connecting to various services
  - Configuration options for authentication and endpoints

- **User-defined API connections**
  - Custom endpoint definition
  - Authentication method selection
  - Field mapping configuration

#### Export Capabilities

- **CSV export**
  - Comprehensive metadata in tabular format
  - Field selection options
  - Encoding and delimiter configuration

- **JSON export**
  - Complete metadata structure
  - Filtering options for included fields
  - Pretty-print and minification options

- **Integration with cataloging services**
  - GoodReads compatibility
  - StoryGraph data format
  - Library management system exports