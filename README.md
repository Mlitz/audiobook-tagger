# Audiobook Tagger

A specialized application designed to tag audiobooks using the Audnexus API and organize them according to Plex file and folder structure conventions.

## Features

- Metadata Retrieval: Automatically fetch rich metadata for your audiobooks
- Efficient Tagging: Quickly tag multiple files with accurate metadata
- Media Server Integration: Organize files according to Plex conventions
- Audiobook-Specific Tags: Support for specialized audiobook metadata fields
- Batch Processing: Process multiple files simultaneously

## Development Status

This project is currently in Phase 1 of development, which focuses on establishing the core foundation and API integration.

### Current Features (Phase 1)

- Core application architecture
- Audnexus API connectivity
- Basic metadata retrieval mechanisms
- Error handling and logging framework
- Foundation for future development phases

## Installation

```
# Clone the repository
git clone https://github.com/yourusername/audiobook-tagger.git

# Navigate to the project directory
cd audiobook-tagger

# Install dependencies
npm install

# Start the application in development mode
npm run dev
```

## Building the Application

```
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist -- --mac
npm run dist -- --win
npm run dist -- --linux
```

## Development

```
# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
audiobook-tagger/
|- src/                        # Application source code
|  |- main/                    # Main process code
|  |- renderer/                # Renderer process code
|  |- api/                     # API integration layer
|  |- core/                    # Core application logic
|  |- errors/                  # Error handling system
|- test/                       # Test files
|- scripts/                    # Development and build scripts
|- package.json                # Project metadata
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Audnexus API (https://api.audnex.us) for providing the metadata service
- Electron (https://www.electronjs.org/) for the application framework