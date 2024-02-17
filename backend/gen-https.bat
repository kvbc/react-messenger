openssl genrsa -out localhost-key.pem 2048
openssl req -new -x509 -sha256 -key localhost-key.pem -out localhost.pem -days 365