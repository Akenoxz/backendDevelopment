# Movies CRUD API - Testing Guide

## Prerequisites

- Node.js installed
- REST Client extension for VSCode installed

## Installation

```bash
npm install
```

## Running the Server

### Development Mode (with Morgan logging)

```bash
npm start
```

The server will start on `http://localhost:3000`

## Morgan Logging

Morgan is configured in **development mode** (`dev` format) which logs:

- HTTP method (GET, POST, PUT, DELETE)
- Request URL
- Response status code
- Response time
- Content length

### Example Log Output:

```
GET /movies 200 15.123 ms - 312
POST /movies 201 8.456 ms - 89
PUT /movies/1 200 5.789 ms - 95
DELETE /movies/3 204 3.234 ms - -
GET /movies/999 404 2.567 ms - 28
```

## Running Tests

### Using REST Client Extension

1. **Open test files:**

   - `test.http` - Main test file with all operations
   - `api-tests.http` - Comprehensive automated test suite

2. **Execute tests:**

   - Click "Send Request" above any `###` separator
   - Or use keyboard shortcut: `Ctrl+Alt+R` (Windows/Linux) or `Cmd+Alt+R` (Mac)

3. **View results:**
   - Results appear in a split panel on the right
   - Check status codes and response bodies

### Test Coverage

The `api-tests.http` file includes **45+ automated tests** covering:

#### 1. GET Requests (3 tests)

- Retrieve all movies
- Get movie by ID (existing)
- Get movie by ID (non-existent)

#### 2. Query Parameter Filtering (5 tests)

- Filter by year
- Filter by director
- Filter by title
- Combined filters
- No results scenario

#### 3. POST Requests (7 tests)

- Valid movie creation
- Missing required fields
- Empty title validation
- Invalid year type
- Year before 1888
- Year too far in future
- Valid upcoming year

#### 4. PUT Requests (7 tests)

- Update all fields
- Partial updates (title, year)
- Non-existent ID
- Invalid year
- Empty title/director

#### 5. DELETE Requests (2 tests)

- Delete existing movie
- Delete non-existent movie

#### 6. Error Handling (3 tests)

- Undefined routes
- Unsupported HTTP methods

#### 7. Edge Cases (5 tests)

- Boundary year values (1888, current + 5)
- URL encoding
- Multiple query parameters

## Expected HTTP Status Codes

- `200 OK` - Successful GET/PUT operations
- `201 Created` - Successful POST (movie created)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid data or missing required fields
- `404 Not Found` - Resource not found or undefined route

## API Endpoints

### Get all movies

```
GET /movies
```

### Get all movies with filters

```
GET /movies?year=2010
GET /movies?director=Nolan
GET /movies?title=Matrix
GET /movies?year=2010&director=Christopher Nolan
```

### Get movie by ID

```
GET /movies/:id
```

### Create new movie

```
POST /movies
Content-Type: application/json

{
  "title": "Movie Title",
  "director": "Director Name",
  "year": 2024
}
```

### Update movie

```
PUT /movies/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "director": "Updated Director",
  "year": 2025
}
```

### Delete movie

```
DELETE /movies/:id
```

## Validation Rules

### Title

- Required for POST
- Cannot be empty or whitespace only
- Trimmed before storage

### Director

- Required for POST
- Cannot be empty or whitespace only
- Trimmed before storage

### Year

- Required for POST
- Must be a valid number
- Must be between 1888 and (current year + 5)
- Example: In 2025, valid range is 1888-2030

## Checking Logs

After running tests, check your terminal where the server is running to see Morgan logs:

1. **Start the server**: `npm start`
2. **Run tests**: Execute requests from `api-tests.http`
3. **View logs**: Check terminal output for colored HTTP request logs

Each request will show:

- Method and path in color (green for 2xx, red for 4xx/5xx)
- Status code
- Response time in milliseconds
- Response size

## Tips

- Run tests sequentially to see the full logging output
- Check logs to verify all requests are being tracked
- Use filters to test query parameter functionality
- Test error scenarios to ensure proper validation
