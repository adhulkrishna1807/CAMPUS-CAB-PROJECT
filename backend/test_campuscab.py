import os
import sys
import asyncio
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import httpx
from app.main import app
from app.database import engine, Base, AsyncSessionLocal
from app.seeds import seed_database
from app.models import User, FareRoute, RideRequest, Rental, LaundryOrder

BASE_URL = "http://testserver"

@pytest.mark.asyncio
async def test_campuscab_full_flow():
    # 1. Initialize schema and seed database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        await seed_database(session)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # 2. Test Demo Login
        # Student Demo
        r = await client.post("/api/auth/demo-login", json={"role": "USER"})
        assert r.status_code == 200, r.text
        student_data = r.json()
        student_token = student_data["access_token"]
        assert student_data["user"]["role"] == "USER"
        assert student_data["user"]["email"] == "student@campuscab.demo"

        # Rider Demo
        r = await client.post("/api/auth/demo-login", json={"role": "RIDER"})
        assert r.status_code == 200, r.text
        rider_data = r.json()
        rider_token = rider_data["access_token"]
        assert rider_data["user"]["role"] == "RIDER"
        assert rider_data["user"]["email"] == "rider@campuscab.demo"

        # Admin Demo
        r = await client.post("/api/auth/demo-login", json={"role": "ADMIN"})
        assert r.status_code == 200, r.text
        admin_data = r.json()
        admin_token = admin_data["access_token"]
        assert admin_data["user"]["role"] == "ADMIN"
        assert admin_data["user"]["email"] == "admin@campuscab.demo"

        # 3. Test Role Security Enforcement (Student cannot access admin routes)
        student_headers = {"Authorization": f"Bearer {student_token}"}
        r = await client.get("/api/admin/analytics", headers=student_headers)
        assert r.status_code == 403, "Student should NOT be able to access admin analytics"

        r = await client.get("/api/rides/active", headers=student_headers)
        assert r.status_code == 403, "Student should NOT be able to access rider-only active endpoint"

        # 4. Critical Fare Calculation Tests (as specified in requirement 133)
        # Boys Hostel -> Gate 2 -> 1 passenger = ₹30
        r = await client.post("/api/fares/calculate", json={
            "from_location": "Boys Hostel",
            "to_location": "Gate 2",
            "passengers": 1
        })
        assert r.status_code == 200
        assert r.json()["fare"] == 30.0
        assert r.json()["is_available"] is True

        # Boys Hostel -> Gate 2 -> 2 passengers = ₹40
        r = await client.post("/api/fares/calculate", json={
            "from_location": "Boys Hostel",
            "to_location": "Gate 2",
            "passengers": 2
        })
        assert r.status_code == 200
        assert r.json()["fare"] == 40.0

        # University -> Bus Stand / JIPMER / Railway -> 1 passenger = ₹170
        r = await client.post("/api/fares/calculate", json={
            "from_location": "University",
            "to_location": "Bus Stand / JIPMER / Railway",
            "passengers": 1
        })
        assert r.status_code == 200
        assert r.json()["fare"] == 170.0

        # University -> Bus Stand / JIPMER / Railway -> 2 passengers = ₹230
        r = await client.post("/api/fares/calculate", json={
            "from_location": "University",
            "to_location": "Bus Stand / JIPMER / Railway",
            "passengers": 2
        })
        assert r.status_code == 200
        assert r.json()["fare"] == 230.0

        # Unsupported route -> is_available = False
        r = await client.post("/api/fares/calculate", json={
            "from_location": "Nowhere",
            "to_location": "Outer Space",
            "passengers": 1
        })
        assert r.status_code == 200
        assert r.json()["is_available"] is False
        assert r.json()["fare"] == 0.0

        # 5. Book a Ride as Student
        r = await client.post("/api/rides", json={
            "pickup": "Boys Hostel",
            "drop": "Gate 2",
            "passengers": 1,
            "preferred_time": "10:30 AM"
        }, headers=student_headers)
        assert r.status_code == 200, r.text
        ride_created = r.json()
        assert ride_created["fare"] == 30.0
        assert ride_created["status"] == "PENDING"
        assert ride_created["booking_id"].startswith("CC-RIDE-")
        created_ride_id = ride_created["id"]

        # 6. Rider Acceptance Flow
        rider_headers = {"Authorization": f"Bearer {rider_token}"}
        # See pending rides
        r = await client.get("/api/rides/pending", headers=rider_headers)
        assert r.status_code == 200
        pending_rides = r.json()
        assert any(p["id"] == created_ride_id for p in pending_rides)

        # Rider accepts the ride
        r = await client.post(f"/api/rides/{created_ride_id}/accept", headers=rider_headers)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "ACCEPTED"

        # 7. Duplicate Acceptance Prevention (Concurrency Test)
        # Another rider attempts to accept same ride -> Must return 409 Conflict
        r = await client.post(f"/api/rides/{created_ride_id}/accept", headers=rider_headers)
        assert r.status_code == 409, "Second rider accept must return 409 Conflict"

        # Verify Student sees rider information
        r = await client.get("/api/rides/my", headers=student_headers)
        assert r.status_code == 200
        my_rides = r.json()
        matching_ride = next(m for m in my_rides if m["id"] == created_ride_id)
        assert matching_ride["status"] == "ACCEPTED"
        assert matching_ride["rider_name"] == "Vishnu"
        assert matching_ride["vehicle_number"] == "TN-DEMO-01"

        # 8. Laundry Flow
        # Day restriction test: Attempt booking on Tuesday -> Must fail
        r = await client.post("/api/laundry", json={
            "name": "Rahul Menon",
            "phone": "9876543210",
            "pickup_location": "Boys Hostel",
            "hostel": "Boys Hostel",
            "room_number": "B-204",
            "weight_kg": 2.0,
            "pickup_day": "Tuesday"
        }, headers=student_headers)
        assert r.status_code == 422, "Booking on Tuesday must be rejected"

        # Valid booking on Saturday: 2 kg = 2 * 65 + 25 = 155
        r = await client.post("/api/laundry", json={
            "name": "Rahul Menon",
            "phone": "9876543210",
            "pickup_location": "Boys Hostel",
            "hostel": "Boys Hostel",
            "room_number": "B-204",
            "weight_kg": 2.0,
            "pickup_day": "Saturday"
        }, headers=student_headers)
        assert r.status_code == 200, r.text
        laundry_created = r.json()
        assert laundry_created["total_amount"] == 155.0
        assert laundry_created["rate_per_kg"] == 65.0
        assert laundry_created["extra_charge"] == 25.0
        laundry_id = laundry_created["id"]

        # Admin manages laundry statuses
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        status_steps = ["PICKUP_SCHEDULED", "COLLECTED", "PROCESSING", "READY", "DELIVERED", "COMPLETED"]
        for st in status_steps:
            r = await client.patch(f"/api/laundry/{laundry_id}/status", json={"status": st}, headers=admin_headers)
            assert r.status_code == 200, f"Updating laundry to {st} failed"
            assert r.json()["status"] == st

        # 9. Rental Flow
        # Student books Scooty for 6 hours: Rental ₹270, Deposit ₹1000
        r = await client.post("/api/rentals", json={
            "vehicle_type": "Scooty",
            "duration_hours": 6,
            "pickup_location": "University",
            "preferred_pickup_time": "10:00 AM"
        }, headers=student_headers)
        assert r.status_code == 200, r.text
        rental_created = r.json()
        assert rental_created["rental_charge"] == 270.0
        assert rental_created["security_deposit"] == 1000.0
        rental_id = rental_created["id"]

        # Rider accepts rental
        r = await client.post(f"/api/rentals/{rental_id}/accept", headers=rider_headers)
        assert r.status_code == 200, r.text

        # Vehicle returned: Admin or Rider records return -> Refund = 1000 - 270 = ₹730
        r = await client.post(f"/api/rentals/{rental_id}/return", json={
            "actual_return_time": "04:00 PM",
            "actual_duration_hours": 6
        }, headers=admin_headers)
        assert r.status_code == 200, r.text
        ret_data = r.json()
        assert ret_data["security_deposit"] == 1000.0
        assert ret_data["rental_charge"] == 270.0
        assert ret_data["refund_amount"] == 730.0

        # 10. Check Notifications
        r = await client.get("/api/notifications", headers=student_headers)
        assert r.status_code == 200
        notifs = r.json()
        assert len(notifs) > 0

        # 11. Admin Analytics
        r = await client.get("/api/admin/analytics", headers=admin_headers)
        assert r.status_code == 200
        analytics = r.json()
        assert analytics["total_rides"] > 0
        assert analytics["total_revenue"] > 0
        print("ALL TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    asyncio.run(test_campuscab_full_flow())
