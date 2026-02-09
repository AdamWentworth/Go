# 🌐 NGINX Reverse Proxy Web Server — Pokémon Go Nexus

This configuration sets up **NGINX on Windows** to serve the production frontend and route backend traffic via reverse proxy to local services. It includes support for SSL, SSE, and service namespacing under `/api/`.

---

## 📁 Directory Structure

```
nginx/
├── .gitignore
├── nginx.conf           # Main configuration file
├── nginx.bat            # Script to start nginx
├── renew_ssl.txt        # Optional Certbot renewal notes
├── README.md
```

---

## ⚙️ Overview

### 📦 Frontend

- Served from: `A:/Visual-Studio-Code/Go/frontend/build`
- Access via: `https://pokemongonexus.com/`

### 🔁 Proxied APIs

All backend services are routed under `/api/` to local development ports:

| Service             | Proxy Path            | Local Target                  |
|---------------------|------------------------|-------------------------------|
| Pokémon API         | `/api/pokemon/`        | `http://localhost:3001/pokemon/` |
| Auth API            | `/api/auth/`           | `http://localhost:3002/auth/`    |
| Receiver API        | `/api/receiver/`       | `http://localhost:3003/api/`     |
| Users API           | `/api/users/`          | `http://localhost:3005/api/`     |
| Search API        | `/api/search/`       | `http://localhost:3006/api/`     |
| Location Service    | `/api/location/`       | `http://localhost:3007/`         |
| Events (SSE)        | `/api/events/`         | `http://localhost:3008/api/`     |

---

## 🔐 SSL Configuration

- Certbot-generated certificates:
  - `fullchain.pem`
  - `privkey.pem`
- Stored at:
  ```
  C:/Certbot/live/pokemongonexus.com/
  ```

> Uses **TLS 1.2/1.3** with secure ciphers.

---

## 🔄 HTTP/HTTPS Routing Logic

| From                           | To                                 |
|--------------------------------|-------------------------------------|
| `http://www.pokemongonexus.com` | `https://pokemongonexus.com`       |
| `http://pokemongonexus.com`    | `https://pokemongonexus.com`       |
| `https://www.pokemongonexus.com` | `https://pokemongonexus.com` (301) |

---

## 🔌 SSE Support (Server-Sent Events)

The `/api/events/` route includes special headers and proxy config to support live updates:

- `proxy_buffering off`
- `Connection: keep-alive`
- `X-Accel-Buffering: no`
- `chunked_transfer_encoding off`
- Extended timeouts (3600s)

---

## 🧪 Usage

### ✅ Start NGINX (Windows)

Use `nginx.bat start` or run from the NGINX directory:

```bash
start nginx
```

To reload:

```bash
nginx -s reload
```

To stop:

```bash
nginx -s stop
```

> Make sure NGINX is installed at:  
> `C:/Program Files/nginx/`

---

## 📄 Example `nginx.conf`

Stored in the root of this directory. Key highlights:

- Uses `proxy_set_header` to preserve client IPs and protocol
- Logs to:
  - `proxy_access.log`
  - `error.log`
- Serves static files and rewrites routes to `index.html` for React SPA

---

## 🧠 Notes

- You can use the `renew_ssl.txt` as a reminder for running Certbot renewals
- This setup assumes you're running **everything on localhost**
- The React build folder must be compiled before deployment

---

## 🔐 SSL Renewal

Use Certbot (e.g., with WSL) to renew your certificate:

```bash
sudo certbot renew
```

Then copy `fullchain.pem` and `privkey.pem` to:

```
C:/Certbot/live/pokemongonexus.com/
```

Restart nginx after renewal.

---

## 👨‍💻 Author Notes

This config was optimized for the Pokémon Go Nexus platform, enabling smooth local development and production deployment using NGINX as a central routing layer. It supports hot-swapping backend services and handles SSE without hitches.

