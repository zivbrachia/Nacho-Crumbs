var serviceAccount = {
  //"type": "service_account",
  //"project_id": "nacho-crumbs",
  //"private_key_id": process.env.DB_PRIVATE_KEY_ID,
  "private_key": process.env.DB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-zaumv@nacho-crumbs.iam.gserviceaccount.com",
  //"client_id": process.env.DB_CLIENT_ID,
  //"auth_uri": "https://accounts.google.com/o/oauth2/auth",
  //"token_uri": "https://accounts.google.com/o/oauth2/token",
  //"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  //"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-zaumv%40nacho-crumbs.iam.gserviceaccount.com"
};

exports.serviceAccount = serviceAccount;