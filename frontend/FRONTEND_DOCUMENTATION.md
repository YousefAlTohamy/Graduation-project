# CareerCompass Frontend - Complete Documentation

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios API client configuration
│   │   └── endpoints.js       # API endpoints definitions
│   │
│   ├── components/            # Reusable React components
│   │   ├── Button.jsx         # Custom button component
│   │   ├── Card.jsx           # Custom card wrapper
│   │   ├── ErrorAlert.jsx     # Error notification component
│   │   ├── ErrorBoundary.jsx  # Error boundary for error catching
│   │   ├── LoadingSpinner.jsx # Loading state component
│   │   ├── Navbar.jsx         # Navigation bar
│   │   ├── ProtectedRoute.jsx # Route protection middleware
│   │   └── SuccessAlert.jsx   # Success notification component
│   │
│   ├── context/               # React Context for state management
│   │   └── AuthContext.jsx    # Authentication context
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAsync.js        # Async operation hook
│   │   └── useAuthHandler.js  # Auth handler hook
│   │
│   ├── pages/                 # Page components
│   │   ├── Dashboard.jsx      # User dashboard
│   │   ├── GapAnalysis.jsx    # Job gap analysis page
│   │   ├── Home.jsx           # Home page
│   │   ├── Jobs.jsx           # Job browsing page
│   │   ├── Login.jsx          # Login page
│   │   ├── NotFound.jsx       # 404 page
│   │   ├── Profile.jsx        # User profile page
│   │   └── Register.jsx       # Registration page
│   │
│   ├── services/              # Service layer
│   │   └── storageService.js  # Local storage management
│   │
│   ├── App.jsx                # Main app component
│   ├── index.css              # Global styles
│   └── main.jsx               # Entry point
│
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── postcss.config.js
```

## 🎯 Features

### 1. **Authentication**
- User registration with validation
- Secure login with JWT tokens
- Token-based API requests
- Automatic logout on token expiry
- Session persistence

### 2. **Dashboard**
- CV upload and analysis
- Automatic skill extraction
- Visual skill display
- Skill management (add/remove)
- Personalized recommendations

### 3. **Job Browsing**
- Browse available job listings
- Real-time job details
- Advanced gap analysis
- Skill matching visualization
- Salary and experience information

### 4. **Gap Analysis**
- Match current skills with job requirements
- Identify missing skills
- Match percentage calculation
- Personalized recommendations for skill development
- Detailed analysis views

### 5. **User Profile**
- View user information
- Edit profile details
- Account management
- Session management

## 🔐 Error Handling

### Global Error Boundary
- Catches unhandled React errors
- Displays user-friendly error messages
- Recovery options

### API Error Handling
- Automatic token refresh on 401
- Proper error messages for different status codes
- Network error handling
- Validation error display

### Component-Level Error Handling
- Try-catch blocks for async operations
- Error state management
- User feedback through alerts
- Loading states

## 📝 API Integration

### Endpoints Used

**Authentication:**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

**CV Management:**
- `POST /api/upload-cv` - Upload CV file
- `GET /api/user/skills` - Get user skills
- `DELETE /api/user/skills/{id}` - Remove skill

**Jobs:**
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/{id}` - Get job details
- `POST /api/jobs/scrape` - Scrape new jobs

**Gap Analysis:**
- `GET /api/gap-analysis/job/{id}` - Analyze job gap
- `POST /api/gap-analysis/batch` - Batch analysis
- `GET /api/gap-analysis/recommendations` - Get recommendations

## 🎨 UI Components

### Button Component
```jsx
<Button
  variant="primary" // primary, secondary, danger, outline
  size="md"         // sm, md, lg
  loading={false}
  disabled={false}
>
  Click me
</Button>
```

### Card Component
```jsx
<Card hover={true}>
  Content here
</Card>
```

### Alert Components
```jsx
<ErrorAlert
  title="Error"
  message="Something went wrong"
  onClose={() => {}}
/>

<SuccessAlert
  title="Success"
  message="Operation completed"
  onClose={() => {}}
/>
```

### Loading Spinner
```jsx
<LoadingSpinner
  fullScreen={false}
  message="Loading..."
/>
```

## 🪝 Custom Hooks

### useAsync
```jsx
const { execute, loading, error, data, clearError } = useAsync(asyncFunction);

const handleSubmit = async () => {
  try {
    await execute(arg1, arg2);
  } catch (err) {
    console.error(err);
  }
};
```

### useAuthHandler
```jsx
const { user, login, register, logout, handleApiError } = useAuthHandler();

try {
  await login(email, password);
} catch (err) {
  const message = handleApiError(err);
}
```

## 💾 Local Storage Service

```jsx
import { storageService } from './services/storageService';

// Auth token
storageService.setAuthToken(token);
const token = storageService.getAuthToken();
storageService.removeAuthToken();

// User data
storageService.setUser(userData);
const user = storageService.getUser();
storageService.removeUser();

// Cache management (1-hour TTL)
storageService.setCache('key', value, 3600000);
const cached = storageService.getCache('key');
storageService.removeCache('key');
storageService.clearAllCache();
```

## 🔄 Request/Response Flow

1. **Request Interceptor**
   - Automatically adds auth token
   - Sets correct headers
   - Handles multipart form data

2. **Response Interceptor**
   - Catches 401 errors (auto-logout)
   - Formats error messages
   - Returns clean response data

3. **Error Handling**
   - Component-level error states
   - User-friendly error messages
   - Network error handling
   - Validation error display

## 🛡️ Security Features

- JWT token-based authentication
- Protected routes for authenticated users
- Automatic token removal on logout
- CORS handling
- Input validation
- XSS protection through React
- Secure password storage (backend)

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS responsive classes
- Mobile menu navigation
- Adaptive grid layouts
- Touch-friendly buttons

## 🎯 Testing Checklist

- [ ] User registration
- [ ] User login/logout
- [ ] CV upload and analysis
- [ ] Skill viewing and management
- [ ] Job browsing and filtering
- [ ] Gap analysis calculation
- [ ] Profile editing
- [ ] Error handling (all scenarios)
- [ ] Loading states
- [ ] Responsive design
- [ ] Token expiry handling
- [ ] Browser console (no errors)

## 🚀 Deployment

1. Build for production: `npm run build`
2. Output in `dist/` directory
3. Serve static files from web server
4. Ensure API backend is accessible
5. Configure CORS on backend if needed

## 🔧 Environment Variables

Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Axios](https://axios-http.com)
- [React Router](https://reactrouter.com)

## 🐛 Troubleshooting

### Blank page appears
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API issues
4. Clear browser cache and refresh

### API errors
1. Verify backend is running on port 8000
2. Check browser console for detailed errors
3. Verify auth token is being sent
4. Check CORS settings

### Styling issues
1. Restart dev server: `npm run dev`
2. Clear Tailwind cache: `npm run build:tailwind`
3. Check if styles are being loaded from `index.css`

### Authentication issues
1. Check localStorage in DevTools
2. Verify auth_token and user are stored
3. Check if token is being sent in requests
4. Clear localStorage and login again
