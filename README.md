# forceCalendar Interface

Enterprise-grade calendar UI components powered by [@forcecalendar/core](https://www.npmjs.com/package/@forcecalendar/core).

## Overview

forceCalendar Interface provides production-ready calendar components built as Web Components, making them framework-agnostic and compatible with any JavaScript environment - including sandboxed environments like Salesforce Lightning Web Components.

## Features

- **Powered by NPM Package** - Uses @forcecalendar/core for all calendar logic
- **Multiple Views** - Month, Week, and Day views
- **Web Components** - Works with React, Vue, Angular, or vanilla JS
- **Enterprise Design** - Clean, professional, optimized for business use
- **High Performance** - Leverages spatial indexing for instant rendering
- **Salesforce Ready** - Works in LWC and other sandboxed environments

## Installation

```bash
npm install @forcecalendar/interface
```

## Quick Start

### HTML (via CDN)
```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import 'https://unpkg.com/@forcecalendar/interface@latest';
    </script>
</head>
<body>
    <force-calendar view="month"></force-calendar>
</body>
</html>
```

### JavaScript (ES Modules)
```javascript
import '@forcecalendar/interface';

// The component auto-registers as a web component
const calendar = document.createElement('force-calendar');
calendar.setAttribute('view', 'month');
document.body.appendChild(calendar);
```

### JavaScript (CommonJS/Node.js)
```javascript
require('@forcecalendar/interface');
```

## Demo

```bash
npm install
npm run build
npx http-server . -p 8080
# Open http://localhost:8080/demo.html
```

Or for development:

```bash
npm run dev
# Opens development server with hot reload
```

## License

MIT