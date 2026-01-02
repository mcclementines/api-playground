# API Playground Frontend

A modern React + TypeScript frontend for testing backend APIs through an OpenAPI-driven interface.

## Features

- **OpenAPI-Driven UI**: Dynamically generates testing interface from OpenAPI 3.0 specifications
- **Request Builder**: Build API requests with dynamic forms based on endpoint parameters
- **Live Payload Preview**: See the exact request payload in real-time as you build
- **Response Viewer**: View responses in both formatted (Pretty) and raw JSON modes
- **Request History**: Automatically saves last 50 requests with localStorage persistence
- **Multiple Services**: Test multiple backend services (dog-api, jsonplaceholder, etc.)

## Tech Stack

- **Framework**: React 19 + TypeScript 5
- **Build Tool**: Vite 7
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **Code Editor**: Monaco Editor (VS Code editor)
- **JSON Viewer**: @uiw/react-json-view

## Prerequisites

- Node.js 18+ and npm
- Backend API server running on `http://localhost:8080` (see ../api/)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

Build output will be in the `dist/` directory.

### 4. Preview Production Build

```bash
npm run preview
```

## How to Use

### 1. Select a Service

Click the "Select Service" dropdown in the sidebar and choose a service (e.g., "dog-api" or "jsonplaceholder").

### 2. Choose an Endpoint

The sidebar will populate with available endpoints from the OpenAPI spec. Click an endpoint to select it.

### 3. Build Your Request

The Request Builder tab will show dynamic forms based on the endpoint:

- **Path Parameters**: Required parameters in the URL path (e.g., `/posts/{id}`)
- **Query Parameters**: Optional URL query parameters
- **Headers**: Add custom headers
- **Request Body**: HTML form fields automatically generated from OpenAPI schema (for POST/PUT/PATCH)
- **Payload Preview**: Live preview of the exact HTTP request

### 4. Send the Request

Click the "Send Request" button. The app will:

- Validate required fields
- Send the request through the backend proxy
- Auto-switch to the Response tab

### 5. View the Response

The Response tab shows:

- **Status Code**: Color-coded badge (green for success, red for errors)
- **Response Headers**: Toggle to show/hide
- **Response Body**:
  - **Pretty**: Formatted JSON with collapsible sections
  - **Raw**: Monaco editor with syntax highlighting

### 6. View History

Click the "History" button in the header to:

- See all past requests (last 50)
- View timestamps and status codes
- Click any entry to replay it
- Clear all history (with confirmation)

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API client and types
│   ├── components/             # React components
│   │   ├── layout/            # App layout
│   │   ├── request-builder/   # Request building
│   │   ├── response-viewer/   # Response display
│   │   ├── history/           # Request history
│   │   ├── spec-viewer/       # OpenAPI spec
│   │   └── shared/            # Shared components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── stores/                # Zustand state
│   ├── types/                 # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## API Configuration

The frontend connects to the backend API at `http://localhost:8080` by default.

To change this, modify `src/api/client.ts`:

```typescript
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: 'http://your-backend-url:port',
};
```

## Features in Detail

### OpenAPI-Driven Forms

The app reads OpenAPI specifications and automatically generates forms with:

- **Parameters**: Type validation (string, number, boolean, etc.)
- **Request Bodies**: HTML form fields generated from schema properties
- Required field validation with visual indicators
- Enum dropdowns for constrained values
- Min/max constraints with validation
- Pattern validation
- Help text from descriptions
- Toggle between form view and JSON view

### Live Payload Preview

As you fill in the form, the payload preview updates in real-time showing the exact HTTP request that will be sent to the external API (method, URL, headers, and body).

### Request History

- Automatically saves every request
- Persists to localStorage (survives page refresh)
- Shows timestamps (relative: "5m ago", "2h ago")
- Color-coded method badges and status codes
- Click to replay any previous request
- Max 50 entries (FIFO)

### Response Viewer

**Pretty Mode:**
- Collapsible JSON tree
- Copy to clipboard
- Shows object sizes
- Syntax highlighting

**Raw Mode:**
- Monaco editor (read-only)
- Full syntax highlighting
- Line numbers
- Search and scroll

## Troubleshooting

### Backend Connection Issues

**Error**: "Failed to fetch services"

**Solution**: Ensure the backend API is running on `http://localhost:8080`. Start the backend:

```bash
cd ../api
go run cmd/server/main.go
```

### CORS Issues

The backend already has CORS enabled for all origins. If you still see CORS errors, check:

1. Backend is running
2. Backend logs don't show errors
3. Browser console for specific CORS messages

### Build Errors

**Error**: "Cannot find module"

**Solution**: Delete `node_modules` and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Monaco Editor and modern JavaScript features require recent browser versions.

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

See project root for license information.
