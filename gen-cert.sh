#!/bin/bash

# set values for certificate DNs
# note: CN is set to different values in the sections below
ORG="000_Test_Certificates"

# set values that the commands will share
VALID_DAYS=360
CA_KEY=ca.key
CA_CERT=ca.crt
CLIENT_KEY=client.key
CLIENT_CERT=client.crt
CLIENT_CSR=client.csr
CLIENT_P12=client.p12
SERVER_KEY=server.key
SERVER_CERT=server.crt
SERVER_CSR=server.csr
KEY_BITS=2048

echo
echo "Create CA certificate..."
CN="Test CA"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits: -out 
openssl req -new -x509 -days  -key  -subj "/CN=/O=" -out 
echo "Done."

echo
echo "Creating Server certificate..."
CN="localhost"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits: -out 
openssl req -new -key  -subj "/CN=/O=" -out 
openssl x509 -days  -req -in  -CAcreateserial -CA  -CAkey  -out 
echo "Done."

echo
echo "Creating Client certificate..."
CN="Test User 1"
USER_ID="testuser1"
P12_PASSWORD=
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits: -out 
openssl req -new -key  -subj "/CN=/O=/UID=" -out 
openssl x509 -days  -req -in  -CAcreateserial -CA  -CAkey  -out 
openssl pkcs12 -in  -inkey  -export -password pass: -out 
echo "Done."

echo
echo "----- Don't forget to open your browser and install your  and  certificates -----"
echo
