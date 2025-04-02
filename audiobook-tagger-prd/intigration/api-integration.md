# Primary API Integrations

## 5.1 Primary API Integrations

The Audiobook Tagger seamlessly integrates with external APIs to provide comprehensive metadata retrieval and synchronization capabilities.

### 5.1.1 Audnexus API (Core Integration)

#### Implementation Details

- **RESTful API consumption**
  - Standard HTTP request methods
  - JSON response parsing
  - Error handling with appropriate retry logic
  - Rate limiting compliance

- **Region-specific endpoint support**
  - Support for multiple regional endpoints (us, uk, de, fr, etc.)
  - Region-appropriate metadata retrieval
  - Cross-region search capabilities
  - Configurable default region

- **Complete coverage of available endpoints:**
  - `/books/{ASIN}` - Primary book metadata
    * Title, author, description, publisher information
    * Cover art URL retrieval and downloading
    * Release dates and publication details
  - `/books/{ASIN}/chapters` - Chapter information
    * Chapter titles and timestamps
    * Runtime verification
    * Chapter marker creation
  - `/authors/{ASIN}` - Author details
    * Biographical information
    * Bibliography and related works
    * Author images
  - `/authors` - Author search functionality
    * Name-based lookups
    * Filtering and sorting options
    * Result pagination handling

#### Search Implementation

- **Tiered search strategy:**
  - **Direct ASIN lookup (highest priority)**
    * Exact matching using Audible Standard Identification Number
    * Immediate metadata application for exact matches
    * Region-specific ASIN handling

  - **Title + Author combined search**
    * Intelligent query construction
    * Confidence scoring for potential matches
    * Multiple result handling

  - **Fuzzy matching for ambiguous results**
    * Approximate string matching algorithms
    * Weighted field matching
    * Confidence threshold configuration

#### Data Retrieval Optimization

- **Selective field fetching when supported**
  - Request only needed fields
  - Minimize payload size
  - Optimize bandwidth usage

- **Batch processing for related items**
  - Group requests for related content
  - Reduce API call overhead
  - Parallel request handling

- **Rate limiting compliance**
  - Respect API usage limits
  - Implement exponential backoff
  - Queue management for high-volume requests

- **Cache-aware requests with If-Modified-Since headers**
  - Conditional GET requests
  - ETag support
  - Cache invalidation based on response headers

### 5.1.2 Hardcover.app API

#### Library Synchronization

- **Push local library data to Hardcover.app**
  - Send complete audiobook library information
  - Incremental updates for changed items
  - Conflict resolution for divergent data

- **Selective synchronization of chosen metadata fields**
  - Field-level synchronization options
  - One-way or bidirectional field updates
  - Custom field mapping configuration

- **Conflict resolution for divergent metadata**
  - Detection of conflicting information
  - Resolution strategies (local priority, remote priority, newest, manual)
  - Audit trail for synchronization activities

#### Account Integration

- **Secure API key storage**
  - Encrypted local storage
  - Optional key retrieval
  - Authentication state management

- **OAuth-based authentication flow**
  - Standard OAuth 2.0 implementation
  - Token refresh handling
  - Session persistence

- **User permission scoping**
  - Minimal required permissions
  - Transparent permission explanation
  - Revocation handling

#### Collection Management

- **Custom shelf/collection synchronization**
  - Map local organization to Hardcover shelves
  - Create and update shelves
  - Bidirectional shelf membership

- **Reading status and progress tracking**
  - Listening progress synchronization
  - Completion status updates
  - Start/finish date tracking

- **Rating and review synchronization**
  - Star rating transfer
  - Review text synchronization
  - Private/public review setting

### 5.1.3 API Data Mapping

#### Field Standardization

- **Consistent internal data model**
  - Normalized field names
  - Standardized data formats
  - Relationship modeling

- **Source-specific field mapping**
  - Custom mapping for each API source
  - Field transformation rules
  - Default value handling

- **Data validation and normalization**
  - Format validation for imported data
  - Consistency checking
  - Error correction when possible

#### Extended Metadata Handling

- **Genre and category mapping**
  - Standardized genre hierarchy
  - Cross-source genre normalization
  - Multiple classification support

- **Related content linking**
  - Series relationship management
  - Author bibliography construction
  - Similar title recommendations

- **Language and regional handling**
  - Multi-language support
  - Regional variant management
  - Character encoding normalization