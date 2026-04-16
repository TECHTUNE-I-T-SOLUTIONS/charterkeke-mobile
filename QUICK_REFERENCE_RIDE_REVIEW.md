# Ride Review System: Quick Reference Card

## 🚀 DEPLOY IN 3 STEPS

### Step 1: Database Trigger
```bash
# File: d:\Codes\easely\trigger_update_driver_rating.sql
# Action: Copy entire file → Supabase SQL Editor → Run

# Verify it worked:
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_update_driver_avg%';
# ✅ Should return 2 rows
```

### Step 2: Deploy Backend
```bash
# File: d:\Codes\easely\app\api\ride-reviews\route.ts
# Already created at correct path
# Just commit & deploy (or test locally)

# Test locally:
npm run dev
# Then call: curl -X POST http://localhost:3000/api/ride-reviews
```

### Step 3: Rebuild Mobile App
```bash
cd d:\Codes\ck
eas build --platform android --local --clear-cache
# Or: npm start (for Expo Go testing)
```

---

## 📱 API ENDPOINTS

### POST /api/ride-reviews - Submit Review
```bash
POST /api/ride-reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "ride_id": "uuid",
  "reviewer_id": "uuid",        # Current user
  "rated_user_id": "uuid",      # Driver's user_id
  "rating": 5,                  # 1-5 stars
  "review_text": "Great!",      # Optional
  "categories": {
    "tags": ["clean", "safe"]   # Select from: clean, safe, friendly, professional, quiet, music
  }
}

Response (Success):
{
  "success": true,
  "message": "Review submitted successfully",
  "review": { id, rating, ... }
}

Status Codes:
200 ✅ Success
400 ❌ Missing fields or invalid rating
401 ❌ Not authenticated
409 ❌ Review already exists for this ride
500 ❌ Server error
```

### GET /api/ride-reviews - Fetch Reviews
```bash
GET /api/ride-reviews?user_id=<driver-user-id>&limit=20
Authorization: Bearer <token>

Query Parameters:
- user_id: Get reviews for a driver (filtered by rated_user_id)
- ride_id: Get reviews for a specific ride
- limit: Number of results (default: 20, max: 100)
- offset: Skip first N results (default: 0)

Response:
{
  "reviews": [
    {
      "id": "uuid",
      "ride_id": "uuid",
      "rating": 5,
      "review_text": "Great driver!",
      "created_at": "2026-04-15T10:30:00Z",
      ...
    }
  ],
  "count": 1
}
```

---

## 🗄️ DATABASE TABLES

### ride_reviews
```sql
-- View all reviews
SELECT id, ride_id, rating, review_text, categories, created_at 
FROM ride_reviews;

-- Reviews for a specific driver
SELECT * FROM ride_reviews 
WHERE rated_user_id = '<driver-user-id>'
ORDER BY created_at DESC;

-- Reviews for a specific ride
SELECT * FROM ride_reviews 
WHERE ride_id = '<ride-id>';

-- Average rating for a driver
SELECT AVG(rating) FROM ride_reviews 
WHERE rated_user_id = '<driver-user-id>';
```

### drivers (Updated by Trigger)
```sql
-- View all drivers with ratings
SELECT id, user_id, average_rating, updated_at 
FROM drivers 
ORDER BY average_rating DESC;

-- Check trigger worked
SELECT average_rating FROM drivers 
WHERE user_id = '<driver-user-id>';
# Should match AVG(rating) from ride_reviews
```

---

## 🧪 QUICK TEST COMMANDS

### Test 1: Submit Review (Curl)
```bash
curl -X POST http://localhost:3000/api/ride-reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ride_id": "550e8400-e29b-41d4-a716-446655440000",
    "reviewer_id": "550e8400-e29b-41d4-a716-446655440001",
    "rated_user_id": "550e8400-e29b-41d4-a716-446655440002",
    "rating": 5,
    "review_text": "Excellent driver!",
    "categories": {"tags": ["clean", "safe", "friendly"]}
  }'
```

### Test 2: Fetch Reviews (Curl)
```bash
curl -X GET "http://localhost:3000/api/ride-reviews?user_id=550e8400-e29b-41d4-a716-446655440002&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Check Driver Rating Updated (SQL)
```sql
-- Before submitting a review, note the average_rating
SELECT average_rating FROM drivers WHERE user_id = '<driver-user-id>';

-- Submit a review via API or frontend

-- Check it updated
SELECT average_rating FROM drivers WHERE user_id = '<driver-user-id>';
-- ✅ Should be different value
```

### Test 4: Check Trigger Fired (SQL)
```sql
-- See latest review
SELECT id, rating, created_at FROM ride_reviews ORDER BY created_at DESC LIMIT 1;

-- Check trigger updated corresponding driver
SELECT average_rating FROM drivers 
WHERE user_id = (SELECT rated_user_id FROM ride_reviews ORDER BY created_at DESC LIMIT 1);
```

---

## ⚡ ESSENTIAL SQL QUERIES

### View Trigger Status
```sql
SELECT trigger_schema, trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table = 'ride_reviews'
ORDER BY trigger_name;
```

### Force Recalculate All Driver Ratings
```sql
-- Run manually if needed (trigger should do this automatically)
SELECT update_driver_average_rating();
```

### Verify Review Data Integrity
```sql
-- Check for orphaned reviews (review for non-existent driver)
SELECT rr.* FROM ride_reviews rr
LEFT JOIN drivers d ON rr.rated_user_id = d.user_id
WHERE d.id IS NULL;
-- ✅ Should return 0 rows

-- Check for reviews without rides
SELECT rr.* FROM ride_reviews rr
LEFT JOIN rides r ON rr.ride_id = r.id
WHERE r.id IS NULL;
-- ✅ Should return 0 rows
```

### Get Rating Distribution for a Driver
```sql
SELECT 
  rating, 
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM ride_reviews
WHERE rated_user_id = '<driver-user-id>'
GROUP BY rating
ORDER BY rating DESC;

-- Shows: 5 stars: 8 reviews (80%), 4 stars: 2 reviews (20%), etc.
```

---

## 🔍 DEBUGGING CHECKLIST

### Trigger Not Firing?
```sql
-- 1. Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_update_driver_avg%';
-- ✅ Should return 2 rows

-- 2. Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'update_driver_average_rating';
-- ✅ Should return 1 row

-- 3. Check function correctly defined
SELECT pg_get_functiondef('update_driver_average_rating'::regprocedure);
-- ✅ Should show your function code

-- 4. Re-deploy trigger SQL if issues found
```

### Review Not Showing Up?
```sql
-- 1. Check if review exists
SELECT * FROM ride_reviews WHERE ride_id = '<ride-id>';
-- ✅ Should return your review

-- 2. Check ride exists
SELECT * FROM rides WHERE id = '<ride-id>';
-- ✅ Should return 1 row

-- 3. Check user_ids are valid UUIDs
SELECT * FROM users WHERE id = 'reviewer_user_id';
SELECT * FROM users WHERE id = 'rated_user_id';
-- ✅ Both should return rows
```

### Average Rating Wrong?
```sql
-- 1. Check all reviews for driver
SELECT rating FROM ride_reviews 
WHERE rated_user_id = '<driver-user-id>'
ORDER BY rating;

-- 2. Calculate average manually
SELECT AVG(rating) as calculated_avg FROM ride_reviews 
WHERE rated_user_id = '<driver-user-id>';

-- 3. Compare with drivers table
SELECT average_rating FROM drivers WHERE user_id = '<driver-user-id>';

-- ❌ If different, trigger may not have run
-- ✅ Re-run: SELECT update_driver_average_rating();
```

---

## 📋 VALIDATION ERROR CODES

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Missing fields or invalid rating | Check all required fields present |
| 401 | Not authenticated | Include valid Bearer token |
| 409 | Review already exists for this ride | Use different ride_id |
| 500 | Server error | Check Supabase logs, check trigger ran |

---

## 🎯 FEATURE FILES

| Path | Purpose |
|------|---------|
| `ck/app/rider/rating.tsx` | Frontend rating UI |
| `ck/services/api.ts` | API client methods |
| `easely/app/api/ride-reviews/route.ts` | Backend endpoint |
| `easely/trigger_update_driver_rating.sql` | Database trigger |

---

## 🔑 KEY CONCEPTS

**ride_reviews table:**
- Stores: id, ride_id, reviewer_id, rated_user_id, rating (1-5), review_text, categories
- Only 1 review per ride allowed (enforced by code)
- Linked to rides, users, and drivers

**drivers.average_rating:**
- Calculated as: `AVG(rating)` from all ride_reviews where `rated_user_id = drivers.user_id`
- Updated by trigger automatically
- Not manually edited (trigger overwrites it)

**Categories (Tags):**
- Stored as JSON: `{"tags": ["clean", "safe", "friendly", "professional", "quiet", "music"]}`
- Optional field
- Can select multiple tags

---

## 💡 TIPS & TRICKS

### Test Duplicate Prevention
```bash
# Submit same review twice
curl -X POST ... (first request) → ✅ 200 Success
curl -X POST ... (second request) → ❌ 409 Conflict
```

### Monitor Trigger Performance
```sql
-- Check when trigger last fired (by noting updated_at timestamps)
SELECT user_id, average_rating, updated_at 
FROM drivers 
ORDER BY updated_at DESC 
LIMIT 5;
-- updated_at should be very recent after submitting review
```

### Bulk Test Multiple Reviews
```sql
-- Insert 3 test reviews at once (for testing average calculation)
INSERT INTO ride_reviews (ride_id, reviewer_id, rated_user_id, rating, review_text)
VALUES
  ('ride-1', 'user-1', 'driver-1', 5, 'Great!'),
  ('ride-2', 'user-2', 'driver-1', 3, 'Okay'),
  ('ride-3', 'user-3', 'driver-1', 4, 'Good');

-- Then check: SELECT AVG(rating) FROM ride_reviews WHERE rated_user_id = 'driver-1';
-- Should be 4.00 (average of 5, 3, 4)
```

---

## 🚨 PRODUCTION CHECKLIST

Before going live:
- [ ] Trigger deployed to Supabase
- [ ] Backend API endpoint deployed
- [ ] Frontend code deployed
- [ ] Test full flow end-to-end
- [ ] Multiple review averaging works
- [ ] Duplicate prevention works
- [ ] Invalid rating rejected
- [ ] Unauthorized access rejected
- [ ] Error messages clear to users
- [ ] Loading states show during submission
- [ ] Success confirmation visible

---

## 📞 QUICK SUPPORT

**Trigger not firing?** → Re-run SQL file  
**API returns 409?** → Already reviewed that ride  
**Average rating wrong?** → Run `SELECT update_driver_average_rating();`  
**Frontend shows error?** → Check auth token validity  
**Review won't submit?** → Check required fields (ride_id, reviewer_id, rated_user_id, rating)

---

**Everything is ready to deploy! 🎉**
