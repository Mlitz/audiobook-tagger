# Audiobook Tagger

A program that tags audiobooks using the Audnexus API and organizes them according to Plex file and folder structure conventions.

## Overview

Audiobook Tagger simplifies the process of managing your audiobook collection for Plex media server. It retrieves metadata from the Audnexus API, applies it to your audiobook files, and organizes them according to Plex conventions.

## Features (Phase 1)

- Search Audnexus API by ASIN or title/author
- Extract and apply metadata to audiobook files
- Command-line interface for basic operations
- Support for M4B and MP3 audiobook files
- Comprehensive logging

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/audiobook-tagger.git
   cd audiobook-tagger
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the example:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your settings, particularly your Audnexus API key.

5. Build the project:
   ```
   npm run build
   ```

## Usage

### Command Line Interface

Basic command to tag a single audiobook file:

```
npm start -- tag --file /path/to/audiobook.m4b
```

Search by ASIN:

```
npm start -- tag --file /path/to/audiobook.m4b --asin B01LWUJKQ7
```

Search by title and author:

```
npm start -- tag --file /path/to/audiobook.m4b --title "Project Hail Mary" --author "Andy Weir"
```

For more options:

```
npm start -- --help
```

## Development

### Running in Development Mode

```
npm run dev -- tag --file /path/to/audiobook.m4b
```

### Testing

```
npm test
```

## Project Roadmap

- **Phase 1** (Current): Core API & Metadata Foundation
- **Phase 2**: File Organization & Format Support
- **Phase 3**: Batch Processing & Conflict Resolution
- **Phase 4**: Web Interface & Docker
- **Phase 5**: Advanced Features & Integration

## License

MIT
