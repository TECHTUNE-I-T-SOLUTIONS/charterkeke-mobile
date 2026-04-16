# Ride Review & Rating Implementation Guide

## Overview

This guide covers the complete implementation of the ride review and rating feature, including:
- Rider rating UI on the `rating.tsx` page
- Backend API endpoint for submitting reviews
- Supabase trigger to automatically calculate driver average ratings

---

## 📱 Frontend (Mobile App)

### 1. **Rider Rating Screen** (`d:\Codes\ck\app\rider\rating.tsx`) ✅

**What was updated:**
- Fetches actual ride and driver data from the API on page load
- Displays driver info including current average rating
- Star rating selector (1-5 stars)
- Quality tags/categories (Clean, Safe, Friendly, Professional, Quiet, Good Music)
- Optional review text field
- Submits review data to backend API

**Key Features:**
- Loading state while fetching ride/driver data
- Error handling with fallback to home screen
- Submit button shows loading state
- Responsive design using react-native-size-matters
- Toast alert on successful submission

**Flow:**
```
User completes ride
    ↓
Navigate to /rider/rating?rideId=<ride-id>
    ↓
Component fetches ride and driver details
    ↓
Render UI with driver info and rating form
    ↓
User rates (1-5 stars) + selects tags + writes optional comment
    ↓
Submit review to /api/ride-reviews endpoint
    ↓
Success alert → Navigate back to rider home
```

---

## 🔌 API Service (`d:\Codes\ck\services\api.ts`) ✅

**New Methods Added:**

### `getRideDetails(rideId: string): Promise<any>`
```typescript
// Fetches ride information including fare, driver_id, etc.
const ride = await apiService.getRideDetails(rideId);
// Returns: { id, driver_id, rider_id, fare_amount, status, ... }
```

### `submitRideReview(reviewData): Promise<{ success: boolean; ... }>`
```typescript
// Submits review to backend
const result = await apiService.submitRideReview({
  ride_id: string,
  reviewer_id: string,        // current user ID
  rated_user_id: string,      // driver's user_id
  rating: number,             // 1-5
  review_text: string,        // optional comment
  categories: { tags: [...] } // selected tags
});
// Returns: { success: true, data: review }
```

---

## 🗄️ Backend API (`d:\Codes\easely\app\api\ride-reviews\route.ts`) ✅

### Endpoint: `POST /api/ride-reviews`

**Request Body:**
```json
{
  "ride_id": "uuid",
  "reviewer_id": "uuid",      // current user
  "rated_user_id": "uuid",    // driver's user_id
  "rating": 5,
  "review_text": "Great driver!",
  "categories": {
    "tags": ["friendly", "safe"]
  }
}
```

**Validations:**
- user is authenticated
- reviewer_id matches current user
- ride_id, reviewer_id, rated_user_id, rating are required
- rating is between 1-5
- review doesn't already exist for this ride

**Response on Success:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "id": "uuid",
    "ride_id": "uuid",
    "rating": 5,
    ...
  }
}
```

### Endpoint: `GET /api/ride-reviews`

**Query Parameters:**
- `ride_id` - Get reviews for a specific ride
- `user_id` - Get reviews for a specific driver (rated_user_id)
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Example:**
```
GET /api/ride-reviews?user_id=<driver-user-id>&limit=10
```

---

## 🗄️ Database Trigger (`d:\Codes\easely\trigger_update_driver_rating.sql`) ✅

### What It Does

Automatically updates the driver's `average_rating` in the `drivers` table whenever:
1. A new review is inserted into `ride_reviews`
2. An existing review's rating is updated

### Components

**Function: `update_driver_average_rating()`**
- Triggered after INSERT or UPDATE on `ride_reviews`
- Calculates `AVG(rating)` for all reviews with `rated_user_id = driver.user_id`
- Updates `drivers.average_rating` with the calculated average
- Updates `drivers.updated_at` timestamp

**Trigger 1: `trg_update_driver_avg_rating_on_review_insert`**
- Fires AFTER INSERT on `ride_reviews`
- Executes function for every new review

**Trigger 2: `trg_update_driver_avg_rating_on_review_update`**
- Fires AFTER UPDATE on `ride_reviews`
- Only executes if the `rating` field was changed

### Implementation Steps

**Step 1: Run the SQL trigger in Supabase**
```bash
# Copy the contents of:
# d:\Codes\easely\trigger_update_driver_rating.sql

# Go to Supabase Dashboard
#   → SQL Editor
#   → Create a new query
#   → Paste the entire SQL content
#   → Click "Run"
```

**Step 2: Verify the trigger**
```sql
-- Check if triggers were created
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_update_driver_avg%';

-- Should return 2 rows:
-- - trg_update_driver_avg_rating_on_review_insert
-- - trg_update_driver_avg_rating_on_review_update
```

**Step 3: Test the trigger**
```sql
-- Check current driver ratings
SELECT id, user_id, average_rating, updated_at 
FROM drivers 
ORDER BY updated_at DESC 
LIMIT 5;

-- Get recent reviews
SELECT 
  rr.id, rr.ride_id, rr.rating, rr.created_at,
  d.user_id, d.average_rating
FROM ride_reviews rr
LEFT JOIN drivers d ON rr.rated_user_id = d.user_id
ORDER BY rr.created_at DESC
LIMIT 5;
```

---

## 📊 Database Schema Reference

### `ride_reviews` Table
```sql
CREATE TABLE public.ride_reviews (
  id uuid PRIMARY KEY,
  ride_id uuid NOT NULL (UNIQUE),
  reviewer_id uuid NOT NULL,      -- Who gave the review (rider)
  rated_user_id uuid NOT NULL,    -- Who is being reviewed (driver's user_id)
  rating integer (1-5),           -- The star rating
  review_text text,               -- Optional comment
  categories jsonb,               -- { "tags": [...] }
  created_at timestamp,
  updated_at timestamp,
  
  CONSTRAINT ride_reviews_ride_id_fkey FOREIGN KEY (ride_id)
    REFERENCES public.rides(id),
  CONSTRAINT ride_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id)
    REFERENCES public.users(id),
  CONSTRAINT ride_reviews_rated_user_fkey FOREIGN KEY (rated_user_id)
    REFERENCES public.users(id)
);
```

### `drivers` Table (relevant columns)
```sql
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL (UNIQUE),
  
  -- Rating fields
  average_rating numeric DEFAULT 0.00,  -- AUTO-UPDATED BY TRIGGER
  
  -- Other fields...
  updated_at timestamp DEFAULT now()
);
```

### `rides` Table (relevant columns)
```sql
CREATE TABLE public.rides (
  id uuid PRIMARY KEY,
  rider_id uuid NOT NULL,
  driver_id uuid NOT NULL,  -- References drivers.id
  fare_amount numeric,
  status character varying,
  
  CONSTRAINT rides_driver_id_fkey FOREIGN KEY (driver_id)
    REFERENCES public.drivers(id)
);
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ RIDE COMPLETE                                               │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Navigate to: /rider/rating?rideId=<ride-id>               │
│ (rating.tsx)                                                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend Loads:                                             │
│ - GET /rides/{rideId} → Ride data                          │
│ - GET /drivers → Driver info                               │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Rider interacts with UI:                                    │
│ - Select 1-5 stars                                         │
│ - Select tags (Clean, Safe, etc.)                          │
│ - Write optional comment                                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ POST /api/ride-reviews                                      │
│ Request body:                                              │
│ {                                                          │
│   ride_id: "...",                                         │
│   reviewer_id: "...",  (current user)                     │
│   rated_user_id: "...", (driver.user_id)                  │
│   rating: 5,                                               │
│   review_text: "...",                                      │
│   categories: { tags: [...] }                              │
│ }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend API (/api/ride-reviews/route.ts):                  │
│ - Validate request                                         │
│ - Check for duplicate review                               │
│ - INSERT into ride_reviews table                           │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ DATABASE TRIGGER FIRES:                                     │
│ (trg_update_driver_avg_rating_on_review_insert)            │
│                                                             │
│ 1. Query: SELECT AVG(rating)                               │
│    FROM ride_reviews                                        │
│    WHERE rated_user_id = NEW.rated_user_id                │
│                                                             │
│ 2. UPDATE drivers.average_rating = calculated_avg          │
│    WHERE user_id = NEW.rated_user_id                       │
│                                                             │
│ 3. UPDATE drivers.updated_at = now()                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend:                                                   │
│ - Show success message                                     │
│ - Navigate to /rider/home                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Testing Checklist

### Frontend Testing
- [ ] Navigate to rating page with valid rideId
- [ ] Verify driver info loads correctly
- [ ] Verify current rating displays
- [ ] Select star rating (1-5)
- [ ] Toggle quality tags
- [ ] Type review comment
- [ ] Submit review
- [ ] Success message appears
- [ ] Redirects to rider home
- [ ] Test with invalid rideId (error handling)

### Backend Testing
- [ ] Test POST /api/ride-reviews with valid data
- [ ] Test duplicate review prevention
- [ ] Test rating validation (1-5)
- [ ] Test missing fields validation
- [ ] Test unauthorized access (no token)
- [ ] Test wrong reviewer_id (should be current user)
- [ ] Test GET /api/ride-reviews with filters

### Database Testing
- [ ] Run trigger SQL successfully
- [ ] Submit a review and verify ride_reviews table
- [ ] Verify drivers.average_rating was updated
- [ ] Submit multiple reviews for same driver
- [ ] Verify average_rating recalculated correctly
- [ ] Test update trigger (modify existing review rating)

### Example SQL Test
```sql
-- 1. Check initial driver rating
SELECT id, average_rating 
FROM drivers 
WHERE id = '<driver-id>' 
LIMIT 1;

-- 2. Insert test review
INSERT INTO ride_reviews (
  ride_id, reviewer_id, rated_user_id, rating, review_text
) VALUES (
  '<ride-id>', 
  '<rider-user-id>', 
  '<driver-user-id>', 
  5, 
  'Test review'
);

-- 3. Check updated driver rating (should recalculate)
SELECT id, average_rating 
FROM drivers 
WHERE user_id = '<driver-user-id>' 
LIMIT 1;
```

---

## 🐛 Troubleshooting

### Review doesn't submit
**Issue:** POST /api/ride-reviews returns 409 (conflict)
**Solution:** A review for that ride already exists. Check if rider previously submitted.

### Driver rating doesn't update
**Issue:** Trigger doesn't fire
**Solution:**
- Verify trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'trg_update%'`
- Check if review was actually inserted into `ride_reviews`
- Check Supabase logs for trigger execution errors
- Manually re-run the trigger SQL and test again

### Wrong average rating displayed
**Issue:** Average seems incorrect
**Solution:**
- Check all reviews for that driver: `SELECT rating FROM ride_reviews WHERE rated_user_id = '<user-id>'`
- Manually calculate average
- Run trigger manually: `SELECT update_driver_average_rating()`
- Check for NULL ratings (they're excluded from average)

### API returns "Missing required fields"
**Issue:** Fields not being sent
**Solution:**
- Verify `ride_id`, `reviewer_id`, `rated_user_id` are all UUIDs
- Verify `rating` is a number
- Check front-end code sends correct data structure

---

## 📝 Files Modified/Created

| File | Purpose |
|------|---------|
| `d:\Codes\ck\app\rider\rating.tsx` | Rating UI page with real data fetching |
| `d:\Codes\ck\services\api.ts` | Added `getRideDetails()` and `submitRideReview()` methods |
| `d:\Codes\easely\app\api\ride-reviews\route.ts` | Backend endpoint for submitting/fetching reviews |
| `d:\Codes\easely\trigger_update_driver_rating.sql` | Database trigger for auto-updating driver average rating |

---

## 🚀 Deployment Checklist

1. **Frontend:**
   - [ ] Deploy updated `rating.tsx` to mobile app
   - [ ] Deploy updated `api.ts` service
   - [ ] Test rating submission on actual device

2. **Backend:**
   - [ ] Deploy `/api/ride-reviews/route.ts` endpoint
   - [ ] Test endpoint with curl/Postman

3. **Database:**
   - [ ] Run SQL trigger in Supabase via SQL Editor
   - [ ] Verify triggers created successfully
   - [ ] Test with sample review

4. **Long-term:**
   - [ ] Monitor trigger performance
   - [ ] Consider caching driver ratings in Redis if needed
   - [ ] Track review metrics in analytics

---

## 📚 Related Tables & Data Flow

**Data Dependencies:**
- `ride_reviews.ride_id` → `rides.id`
- `ride_reviews.reviewer_id` → `users.id`
- `ride_reviews.rated_user_id` → `users.id` (driver's user)
- `rides.driver_id` → `drivers.id`
- `drivers.user_id` → `users.id`

**Average Rating Calculation:**
```
AVG(ride_reviews.rating) WHERE rated_user_id = drivers.user_id
= drivers.average_rating (updated by trigger)
```

---

## Additional Notes

- **Rating is never deleted:** Once submitted, reviews are permanent (for audit trail)
- **Update allowed:** Riders can technically edit their review (rating field can be updated, which also triggers the recalculation)
- **Null ratings excluded:** The trigger uses `WHERE rating IS NOT NULL` to ensure only valid ratings are averaged
- **Performance:** Recalculating from scratch each time is fine for < 10K reviews per driver
- **Future optimization:** Consider aggregate tables if needed for very-high-volume data
