# Postman API Testing Guide

Import these files into [Postman](https://www.postman.com/downloads/) to test all API endpoints.

## Files

| File | Purpose |
|------|---------|
| `Virtual-Event-Management.postman_collection.json` | All API requests organized in folders |
| `Virtual-Event-Management.postman_environment.json` | Local environment variables |

## Import Steps

1. Open Postman
2. Click **Import** (top left)
3. Drag both JSON files or click **Upload Files**
4. Select environment **Virtual Event Management - Local** (top-right dropdown)

## Recommended Test Order

Run requests in this order for a full end-to-end flow:

```
1.  Health Check
2.  Register Organizer
3.  Register Attendee
4.  Login Organizer          → saves accessToken, refreshToken
5.  Create Event (Organizer) → saves eventId
6.  List All Events
7.  Get Event by ID
8.  Login Attendee           → saves attendee tokens
9.  Register for Event
10. Get My Registrations
11. Update Event             → switch back to organizer token (Login Organizer)
12. Refresh Token
13. Cancel Registration      → Login Attendee first
14. Logout
```

## Auto-saved Variables

These are set automatically by test scripts — no manual copy/paste needed:

| Variable | Set by |
|----------|--------|
| `accessToken` | Login Organizer, Login Attendee, Refresh Token |
| `refreshToken` | Login Organizer, Login Attendee, Refresh Token |
| `eventId` | Create Event |

## Collection Folders

| Folder | Endpoints |
|--------|-----------|
| **Health** | `GET /health` |
| **Authentication** | register, login, refresh, logout |
| **Events** | list, get, create, update, delete |
| **Participants** | register for event, my registrations, cancel |
| **Error Cases** | wrong password, forbidden, no token, duplicate email, not found |

## Tips

- Start the server before testing: `npm run dev`
- If you get `401`, run the appropriate **Login** request again
- If `eventId` is wrong, run **Create Event** again
- Use **Error Cases** folder to verify error responses
