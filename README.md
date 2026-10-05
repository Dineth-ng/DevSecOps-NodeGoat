<img width="2720" height="1320" alt="nodegoat_architecture" src="https://github.com/user-attachments/assets/fef2d87b-adf1-40de-bf65-5355e4ece380" />
# 🔐 DevSecOps NodeGoat Security Project

A DevSecOps security implementation based on the **OWASP NodeGoat** vulnerable Node.js application.

This project demonstrates how security can be integrated into the software development lifecycle using:

- Docker
- Docker Compose
- GitHub Actions
- Semgrep SAST
- Gitleaks Secret Scanning
- npm Audit
- Trivy Container Scanning
- Secure coding fixes
- Git branching and Pull Requests

---

# 📌 Project Overview

OWASP NodeGoat is an intentionally vulnerable Node.js application designed for learning web application security.

In this project, our group used NodeGoat to demonstrate a practical **DevSecOps workflow**.

The main goals were:

1. Identify vulnerable code.
2. Exploit selected vulnerabilities.
3. Apply secure coding fixes.
4. Containerize the application.
5. Harden the Docker environment.
6. Build a CI/CD security pipeline.
7. Automatically scan source code, dependencies, secrets, and Docker images.
8. Store evidence of before-and-after security testing.

---

# 🛠 Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | Application runtime |
| Express.js | Web application framework |
| MongoDB | Database |
| Docker | Application containerization |
| Docker Compose | Multi-container orchestration |
| GitHub Actions | CI/CD automation |
| Semgrep | Static Application Security Testing |
| Gitleaks | Secret detection |
| npm audit | Dependency vulnerability scanning |
| Trivy | Docker image vulnerability scanning |
| Git | Version control |
| GitHub | Repository and Pull Request management |

---

# 🏗 Architecture

The application contains two main containers:

```text
                    Internet / User
                           |
                           |
                     Port 4000
                           |
                           v
                +---------------------+
                |   NodeGoat Web App  |
                |                     |
                | Node.js + Express   |
                | Non-root user       |
                +----------+----------+
                           |
                           |
                  Docker backend-net
                           |
                           v
                +---------------------+
                |      MongoDB        |
                |                     |
                |    Port 27017       |
                | Internal only       |
                +---------------------+
```


<img width="2720" height="1320" alt="nodegoat_architecture" src="https://github.com/user-attachments/assets/306780d5-3470-499d-83c6-35bb74b7283b" />


The web application communicates with MongoDB using Docker's internal DNS.

For example:

```text
mongodb://mongo:27017/nodegoat
```

`mongo` is the Docker Compose service name.

MongoDB port `27017` is not published to the host.

Only the NodeGoat web application is exposed:

```text
localhost:4000
```

---

# 📂 Project Structure

```text
DevSecOps-NodeGoat/
│
├── .github/
│   └── workflows/
│       └── devsecops.yml
│
├── docs/
│   ├── architecture/
│   └── vul_ss/
│
├── NodeGoat/
│   ├── app/
│   ├── artifacts/
│   ├── config/
│   ├── test/
│   │
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .dockerignore
│   ├── package.json
│   └── server.js
│
├── .semgrep.yml
├── .gitleaksignore
├── .gitignore
│
└── README.md
```

---

# 🐳 Docker Implementation

The NodeGoat application was containerized using a multi-stage Docker build.

## Docker Security Improvements

The Docker configuration includes:

- Multi-stage build
- Reduced runtime image
- Production dependencies only
- Non-root `node` user
- Dedicated Docker network
- MongoDB not exposed to the host
- `no-new-privileges` security option
- Persistent MongoDB volume
- `.dockerignore` to reduce build context

Example:

```dockerfile
FROM node:12-alpine AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production


FROM node:12-alpine

WORKDIR /home/node/app

COPY --from=dependencies /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

EXPOSE 4000

USER node

CMD ["npm", "start"]
```

> Node.js 12 is used because this project is based on the legacy OWASP NodeGoat application. A production deployment should migrate to a currently supported Node.js version.

---

# 🐳 Docker Compose

The project uses Docker Compose to run:

```text
nodegoat-web
nodegoat-mongo
```

The containers communicate through:

```text
backend-net
```

The application uses:

```text
MONGODB_URI=mongodb://mongo:27017/nodegoat
```

because `mongo` is the MongoDB service name inside Docker Compose.

---

# 🚀 Running the Project

## 1. Clone the Repository

```bash
git clone https://github.com/Dineth-ng/DevSecOps-NodeGoat.git
```

Enter the project:

```bash
cd DevSecOps-NodeGoat/NodeGoat
```

---

## 2. Build Docker Images

```bash
docker compose build
```

To perform a clean build:

```bash
docker compose build --no-cache
```

---

## 3. Start Containers

```bash
docker compose up -d
```

---

## 4. Check Containers

```bash
docker compose ps
```

Expected services:

```text
nodegoat-web
nodegoat-mongo
```

MongoDB should show:

```text
27017/tcp
```

instead of:

```text
0.0.0.0:27017
```

because the database is not publicly exposed.

---

## 5. Open NodeGoat

Open:

```text
http://localhost:4000
```

---

## 6. View Logs

```bash
docker compose logs web
```

Or:

```bash
docker compose logs -f web
```

---

## 7. Stop the Application

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```

---

# 🔐 Verify Non-Root Container

The web container runs using the Node.js `node` user instead of root.

Check with:

```bash
docker compose exec web whoami
```

Expected result:

```text
node
```

This reduces the impact of container compromise.

---

# 🌐 Verify Docker Network

List Docker networks:

```bash
docker network ls
```

Inspect the project network:

```bash
docker network inspect nodegoat_backend-net
```

Both containers should be connected to the same backend network.

---

# 🔄 DevSecOps CI/CD Pipeline

GitHub Actions automatically performs security checks when code is pushed or submitted through a Pull Request.

Pipeline:

```text
              Source Code
                   |
                   v
        +----------------------+
        | Application Testing  |
        +----------+-----------+
                   |
       +-----------+-----------+
       |           |           |
       v           v           v
   Semgrep     Gitleaks    npm audit
    SAST       Secrets     Dependencies
       |           |           |
       +-----------+-----------+
                   |
                   v
             Docker Build
                   |
                   v
             Trivy Scan
                   |
                   v
              CI Result
```

<img width="2720" height="920" alt="github_actions_pipeline" src="https://github.com/user-attachments/assets/ac1dd7f8-b8ff-4858-a741-452dbb94b43b" />


---

# ✅ Pipeline Security Checks

The CI/CD workflow currently includes:

### 1. Application Unit Tests

Tests existing application functionality before later security stages continue.

---

### 2. Semgrep SAST

Semgrep performs Static Application Security Testing.

It checks JavaScript source code for dangerous patterns such as:

```javascript
eval(...)
```

Example local scan:

```bash
docker run --rm \
  -v "$PWD:/src" \
  -w /src \
  semgrep/semgrep:latest \
  semgrep scan \
  --config .semgrep.yml \
  --metrics off \
  NodeGoat/app NodeGoat/config NodeGoat/server.js
```

Successful result:

```text
Scan completed successfully.
Findings: 0
```

---

### 3. Gitleaks Secret Scanning

Gitleaks scans Git history for accidentally committed:

- API keys
- Passwords
- Tokens
- Private keys
- Credentials

Example:

```bash
docker run --rm \
  -v "$PWD:/repo" \
  -w /repo \
  zricethezav/gitleaks:latest \
  git /repo \
  --gitleaks-ignore-path /repo/.gitleaksignore \
  --redact \
  --exit-code 1
```

The project uses `.gitleaksignore` only for reviewed and approved false-positive fingerprints.

---

### 4. npm Audit

`npm audit` checks Node.js dependencies for known vulnerabilities.

```bash
npm audit
```

This is useful for identifying vulnerable third-party packages.

---

### 5. Docker Build

The pipeline builds the hardened NodeGoat Docker image after previous checks have completed.

---

### 6. Trivy Container Scan

Trivy scans the built Docker image for known vulnerabilities.

The project focuses on:

```text
HIGH
CRITICAL
```

severity vulnerabilities.

Example local scan:

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest \
  image \
  --severity HIGH,CRITICAL \
  nodegoat-web:latest
```

Trivy results can also be stored as GitHub Actions artifacts.

---

# 🛡 Security Pipeline Result

The final pipeline contains the following security stages:

```text
Application Unit Tests       ✅
Semgrep SAST                 ✅
Gitleaks Secret Scan         ✅
npm Audit                    ✅
Docker Build                 ✅
Trivy Container Scan         ✅
```

A security failure can prevent later pipeline stages from continuing.

---

# 🔍 Vulnerability Testing

The project also contains practical OWASP NodeGoat vulnerability testing.

Each vulnerability follows this process:

```text
Identify vulnerability
        ↓
Understand vulnerable code
        ↓
Exploit vulnerability
        ↓
Collect evidence
        ↓
Implement secure fix
        ↓
Retest
        ↓
Document results
```

Evidence is stored under:

```text
docs/vul_ss/
```

and:

```text
evidence/
```

---

# 👥 Team

Responsibilities:

- DevOps implementation
- Docker containerization
- Dockerfile hardening
- Docker Compose configuration
- Dedicated backend Docker network
- Non-root container execution
- Architecture design
- Trust-boundary design
- Trivy container vulnerability scanning
- JavaScript Injection vulnerability testing and remediation
- CI/CD integration support

The project report assigns Member 1 responsibility for containerization, architecture, Trivy integration, and JavaScript injection retesting. 

---

## Other Team Responsibilities

Other team members contributed to:

- NoSQL Injection testing and remediation
- Access Control vulnerability testing
- Unvalidated Redirect vulnerability remediation
- Security pipeline integration
- Evidence collection
- Documentation

---

# 🌿 Git Branching Strategy

The project uses a feature-branch workflow.

```text
feature branches
      |
      v
     Dev
      |
      v
     main
```

Example:

```text
feature/IT24101066-jsI
        |
        v
       Dev
        |
        v
       main
```

Developers work on separate branches and create Pull Requests into `Dev`.

After integration testing and CI/CD security checks pass, `Dev` is merged into `main`.

---

# 🔀 Example Git Workflow

Create or switch to a feature branch:

```bash
git checkout feature/IT24101066-jsI
```

Add changes:

```bash
git add .
```

Commit:

```bash
git commit -m "feat: harden NodeGoat Docker deployment"
```

Push:

```bash
git push origin feature/IT24101066-jsI
```

Then create a Pull Request:

```text
feature branch → Dev
```

After testing:

```text
Dev → main
```

---

# 🔑 Secret Management

Sensitive values should not be hardcoded directly into source code.

Environment variables should be used for secrets such as:

```text
ZAP_API_KEY
COOKIE_SECRET
CRYPTO_KEY
```

Example:

```javascript
process.env.ZAP_API_KEY
```

Sensitive `.env` files must not be committed to Git.

Example `.gitignore`:

```gitignore
.env
.env.*
```

Generated security reports are also excluded:

```gitignore
reports/
gitleaks-local.json
```

---

# 🧪 Troubleshooting

## Web container stops immediately

Check:

```bash
docker compose ps -a
```

Then:

```bash
docker compose logs web
```

---

## Check JavaScript syntax

```bash
node --check config/env/development.js
```

---

## MongoDB Connection

The application should use:

```text
mongodb://mongo:27017/nodegoat
```

Not:

```text
mongodb://localhost:27017/nodegoat
```

Inside the web container, `localhost` refers to the web container itself.

Docker Compose uses the service name `mongo` as an internal DNS hostname.

---

## Trivy command not found

Trivy does not need to be installed directly.

Run it using Docker:

```bash
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest \
  image \
  --severity HIGH,CRITICAL \
  nodegoat-web:latest
```

---

# 📊 Security Benefits

This implementation demonstrates several important DevSecOps principles:

- Shift-left security
- Automated security testing
- Secure container configuration
- Least privilege
- Secret detection
- Dependency vulnerability detection
- Static code analysis
- Container vulnerability scanning
- Secure Git workflow
- Repeatable builds
- Security evidence collection

---

# ⚠️ Important Note

OWASP NodeGoat is intentionally vulnerable and uses legacy dependencies.

This project is designed for:

- Education
- Cybersecurity laboratories
- DevSecOps demonstrations
- Vulnerability testing

It should **not** be exposed directly to the public internet or used as a production application.

---

# 📚 References

- OWASP NodeGoat
- OWASP Top 10
- Docker Documentation
- GitHub Actions Documentation
- Semgrep Documentation
- Gitleaks Documentation
- Aqua Security Trivy Documentation

---

# 🎓 Module

**IE3142 – DevOps Security**

Cyber Security Degree Project

Sri Lanka Institute of Information Technology – SLIIT

---


Cyber Security Undergraduate

---

## ⭐ Final DevSecOps Workflow

```text
Developer
    |
    v
Feature Branch
    |
    v
Pull Request
    |
    v
+--------------------------+
| GitHub Actions           |
+--------------------------+
| Unit Tests               |
| Semgrep SAST             |
| Gitleaks                 |
| npm Audit                |
| Docker Build             |
| Trivy Scan               |
+--------------------------+
    |
    v
Dev Branch
    |
    v
Final Validation
    |
    v
Main Branch
```

---

> This project demonstrates how automated security controls can be integrated into a software development workflow to detect vulnerabilities earlier and improve application and container security.
