FROM ubuntu:26.04

ENV DEBIAN_FRONTEND=noninteractive \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  FREECAD_CMD=freecadcmd

WORKDIR /app

# Step 1: switch to HTTPS mirrors; disable TLS peer verification temporarily to bootstrap
# ca-certificates (base Ubuntu image has none), then re-enable and do the real install.
RUN sed -i \
  's|http://archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g; s|http://security.ubuntu.com/ubuntu|https://security.ubuntu.com/ubuntu|g' \
  /etc/apt/sources.list \
  && if [ -f /etc/apt/sources.list.d/ubuntu.sources ]; then \
  sed -i \
  's|http://archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g; s|http://security.ubuntu.com/ubuntu|https://security.ubuntu.com/ubuntu|g' \
  /etc/apt/sources.list.d/ubuntu.sources; \
  fi \
  && printf 'Acquire::https::Verify-Peer "false";\nAcquire::https::Verify-Host "false";\nAcquire::Retries "5";\n' \
  > /etc/apt/apt.conf.d/99-bootstrap-no-verify \
  && apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm /etc/apt/apt.conf.d/99-bootstrap-no-verify \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  freecad \
  python3 \
  python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "300", "api:app"]
