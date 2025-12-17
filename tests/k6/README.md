# K6 Performance Tests - REST API Authentication

This directory contains automated performance tests using K6 for the REST API authentication system.

## 📁 Project Structure

```
tests/k6/
├── config.js                 # Centralized test configuration
├── performance-test.js       # Main performance test
├── helpers/                  # Reusable helper functions
│   ├── api.js               # API call helpers
│   └── faker.js             # Random data generation
└── README.md                # This documentation
```

## 🎯 Implemented Concepts

### 1. **Thresholds** 
📍 **Location:** `config.js` (lines 13-20) and `performance-test.js` (export options)

Defines acceptable performance limits that tests must meet:
- `http_req_duration`: 95% of requests must have duration < 500ms
- `http_req_failed`: Error rate must be < 5%
- `checks`: 95% of checks must pass
- Specific thresholds for login and profile operations

**Example:**
```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.05'],
  checks: ['rate>0.95'],
}
```

### 2. **Checks**
📍 **Location:** `performance-test.js` (multiple occurrences) and `helpers/api.js` (lines 41-48)

Validations that verify if responses are correct. Examples include:
- HTTP status verification
- Response field validation
- Response time verification
- Token and user data validation

**Example:**
```javascript
check(response, {
  'login status is 200': (r) => r.status === 200,
  'login has token': (r) => JSON.parse(r.body).data.token !== undefined,
  'login response time < 800ms': (r) => r.timings.duration < 800,
});
```

### 3. **Helpers**
📍 **Location:** `helpers/api.js` (entire file) and `helpers/faker.js` (entire file)

Reusable functions that facilitate test writing:
- `helpers/api.js`: Functions to interact with the API (login, register, getProfile, etc.)
- `helpers/faker.js`: Functions to generate random data using Faker library

**Example:**
```javascript
export function loginUser(baseUrl, credentials) {
  const url = `${baseUrl}/api/auth/login`;
  const payload = JSON.stringify(credentials);
  return http.post(url, payload, params);
}
```

### 4. **Trends**
📍 **Location:** `performance-test.js` (lines 28-31, and usage on lines 167, 215, etc.)

Custom metrics that track trends over time:
- `login_duration`: Login duration time
- `profile_duration`: Profile access time
- `update_duration`: Profile update time
- `list_users_duration`: User listing time

**Example:**
```javascript
const loginDuration = new Trend('login_duration', true);
loginDuration.add(loginResponse.timings.duration);
```

### 5. **Faker**
📍 **Location:** `helpers/faker.js` (entire file)

Random data generation using the official Faker library to create realistic test scenarios:
- Random emails
- Random usernames
- Random secure passwords
- Profile data for updates

**Example:**
```javascript
import { Faker } from 'https://esm.sh/@faker-js/faker';
const faker = new Faker({ locale: 'en' });

export function randomUser() {
  return {
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  };
}
```

### 6. **Environment Variables**
📍 **Location:** `config.js` (lines 10, 24)

Use of environment variables to dynamically configure the test:
- `BASE_URL`: API base URL
- `ENVIRONMENT`: Execution environment (local, staging, production)

**Usage:**
```bash
BASE_URL=http://localhost:3000 ENVIRONMENT=local k6 run performance-test.js
```

### 7. **Stages**
📍 **Location:** `config.js` (lines 23-29)

Defines different load stages during the test:
1. **Ramp-up** (30s): 0 → 10 users
2. **Average Load** (1min): 10 → 50 users
3. **Peak** (30s): 50 → 100 users
4. **Sustained** (1min): 100 constant users
5. **Ramp-down** (30s): 100 → 0 users

**Example:**
```javascript
stages: [
  { duration: '30s', target: 10 },
  { duration: '1m', target: 50 },
  { duration: '30s', target: 100 },
  { duration: '1m', target: 100 },
  { duration: '30s', target: 0 },
]
```

### 8. **Response Reuse**
📍 **Location:** `performance-test.js` (lines 132, 151, 179)

Extracts and reuses data from previous responses:
- JWT token extracted from registration/login is reused in all subsequent requests
- User ID is extracted and used for specific operations

**Example:**
```javascript
// Extract token from response
if (registerResponse.status === 201) {
  const body = JSON.parse(registerResponse.body);
  authToken = body.data.token;  // Store for later use
  userId = body.data.user.id;
}

// Reuse token in protected requests
api.getProfile(baseUrl, authToken);
```

### 9. **Authentication Token Usage**
📍 **Location:** `helpers/api.js` (functions getProfile, updateProfile, getAllUsers, etc.) and `performance-test.js` (groups 2, 3, 4)

All protected requests use the JWT token in the Authorization header:
- Obtained during registration or login
- Used in all operations that require authentication

**Example:**
```javascript
const params = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
};
```

### 10. **Data-Driven Testing**
📍 **Location:** `helpers/faker.js` (generateTestUsers function) and `performance-test.js` (line 30)

Uses dynamically generated data with Faker library to create multiple test scenarios:
- 10 users generated with Faker at test initialization
- Random user selection for each iteration
- Allows testing with different data profiles

**Example:**
```javascript
// Generate test users with Faker
const testUsers = faker.generateTestUsers(10);

// Select random user for each iteration
const userData = faker.randomChoice(testUsers);
```

### 11. **Groups**
📍 **Location:** `performance-test.js` (lines 94, 107, 152, 192, 255, 284)

Organizes tests into logical groups for better analysis:
- **Group 1**: Authentication Flow (Registration and Login)
- **Group 2**: Profile Operations (Profile and Update)
- **Group 3**: User Operations (Listing and Search)
- **Group 4**: System Statistics (API Statistics)

**Example:**
```javascript
group('01 - Authentication Flow', function () {
  group('Register New User', function () {
    // Registration test
  });
  
  group('User Login', function () {
    // Login test
  });
});
```

## 🚀 How to Run Tests

### Prerequisites

1. Install K6:
   - **macOS**: `brew install k6`
   - **Windows**: `choco install k6`
   - **Linux**: See [official documentation](https://k6.io/docs/getting-started/installation/)

2. Start the API:
```bash
npm start
# or
npm run dev
```

### Running Tests

#### Basic Execution
```bash
npm run test:k6
```

#### Execution with Environment Variables
```bash
BASE_URL=http://localhost:3000 ENVIRONMENT=local npm run test:k6
```

#### Execution with Different Configurations

**Quick Test (smoke test):**
```bash
npm run test:k6:smoke
```

**Load Test:**
```bash
npm run test:k6:load
```

**Stress Test:**
```bash
npm run test:k6:stress
```

## 📊 Reports

Tests generate two types of reports:

### 1. HTML Report
📍 **Location:** `reports/k6-performance-report.html`

Visual and interactive report with:
- Performance graphs
- Detailed metrics
- Trend analysis
- Check results
- Breakdown by groups

### 2. JSON Report
📍 **Location:** `reports/k6-summary.json`

Raw data in JSON format for additional processing or integration with other tools.

### View Reports

After running tests, open the HTML report in your browser:
```bash
open reports/k6-performance-report.html
# or
xdg-open reports/k6-performance-report.html  # Linux
```

## 📈 Collected Metrics

### K6 Standard Metrics
- `http_req_duration`: HTTP request duration
- `http_req_failed`: Request failure rate
- `http_reqs`: Total number of requests
- `iterations`: Number of complete iterations
- `vus`: Number of active virtual users

### Custom Metrics (Trends)
- `login_duration`: Login time
- `profile_duration`: Profile access time
- `update_duration`: Update time
- `list_users_duration`: User listing time

### Rate Metrics
- `successful_logins`: Login success rate
- `successful_profile_access`: Profile access success rate

### Counters
- `total_requests`: Total requests made
- `failed_requests`: Total failed requests

## 🎯 Defined Thresholds

| Metric | Threshold | Description |
|---------|-----------|-----------|
| http_req_duration | p(95)<500ms | 95% of requests must be < 500ms |
| http_req_duration | p(99)<1000ms | 99% of requests must be < 1000ms |
| http_req_failed | rate<0.05 | Error rate must be < 5% |
| checks | rate>0.95 | 95% of checks must pass |
| http_req_duration{type:login} | p(95)<800ms | 95% of logins < 800ms |
| http_req_duration{type:profile} | p(95)<400ms | 95% of profile accesses < 400ms |

## 🔧 Advanced Configuration

### Modify Stages

Edit `config.js` to change load stages:
```javascript
stages: [
  { duration: '1m', target: 20 },   // Your configuration
  { duration: '3m', target: 100 },
  { duration: '1m', target: 0 },
]
```

### Add New Thresholds

Add in `config.js`:
```javascript
thresholds: {
  'http_req_duration{name:register}': ['p(95)<1000'],
  // Other thresholds...
}
```

### Generate More Test Data

Modify the number of generated users in `performance-test.js`:
```javascript
const testUsers = faker.generateTestUsers(20); // Generate 20 users instead of 10
```

## 🐛 Troubleshooting

### API not responding
```bash
# Check if API is running
curl http://localhost:3000/api/health
```

### Error: "Cannot find module"
```bash
# Make sure you're in the correct directory
cd tests/k6
k6 run performance-test.js
```

### Thresholds failing
- Check if API has good performance
- Consider increasing limits in `config.js`
- Reduce load (fewer VUs or less aggressive stages)

## 📚 References

- [K6 Documentation](https://k6.io/docs/)
- [K6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [K6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [K6 Checks](https://k6.io/docs/using-k6/checks/)
- [Faker.js](https://fakerjs.dev/)

## 🤝 Contributing

To add new tests or improve existing ones:

1. Create new helpers in `helpers/`
2. Add new groups in the main file
3. Update this README with changes

## 📝 Notes

- Tests create temporary users during execution
- Setup data is created in the `setup()` function
- Reports are automatically generated in the `reports/` folder
- Use environment variables for different test environments
- Test data is generated dynamically with Faker for realistic scenarios

---

**Developed by:** Henrique Cutri  
**Project:** Final Work - API Automation with K6  
**Date:** December 2025
