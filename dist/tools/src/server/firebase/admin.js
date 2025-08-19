"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.adminAuth = void 0;
var env_server_1 = require("../../env-server");
var app_1 = require("firebase-admin/app");
var auth_1 = require("firebase-admin/auth");
var firestore_1 = require("firebase-admin/firestore");
var app;
if (!(0, app_1.getApps)().length) {
    if (env_server_1.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        var serviceAccount = JSON.parse(env_server_1.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        app = (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
            projectId: env_server_1.env.FIREBASE_PROJECT_ID,
        });
    }
    else {
        // Initialize with default credentials (useful on GCP/Firebase hosting)
        app = (0, app_1.initializeApp)({ projectId: env_server_1.env.FIREBASE_PROJECT_ID });
    }
}
exports.adminAuth = (0, auth_1.getAuth)();
exports.db = (0, firestore_1.getFirestore)();
