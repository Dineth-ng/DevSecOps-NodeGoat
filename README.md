# IE3142 DevOps Security - OWASP NodeGoat DevSecOps Project

## Project Overview

This project is developed for the **IE3142 DevOps Security** module.

The project uses **OWASP NodeGoat**, an intentionally vulnerable
Node.js web application, to demonstrate the integration of security
into the software development lifecycle.

The project covers:

- Application architecture analysis
- Docker containerisation
- Threat modelling using STRIDE
- Vulnerability identification
- Vulnerability exploitation in a controlled local environment
- Secure coding and remediation
- Static Application Security Testing (SAST)
- Software Composition Analysis (SCA)
- Secrets scanning
- Container vulnerability scanning
- CI/CD security automation

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Application runtime |
| Express.js | Web application framework |
| MongoDB | Database |
| Docker | Application containerisation |
| Docker Compose | Multi-container orchestration |
| GitHub Actions | CI/CD automation |
| Semgrep | Static Application Security Testing |
| npm audit | Dependency / SCA scanning |
| Gitleaks | Secrets scanning |
| Trivy | Container vulnerability scanning |
| Git / GitHub | Version control and collaboration |

---

# Project Architecture

The application consists primarily of a NodeGoat web application and
MongoDB database running as containers.

```text
                    User
                     |
                     | HTTP
                     v
             +----------------+
             |    NodeGoat    |
             | Node.js/Express|
             +--------+-------+
                      |
                      | Database Connection
                      v
             +----------------+
             |    MongoDB     |
             +----------------+
```

The detailed architecture and trust-boundary diagram is available in:

`docs/architecture/`

---

# Repository Structure

```text
DevSecOps-NodeGoat/
|
├── .github/
│   └── workflows/
│       └── devsecops.yml
|
├── docs/
│   ├── architecture/
│   └── vul_ss/
|
├── NodeGoat/
│   ├── app/
│   ├── artifacts/
│   ├── config/
│   ├── test/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
|
└── README.md
```

---

# Getting Started

## 1. Prerequisites

Install:

- Git
- Docker
- Docker Compose

Verify:

```bash
git --version
docker --version
docker compose version
```

---

## 2. Clone Repository

```bash
git clone https://github.com/Dineth-ng/DevSecOps-NodeGoat.git
cd DevSecOps-NodeGoat
```

---

## 3. Start NodeGoat

Move into the application directory:

```bash
cd NodeGoat
```

Build and start the containers:

```bash
docker compose up -d --build
```

Check container status:

```bash
docker compose ps
```

---

## 4. Access Application

Open:

`http://localhost:4000`

The NodeGoat application should now be available locally.

---

## 5. Stop Application

```bash
docker compose down
```

---

# Vulnerability Assessment

The project investigates multiple vulnerabilities in OWASP NodeGoat.

| ID | Vulnerability |
|---|---|
| T1 | Server-Side JavaScript Injection / Unsafe `eval()` |
| T2 | NoSQL `$where` Injection |
| T3 | Stored Cross-Site Scripting (XSS) |
| T4 | Broken Access Control / IDOR |
| T5 | Plaintext Password Storage & Hardcoded Secrets |

For selected vulnerabilities the following workflow is used:

```text
Identify Vulnerability
        |
        v
SAST Scan - BEFORE
        |
        v
Controlled Demonstration
        |
        v
Capture Evidence
        |
        v
Secure Coding Fix
        |
        v
Repeat Same Test
        |
        v
SAST Scan - AFTER
```

Evidence is stored under:

`docs/vul_ss/`

---

# DevSecOps CI/CD Pipeline

GitHub Actions is used to automate build and security testing.

```text
Push / Pull Request
        |
        v
Install Dependencies
        |
        v
Application Tests
        |
        v
Semgrep SAST
        |
        v
npm audit / SCA
        |
        v
Gitleaks
        |
        v
Docker Build
        |
        v
Trivy Container Scan
        |
        v
PASS / FAIL
```

Workflow configuration:

`.github/workflows/devsecops.yml`

---

## Security Gates

### Semgrep

Used for Static Application Security Testing (SAST).

### npm audit

Used to identify known vulnerabilities in Node.js dependencies.

### Gitleaks

Used to identify accidentally committed credentials, tokens and
other secrets.

### Trivy

Used to scan the Docker image for known operating-system and
application dependency vulnerabilities.

---

# Docker Security

The NodeGoat application is containerised using Docker.

Security hardening includes:

- Running the application with a non-root user where supported
- Reducing unnecessary container privileges
- Using `.dockerignore`
- Avoiding secrets inside Docker images
- Scanning the final image with Trivy
- Separating application and database services

---

# Branching Strategy

```text
main
  ^
  |
 Dev
  ^
  |
  +-- feature/member1-...
  +-- feature/member2-...
  +-- feature/member3-...
  +-- feature/member4-...
```

Team members develop changes on individual feature branches.

Pull Requests are created against the `Dev` branch.

The CI/CD security pipeline validates changes before they are merged.

---

# Team Responsibilities

| Member | Main Responsibility |
|---|---|
| Member 1 | DevOps, Docker, container hardening, Trivy and architecture |
| Member 2 | Injection vulnerabilities and threat modelling |
| Member 3 | XSS, authentication/access control and risk assessment |
| Member 4 | CI/CD, secrets management and security automation |

---

# Ethical Scope

All vulnerability testing is performed against the intentionally
vulnerable OWASP NodeGoat application in an authorised local
environment.

The techniques demonstrated in this project are for educational and
defensive security purposes.

---

# Authors

IE3142 DevOps Security Group Project

Sri Lanka Institute of Information Technology (SLIIT)