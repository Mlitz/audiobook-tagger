# Metadata Source Prioritization

## 6.2 Metadata Source Prioritization

The Audiobook Tagger provides flexible configuration options for prioritizing different metadata sources and resolving conflicts between them.

### 6.2.1 Source Hierarchy

#### Provider Ranking

- **Customizable order of metadata sources**
  - Drag-and-drop priority configuration
  - Source-specific priority scores
  - Context-sensitive prioritization
  - Default source hierarchy

- **Field-specific source preferences**
  - Different priorities for different fields
  - Source specialization recognition
  - Quality-based field selection
  - Override capability for specific fields

- **Quality-based source selection**
  - Source reliability ratings
  - Data completeness assessment
  - Historical accuracy tracking
  - Community rating integration

#### Conflict Resolution

- **Field-level override policies**
  - Always prefer highest priority source
  - Field-by-field source preference
  - Quality-based selection
  - Most complete data preference

- **Source trustworthiness settings**
  - Global source reliability ratings
  - User-adjustable trust levels
  - Community-sourced reliability data
  - Adaptive trust based on history

- **User confirmation thresholds**
  - Confidence level requirements for auto-applying
  - Conflict severity assessment
  - Manual review triggers
  - Batch vs. individual thresholds

#### Dynamic Source Selection

- **Content-aware source selection**
  - Genre-specific source preferences
  - Language-appropriate sources
  - Regional content optimization
  - Publication-era considerations

- **Genre-specific source preferences**
  - Recognition of source specialization
  - Genre authority configuration
  - Subject matter expertise weighting
  - Content type matching

- **Age-appropriate content filtering**
  - Content rating consideration
  - Explicit content handling
  - Child-friendly description sources
  - Audience-appropriate metadata

### 6.2.2 Field-Level Configuration

#### Field Prioritization

- **Selective field updating**
  - Field-by-field update control
  - Preservation of manually edited fields
  - Source-specific field trusting
  - Quality threshold per field

- **Required vs. optional fields**
  - Designation of critical fields
  - Optional field handling
  - Minimum required field set configuration
  - Field completeness scoring

- **Field completion threshold requirements**
  - Minimum data quality metrics
  - Field length/detail requirements
  - Validation rule satisfaction
  - Format compliance checking

#### Data Transformation

- **Field format standardization**
  - Case normalization options
  - Date format standardization
  - Number formatting preferences
  - Unit conversion options

- **Value normalization rules**
  - Spelling standardization
  - Abbreviation handling
  - Character set normalization
  - Punctuation standardization

- **Custom transformation scripts**
  - Field-specific transformation logic
  - Regular expression replacements
  - Function-based transformations
  - Multi-step processing pipelines

### 6.2.3 Conflict Detection and Resolution

#### Identifying Conflicts

- **Field value comparison methods**
  - Exact match checking
  - Semantic equivalence detection
  - Format-aware comparison
  - Fuzzy matching options

- **Significant difference detection**
  - Threshold for meaningful differences
  - Type-specific comparison logic
  - Change magnitude assessment
  - Context-aware significance

- **Pattern-based conflict detection**
  - Recognition of systematic differences
  - Common variation patterns
  - Version-specific differences
  - Regional variation awareness

#### Resolution Strategies

- **Configurable resolution rules**
  - Source priority-based resolution
  - Newest data preference
  - Most complete data selection
  - Quality-based decision making

- **Interactive conflict resolution**
  - Side-by-side comparison interface
  - Field-by-field selection
  - Hybrid value creation
  - Apply to similar conflicts option

- **Automatic merging capabilities**
  - Complementary data combination
  - Non-conflicting field merging
  - Best elements selection
  - Consistent application of merge rules

### 6.2.4 Source Management

#### API Configuration

- **Authentication settings**
  - Credential management
  - Token storage and refresh
  - API key security
  - Session handling

- **Rate limiting and optimization**
  - Request throttling settings
  - Concurrent request limits
  - Batch request configuration
  - Caching policy settings

- **Endpoint customization**
  - Custom API endpoints
  - Regional server selection
  - Fallback server configuration
  - Proxy settings

#### Source Monitoring

- **Availability tracking**
  - Source status monitoring
  - Downtime detection
  - Automatic failover settings
  - Recovery verification

- **Performance metrics**
  - Response time tracking
  - Success rate monitoring
  - Data quality assessment
  - Resource usage measurement

- **Usage reporting**
  - Request volume tracking
  - Quota management
  - Cost estimation features
  - Usage optimization recommendations