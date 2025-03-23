# CS4218 Team 23

## CI Run (3%)

Link to CI Run: https://github.com/cs4218/cs4218-2420-ecom-project-team23/actions/runs/13234945878

Before running the application:

```
npm i
cd client/
npm i
```

---

## Running the Application

To run the application: `npm run dev`

---

## Running the tests

**To run frontend and backend tests:**

1. Run frontend tests: `npm run test:frontend`
2. Run backend tests: `npm run test:backend`

**To run playwright UI tests:**

1. Run the application: `npm run dev`
2. Run UI test: `npm run test:ui`

**To run all tests**

1. Run the application: `npm run dev`
2. Run all tests: `npm run test`

---

## Code Coverage (2%)

**To run sonarqube:**

1. Generate test coverage report for frontend and backend
   - Run frontend tests: `npm run test:frontend`
   - Run backend tests: `npm run test:backend`
2. Start sonarqube: `<sonarqube_dir>/<bin>/<your_os_sys>/sonar.sh start`
3. Update `sonar-project.properties` with your created user token
   - `sonar.token = <your_generated_token>`
4. Run sonar-scanner: `npm run sonarqube`
