# Firestore Indexes

This document tracks Firestore indexes that need to be created for the application to function properly.

## Required Indexes

### 1. Audit Log Indexes

**Collection**: `audit`

**Composite Index 1**:
- Fields: `orgId` (Ascending), `timestamp` (Descending)
- Query: Get audit entries for a specific organization, ordered by timestamp

**Composite Index 2**:
- Fields: `actorUid` (Ascending), `timestamp` (Descending)
- Query: Get audit entries for a specific user, ordered by timestamp

**Composite Index 3**:
- Fields: `type` (Ascending), `timestamp` (Descending)
- Query: Get audit entries of a specific type, ordered by timestamp

### 2. Organization Invites Index

**Collection**: `orgs/{orgId}/invites`

**Composite Index**:
- Fields: `token` (Ascending), `status` (Ascending)
- Query: Find invite by token with status filter

### 3. Organization Members Index

**Collection**: `orgs/{orgId}/members`

**Composite Index**:
- Fields: `uid` (Ascending)
- Query: Find member by user ID

### 4. User Organizations Index

**Collection Group**: `members`

**Composite Index**:
- Fields: `uid` (Ascending)
- Query: Find all organizations a user belongs to

### 5. Usage Tracking Indexes

**Collection**: `usage/{day}/users`

**Composite Index**:
- Fields: `lastUpdated` (Descending)
- Query: Get recent usage records

**Collection**: `usage/{day}/orgs`

**Composite Index**:
- Fields: `lastUpdated` (Descending)
- Query: Get recent org usage records

### 6. Payments Index

**Collection**: `payments`

**Composite Index**:
- Fields: `uid` (Ascending), `createdAt` (Descending)
- Query: Get user's payment history

**Composite Index 2**:
- Fields: `orgId` (Ascending), `createdAt` (Descending)
- Query: Get organization's payment history

### 7. Users Index

**Collection**: `users`

**Composite Index**:
- Fields: `email` (Ascending)
- Query: Find user by email address

## How to Create Indexes

### Method 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database → Indexes
4. Click "Create Index"
5. Add the fields as specified above

### Method 2: Firebase CLI
```bash
# Deploy indexes from firestore.indexes.json
firebase deploy --only firestore:indexes
```

### Method 3: Auto-generated from Console Errors
When you run queries that require indexes, Firebase will show console errors with direct links to create the required indexes. Copy those URLs here:

## Index Creation URLs

*Add URLs from Firebase console errors here as they appear*

Example format:
```
https://console.firebase.google.com/project/your-project/firestore/indexes?create_composite=...
```

## Index Status

- [ ] Audit log indexes
- [ ] Organization invites index
- [ ] Organization members index
- [ ] User organizations index
- [ ] Usage tracking indexes
- [ ] Payments indexes
- [ ] Users index

## Notes

- Indexes can take several minutes to build for large collections
- Monitor index usage in the Firebase Console to optimize performance
- Consider removing unused indexes to save on costs
- Some indexes may be automatically created by Firestore for simple queries
