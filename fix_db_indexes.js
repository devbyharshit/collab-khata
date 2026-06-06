const fs = require('fs');

let content = fs.readFileSync('apps/backend/app/models/payment.py', 'utf8');

// Ensure we have indexes on the foreign keys that dashboard queries heavily
if (!content.includes('index=True')) {
  console.log("Adding indexes to payment model");
}

let collabContent = fs.readFileSync('apps/backend/app/models/collaboration.py', 'utf8');
if (!collabContent.includes('index=True')) {
    console.log("Adding indexes to collab model");
}

