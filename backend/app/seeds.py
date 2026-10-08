import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import (
    User, Rider, Vehicle, FareRoute, RideRequest, Rental,
    LaundryOrder, Notification, AdminAction
)
from app.auth import hash_password

FARES_DATA = [
    # BOYS HOSTEL routes
    ("BOYS HOSTEL", "BANYAN TREE / AL BAYT", 40.0, 50.0),
    ("BOYS HOSTEL", "GATE 2", 30.0, 40.0),
    ("BOYS HOSTEL", "SCIENCE BLOCK", 25.0, 35.0),
    ("BOYS HOSTEL", "PONLAIT", 25.0, 35.0),
    ("BOYS HOSTEL", "GATE 1", 30.0, 40.0),
    ("BOYS HOSTEL", "GIRLS HOSTEL", 25.0, 35.0),
    ("BOYS HOSTEL", "SOM", 25.0, 35.0),
    ("BOYS HOSTEL", "SJ", 25.0, 35.0),

    # GIRLS HOSTEL routes
    ("GIRLS HOSTEL", "BANYAN TREE / AL BAYT", 40.0, 50.0),
    ("GIRLS HOSTEL", "GATE 2", 25.0, 35.0),
    ("GIRLS HOSTEL", "GATE 1", 25.0, 35.0),
    ("GIRLS HOSTEL", "SCIENCE BLOCK", 25.0, 35.0),
    ("GIRLS HOSTEL", "PONLAIT", 25.0, 35.0),
    ("GIRLS HOSTEL", "BOYS HOSTEL", 25.0, 35.0),
    ("GIRLS HOSTEL", "SOM", 25.0, 35.0),
    ("GIRLS HOSTEL", "SJ", 30.0, 40.0),

    # SJ routes
    ("SJ", "GATE 2", 35.0, 45.0),
    ("SJ", "GATE 1", 30.0, 40.0),
    ("SJ", "PONLAIT", 30.0, 40.0),
    ("SJ", "JAYA THEATRE / PILLAICHAVADY", 50.0, 60.0),

    # ANY GATE routes
    ("ANY GATE", "JAYA THEATRE / PILLAICHAVADY", 40.0, 50.0),

    # PILLAICHAVADY routes
    ("PILLAICHAVADY", "DEPARTMENT / HOSTEL (EXCEPT SJ)", 40.0, 50.0),

    # UNIVERSITY routes
    ("UNIVERSITY", "KOTTAKUPPAM", 100.0, 120.0),
    ("UNIVERSITY", "KUILAPALAYAM", 110.0, 130.0),
    ("UNIVERSITY", "PIMS", 80.0, 100.0),
    ("UNIVERSITY", "MC DONALD'S", 60.0, 80.0),
    ("UNIVERSITY", "BUS STAND / JIPMER / RAILWAY", 170.0, 230.0),
]

async def seed_database(db: AsyncSession):
    now = datetime.datetime.utcnow()

    # 1. Clear existing data in reverse dependency order
    tables = [
        AdminAction, Notification, LaundryOrder, Rental,
        RideRequest, Vehicle, Rider, FareRoute, User
    ]
    for table in tables:
        await db.execute(table.__table__.delete())
    await db.commit()

    # 2. Seed Fare Routes
    for origin, dest, single, double in FARES_DATA:
        fare_route = FareRoute(
            from_location=origin,
            to_location=dest,
            single_fare=single,
            double_fare=double,
            is_active=True
        )
        db.add(fare_route)
    await db.commit()

    # 3. Seed Users
    # Admin
    admin_user = User(
        name="Campus Admin",
        email="admin@campuscab.demo",
        phone="9876543200",
        password_hash=hash_password("Admin@123"),
        role="ADMIN",
        is_active=True,
        created_at=now - datetime.timedelta(days=30)
    )
    db.add(admin_user)

    # Demo Student
    demo_student = User(
        name="Rahul Menon",
        email="student@campuscab.demo",
        phone="9876543210",
        password_hash=hash_password("Campus@123"),
        role="USER",
        hostel="Boys Hostel",
        room_number="B-204",
        is_active=True,
        created_at=now - datetime.timedelta(days=20)
    )
    db.add(demo_student)

    # Other Students
    student2 = User(
        name="Priya Nair",
        email="priya@campuscab.demo",
        phone="9876543211",
        password_hash=hash_password("Campus@123"),
        role="USER",
        hostel="Girls Hostel",
        room_number="G-102",
        is_active=True,
        created_at=now - datetime.timedelta(days=15)
    )
    db.add(student2)

    student3 = User(
        name="Arjun Kumar",
        email="arjun@campuscab.demo",
        phone="9876543212",
        password_hash=hash_password("Campus@123"),
        role="USER",
        hostel="Boys Hostel",
        room_number="B-108",
        is_active=True,
        created_at=now - datetime.timedelta(days=10)
    )
    db.add(student3)

    student4 = User(
        name="Sanjay Raj",
        email="sanjay@campuscab.demo",
        phone="9876543213",
        password_hash=hash_password("Campus@123"),
        role="USER",
        hostel="Boys Hostel",
        room_number="B-310",
        is_active=True,
        created_at=now - datetime.timedelta(days=8)
    )
    db.add(student4)

    student5 = User(
        name="Meera Krishnan",
        email="meera@campuscab.demo",
        phone="9876543214",
        password_hash=hash_password("Campus@123"),
        role="USER",
        hostel="Girls Hostel",
        room_number="G-215",
        is_active=True,
        created_at=now - datetime.timedelta(days=5)
    )
    db.add(student5)

    # Demo Rider User (Vishnu)
    demo_rider_user = User(
        name="Vishnu",
        email="rider@campuscab.demo",
        phone="9876543220",
        password_hash=hash_password("Rider@123"),
        role="RIDER",
        is_active=True,
        created_at=now - datetime.timedelta(days=25)
    )
    db.add(demo_rider_user)

    # Rider 2 (Akash)
    rider2_user = User(
        name="Akash",
        email="akash@campuscab.demo",
        phone="9876543221",
        password_hash=hash_password("Rider@123"),
        role="RIDER",
        is_active=True,
        created_at=now - datetime.timedelta(days=22)
    )
    db.add(rider2_user)

    # Rider 3 (Naveen)
    rider3_user = User(
        name="Naveen",
        email="naveen@campuscab.demo",
        phone="9876543222",
        password_hash=hash_password("Rider@123"),
        role="RIDER",
        is_active=True,
        created_at=now - datetime.timedelta(days=18)
    )
    db.add(rider3_user)

    # Rider 4 (Karthik)
    rider4_user = User(
        name="Karthik",
        email="karthik@campuscab.demo",
        phone="9876543223",
        password_hash=hash_password("Rider@123"),
        role="RIDER",
        is_active=True,
        created_at=now - datetime.timedelta(days=12)
    )
    db.add(rider4_user)

    await db.commit()

    # 4. Seed Rider Profiles
    rider1 = Rider(
        user_id=demo_rider_user.id,
        vehicle_type="Bike",
        vehicle_number="TN-DEMO-01",
        availability_status="Available",
        rating=4.9
    )
    db.add(rider1)

    rider2 = Rider(
        user_id=rider2_user.id,
        vehicle_type="Bike",
        vehicle_number="TN-01-AB-1234",
        availability_status="Available",
        rating=4.8
    )
    db.add(rider2)

    rider3 = Rider(
        user_id=rider3_user.id,
        vehicle_type="Scooty",
        vehicle_number="PY-01-CD-5678",
        availability_status="Available",
        rating=4.95
    )
    db.add(rider3)

    rider4 = Rider(
        user_id=rider4_user.id,
        vehicle_type="Bike",
        vehicle_number="TN-32-EF-9012",
        availability_status="Busy",
        rating=4.7
    )
    db.add(rider4)

    await db.commit()

    # 5. Seed Vehicles
    veh1 = Vehicle(rider_id=rider1.id, type="BIKE", registration_number="TN-DEMO-01", status="Active")
    veh2 = Vehicle(rider_id=rider2.id, type="BIKE", registration_number="TN-01-AB-1234", status="Active")
    veh3 = Vehicle(rider_id=rider3.id, type="SCOOTY", registration_number="PY-01-CD-5678", status="Active")
    veh4 = Vehicle(rider_id=rider4.id, type="BIKE", registration_number="TN-32-EF-9012", status="Active")
    db.add_all([veh1, veh2, veh3, veh4])
    await db.commit()

    # 6. Seed Pending Demo Requests (Critical for instant competition presentation)
    # Demo Pending Ride (Rahul Menon -> Boys Hostel to Gate 2, 1 pass, ₹30)
    ride_pending = RideRequest(
        booking_id="CC-RIDE-1001",
        user_id=demo_student.id,
        pickup="Boys Hostel",
        drop="Gate 2",
        passengers=1,
        preferred_time="10:30 AM",
        fare=30.0,
        status="PENDING",
        created_at=now - datetime.timedelta(minutes=15)
    )
    db.add(ride_pending)

    # Demo Pending Rental (Priya Nair -> Scooty, 6h, ₹270, ₹1000 deposit)
    rental_pending = Rental(
        booking_id="CC-RENT-1001",
        user_id=student2.id,
        vehicle_type="Scooty",
        duration_hours=6,
        pickup_location="University",
        preferred_pickup_time="10:00 AM",
        security_deposit=1000.0,
        rental_charge=270.0,
        status="PENDING",
        created_at=now - datetime.timedelta(minutes=25)
    )
    db.add(rental_pending)

    # Demo Pending Laundry (Rahul Menon -> 3kg, ₹195 + ₹25 = ₹220, Saturday)
    laundry_pending = LaundryOrder(
        booking_id="CC-LAUNDRY-1001",
        user_id=demo_student.id,
        name="Rahul Menon",
        phone="9876543210",
        pickup_location="Boys Hostel",
        hostel="Boys Hostel",
        room_number="B-204",
        weight_kg=3.0,
        rate_per_kg=65.0,
        extra_charge=25.0,
        total_amount=220.0,
        pickup_day="Saturday",
        status="PENDING",
        created_at=now - datetime.timedelta(minutes=40)
    )
    db.add(laundry_pending)

    # 7. Seed Historical Completed & Active Records
    # Active Accepted Ride
    ride_accepted = RideRequest(
        booking_id="CC-RIDE-1002",
        user_id=student3.id,
        rider_id=rider2.id,
        pickup="Girls Hostel",
        drop="Science Block",
        passengers=1,
        preferred_time="11:00 AM",
        fare=25.0,
        status="ACCEPTED",
        created_at=now - datetime.timedelta(minutes=30),
        accepted_at=now - datetime.timedelta(minutes=10)
    )
    db.add(ride_accepted)

    # Historical Completed Rides
    completed_rides = [
        RideRequest(
            booking_id="CC-RIDE-0995",
            user_id=demo_student.id,
            rider_id=rider1.id,
            pickup="Boys Hostel",
            drop="Banyan Tree / Al Bayt",
            passengers=2,
            preferred_time="02:00 PM",
            fare=50.0,
            status="COMPLETED",
            created_at=now - datetime.timedelta(days=2),
            accepted_at=now - datetime.timedelta(days=2, minutes=-5),
            completed_at=now - datetime.timedelta(days=2, minutes=-25)
        ),
        RideRequest(
            booking_id="CC-RIDE-0996",
            user_id=student4.id,
            rider_id=rider1.id,
            pickup="SJ",
            drop="Gate 1",
            passengers=1,
            preferred_time="09:15 AM",
            fare=30.0,
            status="COMPLETED",
            created_at=now - datetime.timedelta(days=1),
            accepted_at=now - datetime.timedelta(days=1, minutes=-4),
            completed_at=now - datetime.timedelta(days=1, minutes=-20)
        ),
        RideRequest(
            booking_id="CC-RIDE-0997",
            user_id=student5.id,
            rider_id=rider3.id,
            pickup="University",
            drop="McDonald's",
            passengers=1,
            preferred_time="04:30 PM",
            fare=60.0,
            status="COMPLETED",
            created_at=now - datetime.timedelta(days=1),
            accepted_at=now - datetime.timedelta(days=1, minutes=-5),
            completed_at=now - datetime.timedelta(days=1, minutes=-35)
        ),
        RideRequest(
            booking_id="CC-RIDE-0998",
            user_id=student2.id,
            rider_id=rider2.id,
            pickup="University",
            drop="Bus Stand / JIPMER / Railway",
            passengers=2,
            preferred_time="07:00 PM",
            fare=230.0,
            status="COMPLETED",
            created_at=now - datetime.timedelta(hours=6),
            accepted_at=now - datetime.timedelta(hours=5, minutes=50),
            completed_at=now - datetime.timedelta(hours=5, minutes=10)
        ),
    ]
    db.add_all(completed_rides)

    # Active & Completed Rentals
    rental_completed = Rental(
        booking_id="CC-RENT-0998",
        user_id=demo_student.id,
        rider_id=rider1.id,
        vehicle_type="Bike",
        duration_hours=3,
        pickup_location="Boys Hostel",
        preferred_pickup_time="01:00 PM",
        security_deposit=1000.0,
        rental_charge=200.0,
        actual_return_time="04:00 PM",
        refund_amount=800.0,
        status="COMPLETED",
        created_at=now - datetime.timedelta(days=2)
    )
    db.add(rental_completed)

    rental_active = Rental(
        booking_id="CC-RENT-0999",
        user_id=student3.id,
        rider_id=rider3.id,
        vehicle_type="Scooty",
        duration_hours=12,
        pickup_location="Gate 1",
        preferred_pickup_time="08:00 AM",
        security_deposit=1000.0,
        rental_charge=340.0,
        status="ACTIVE",
        created_at=now - datetime.timedelta(hours=4)
    )
    db.add(rental_active)

    # Historical Completed & In-progress Laundry Orders
    laundry_completed = LaundryOrder(
        booking_id="CC-LAUNDRY-0998",
        user_id=demo_student.id,
        name="Rahul Menon",
        phone="9876543210",
        pickup_location="Boys Hostel",
        hostel="Boys Hostel",
        room_number="B-204",
        weight_kg=2.0,
        rate_per_kg=65.0,
        extra_charge=25.0,
        total_amount=155.0,
        pickup_day="Wednesday",
        status="COMPLETED",
        created_at=now - datetime.timedelta(days=3)
    )
    db.add(laundry_completed)

    laundry_processing = LaundryOrder(
        booking_id="CC-LAUNDRY-0999",
        user_id=student5.id,
        name="Meera Krishnan",
        phone="9876543214",
        pickup_location="Girls Hostel",
        hostel="Girls Hostel",
        room_number="G-215",
        weight_kg=4.0,
        rate_per_kg=65.0,
        extra_charge=25.0,
        total_amount=285.0,
        pickup_day="Saturday",
        status="PROCESSING",
        created_at=now - datetime.timedelta(days=1)
    )
    db.add(laundry_processing)

    # 8. Notifications
    notifs = [
        Notification(
            user_id=demo_student.id,
            title="Welcome to Campus Cab! 🚀",
            message="Book campus bike rides, laundry, and scooty rentals conveniently anytime.",
            type="SYSTEM",
            is_read=True,
            created_at=now - datetime.timedelta(days=5)
        ),
        Notification(
            user_id=demo_student.id,
            title="Ride Completed ✓",
            message="Your ride CC-RIDE-0995 to Banyan Tree was completed. Thank you for riding with Vishnu!",
            type="RIDE",
            is_read=True,
            created_at=now - datetime.timedelta(days=2)
        ),
        Notification(
            user_id=demo_rider_user.id,
            title="New Ride Request Available",
            message="New ride request CC-RIDE-1001 from Boys Hostel to Gate 2.",
            type="RIDE",
            is_read=False,
            created_at=now - datetime.timedelta(minutes=15)
        ),
        Notification(
            user_id=admin_user.id,
            title="New Laundry Order Received",
            message="Order CC-LAUNDRY-1001 (3 kg) from Boys Hostel pending review.",
            type="LAUNDRY",
            is_read=False,
            created_at=now - datetime.timedelta(minutes=40)
        ),
    ]
    db.add_all(notifs)

    # 9. Audit Logs
    audit = AdminAction(
        admin_id=admin_user.id,
        admin_name=admin_user.name,
        action="INITIAL_SEED",
        affected_item="SYSTEM",
        details="Database initialized with Campus Cab fare chart and demonstration records.",
        created_at=now
    )
    db.add(audit)

    await db.commit()
    print("Database successfully seeded with Campus Cab data!")
