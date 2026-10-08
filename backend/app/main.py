import datetime
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import aliased

from app.config import settings
from app.database import engine, Base, get_db
from app.models import (
    User, Rider, Vehicle, FareRoute, RideRequest, Rental,
    LaundryOrder, Notification, BookingStatusHistory, AdminAction
)

CustomerUser = aliased(User, name="cust_user")
RiderUser = aliased(User, name="rider_user")
from app.schemas import (
    UserRegister, UserLogin, DemoLoginRequest, UserOut, TokenResponse, UserProfileUpdate,
    FareRouteOut, FareCalculationRequest, FareCalculationResponse, FareRouteCreate, FareRouteUpdate,
    RideCreate, RideOut, RideStatusUpdate,
    RentalCreate, RentalOut, RentalReturnRequest,
    LaundryCreate, LaundryOut, LaundryStatusUpdate,
    NotificationOut, RiderCreate, RiderUpdate, AdminAnalyticsOut
)
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_role
)
from app.seeds import seed_database

app = FastAPI(
    title="Campus Cab API",
    description="Campus Mobility, Laundry & Rental Management Platform API",
    version="1.0.0"
)

from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response: StarletteResponse = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        return response

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Auto-seed if database is empty
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        user = result.scalars().first()
        if not user:
            print("Empty database detected. Seeding Campus Cab data...")
            await seed_database(session)

# -------------------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------------------

def generate_booking_id(prefix: str) -> str:
    num = random.randint(1000, 9999)
    return f"CC-{prefix}-{num}"

async def log_admin_action(db: AsyncSession, admin_user: User, action: str, item: str, details: str = ""):
    log_entry = AdminAction(
        admin_id=admin_user.id,
        admin_name=admin_user.name,
        action=action,
        affected_item=item,
        details=details
    )
    db.add(log_entry)

async def send_notification(db: AsyncSession, user_id: int, title: str, message: str, n_type: str = "INFO"):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=n_type,
        is_read=False
    )
    db.add(notif)

# -------------------------------------------------------------
# AUTHENTICATION ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/auth/register", response_model=TokenResponse)
async def register_user(data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone.strip(),
        password_hash=hash_password(data.password),
        role="USER",  # Strictly locked to USER
        hostel=data.hostel.strip() if data.hostel else None,
        room_number=data.room_number.strip() if data.room_number else None,
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Welcome notification
    await send_notification(
        db, new_user.id,
        "Welcome to Campus Cab!",
        "Your account is ready. Book rides, vehicle rentals, and laundry anytime.",
        "SYSTEM"
    )
    await db.commit()

    token = create_access_token({"sub": new_user.id, "role": new_user.role, "name": new_user.name})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

# Simple in-memory rate limiting for login endpoint (per IP)
import time
from collections import defaultdict

_login_attempts: dict = defaultdict(list)  # ip -> [timestamps]
_RATE_LIMIT_MAX = 10   # max attempts
_RATE_LIMIT_WINDOW = 60  # seconds

def _check_rate_limit(client_ip: str):
    now = time.time()
    attempts = _login_attempts[client_ip]
    # Remove old attempts outside window
    _login_attempts[client_ip] = [t for t in attempts if now - t < _RATE_LIMIT_WINDOW]
    if len(_login_attempts[client_ip]) >= _RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please wait a moment before trying again.",
            headers={"Retry-After": "60"}
        )
    _login_attempts[client_ip].append(now)

@app.post("/api/auth/login", response_model=TokenResponse)
async def login_user(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    # Rate limit by client IP
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    result = await db.execute(select(User).where(User.email == data.email.lower().strip()))
    user = result.scalars().first()
    # Generic error to prevent user enumeration
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled. Please contact admin.")

    # Clear rate limit on successful login
    _login_attempts.pop(client_ip, None)

    token = create_access_token({"sub": user.id, "role": user.role, "name": user.name})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.post("/api/auth/demo-login", response_model=TokenResponse)
async def demo_login(req: DemoLoginRequest, db: AsyncSession = Depends(get_db)):
    role_email_map = {
        "USER": "student@campuscab.demo",
        "RIDER": "rider@campuscab.demo",
        "ADMIN": "admin@campuscab.demo"
    }
    target_role = req.role.upper()
    if target_role not in role_email_map:
        raise HTTPException(status_code=400, detail="Invalid demo role. Allowed: USER, RIDER, ADMIN")

    email = role_email_map[target_role]
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        # If demo users got purged, reseed
        await seed_database(db)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

    token = create_access_token({"sub": user.id, "role": user.role, "name": user.name})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rider_info = None
    if current_user.role == "RIDER":
        result = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
        rider = result.scalars().first()
        if rider:
            rider_info = {
                "id": rider.id,
                "vehicle_type": rider.vehicle_type,
                "vehicle_number": rider.vehicle_number,
                "availability_status": rider.availability_status,
                "rating": rider.rating
            }
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role,
            "hostel": current_user.hostel,
            "room_number": current_user.room_number,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at
        },
        "rider": rider_info
    }

@app.patch("/api/auth/profile", response_model=UserOut)
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.phone:
        current_user.phone = data.phone.strip()
    if data.hostel is not None:
        current_user.hostel = data.hostel.strip()
    if data.room_number is not None:
        current_user.room_number = data.room_number.strip()
    await db.commit()
    await db.refresh(current_user)
    return current_user

# -------------------------------------------------------------
# FARE & ROUTE ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/fares", response_model=List[FareRouteOut])
async def list_fares(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FareRoute).where(FareRoute.is_active == True))
    return result.scalars().all()

@app.post("/api/fares/calculate", response_model=FareCalculationResponse)
async def calculate_fare(req: FareCalculationRequest, db: AsyncSession = Depends(get_db)):
    orig = req.from_location.strip().upper()
    dest = req.to_location.strip().upper()

    result = await db.execute(
        select(FareRoute).where(
            func.upper(FareRoute.from_location) == orig,
            func.upper(FareRoute.to_location) == dest,
            FareRoute.is_active == True
        )
    )
    route = result.scalars().first()

    if not route:
        return FareCalculationResponse(
            from_location=req.from_location,
            to_location=req.to_location,
            passengers=req.passengers,
            fare=0.0,
            is_available=False,
            message="Fare for this route is currently unavailable. Please select a supported Campus Cab route."
        )

    fare = route.single_fare if req.passengers == 1 else route.double_fare
    return FareCalculationResponse(
        from_location=route.from_location,
        to_location=route.to_location,
        passengers=req.passengers,
        fare=fare,
        is_available=True,
        message=f"₹{int(fare)} for {req.passengers} passenger{'s' if req.passengers > 1 else ''}"
    )

# -------------------------------------------------------------
# BIKE PICKUP & DROP (RIDES) ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/rides", response_model=RideOut)
async def create_ride(
    req: RideCreate,
    current_user: User = Depends(require_role(["USER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    orig = req.pickup.strip().upper()
    dest = req.drop.strip().upper()

    result = await db.execute(
        select(FareRoute).where(
            func.upper(FareRoute.from_location) == orig,
            func.upper(FareRoute.to_location) == dest,
            FareRoute.is_active == True
        )
    )
    route = result.scalars().first()
    if not route:
        raise HTTPException(
            status_code=400,
            detail="Fare for this route is currently unavailable. Please select a supported Campus Cab route."
        )

    fare = route.single_fare if req.passengers == 1 else route.double_fare
    booking_id = generate_booking_id("RIDE")

    ride = RideRequest(
        booking_id=booking_id,
        user_id=current_user.id,
        pickup=route.from_location,
        drop=route.to_location,
        passengers=req.passengers,
        preferred_time=req.preferred_time,
        fare=fare,
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(ride)
    await db.commit()
    await db.refresh(ride)

    # Notify available riders
    riders_res = await db.execute(select(Rider).where(Rider.availability_status == "Available"))
    avail_riders = riders_res.scalars().all()
    for r in avail_riders:
        await send_notification(
            db, r.user_id,
            "New Ride Request Available",
            f"New request from {ride.pickup} to {ride.drop} (₹{int(ride.fare)}).",
            "RIDE"
        )
    await db.commit()

    return RideOut(
        id=ride.id,
        booking_id=ride.booking_id,
        user_id=ride.user_id,
        rider_id=ride.rider_id,
        pickup=ride.pickup,
        drop=ride.drop,
        passengers=ride.passengers,
        preferred_time=ride.preferred_time,
        fare=ride.fare,
        status=ride.status,
        created_at=ride.created_at,
        customer_name=current_user.name,
        customer_phone=current_user.phone
    )

@app.get("/api/rides/my", response_model=List[RideOut])
async def get_my_rides(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(RideRequest, CustomerUser, Rider, RiderUser).select_from(RideRequest)\
        .join(CustomerUser, RideRequest.user_id == CustomerUser.id)\
        .outerjoin(Rider, RideRequest.rider_id == Rider.id)\
        .outerjoin(RiderUser, Rider.user_id == RiderUser.id)\
        .where(RideRequest.user_id == current_user.id)\
        .order_by(desc(RideRequest.created_at))
    
    res = await db.execute(query)
    rows = res.all()
    out = []
    for ride, cust, rider, rider_user in rows:
        out.append(RideOut(
            id=ride.id,
            booking_id=ride.booking_id,
            user_id=ride.user_id,
            rider_id=ride.rider_id,
            pickup=ride.pickup,
            drop=ride.drop,
            passengers=ride.passengers,
            preferred_time=ride.preferred_time,
            fare=ride.fare,
            status=ride.status,
            created_at=ride.created_at,
            accepted_at=ride.accepted_at,
            completed_at=ride.completed_at,
            customer_name=cust.name,
            customer_phone=cust.phone,
            rider_name=rider_user.name if rider_user else None,
            rider_phone=rider_user.phone if rider_user else None,
            vehicle_type=rider.vehicle_type if rider else None,
            vehicle_number=rider.vehicle_number if rider else None
        ))
    return out

@app.get("/api/rides/pending", response_model=List[RideOut])
async def get_pending_rides(
    current_user: User = Depends(require_role(["RIDER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(RideRequest, CustomerUser).join(CustomerUser, RideRequest.user_id == CustomerUser.id)\
        .where(RideRequest.status == "PENDING")\
        .order_by(desc(RideRequest.created_at))
    res = await db.execute(query)
    rows = res.all()
    out = []
    for ride, cust in rows:
        out.append(RideOut(
            id=ride.id,
            booking_id=ride.booking_id,
            user_id=ride.user_id,
            pickup=ride.pickup,
            drop=ride.drop,
            passengers=ride.passengers,
            preferred_time=ride.preferred_time,
            fare=ride.fare,
            status=ride.status,
            created_at=ride.created_at,
            customer_name=cust.name,
            customer_phone=cust.phone
        ))
    return out

@app.get("/api/rides/active", response_model=List[RideOut])
async def get_rider_active_rides(
    current_user: User = Depends(require_role(["RIDER"])),
    db: AsyncSession = Depends(get_db)
):
    rider_res = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
    rider = rider_res.scalars().first()
    if not rider:
        return []

    query = select(RideRequest, CustomerUser).join(CustomerUser, RideRequest.user_id == CustomerUser.id)\
        .where(
            RideRequest.rider_id == rider.id,
            RideRequest.status.in_(["ACCEPTED", "RIDER_ON_WAY", "STARTED"])
        )\
        .order_by(desc(RideRequest.created_at))
    res = await db.execute(query)
    rows = res.all()
    out = []
    for ride, cust in rows:
        out.append(RideOut(
            id=ride.id,
            booking_id=ride.booking_id,
            user_id=ride.user_id,
            rider_id=ride.rider_id,
            pickup=ride.pickup,
            drop=ride.drop,
            passengers=ride.passengers,
            preferred_time=ride.preferred_time,
            fare=ride.fare,
            status=ride.status,
            created_at=ride.created_at,
            accepted_at=ride.accepted_at,
            customer_name=cust.name,
            customer_phone=cust.phone,
            rider_name=current_user.name,
            rider_phone=current_user.phone,
            vehicle_type=rider.vehicle_type,
            vehicle_number=rider.vehicle_number
        ))
    return out

@app.get("/api/rides/all", response_model=List[RideOut])
async def get_all_rides(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(RideRequest, CustomerUser, Rider, RiderUser).select_from(RideRequest)\
        .join(CustomerUser, RideRequest.user_id == CustomerUser.id)\
        .outerjoin(Rider, RideRequest.rider_id == Rider.id)\
        .outerjoin(RiderUser, Rider.user_id == RiderUser.id)\
        .order_by(desc(RideRequest.created_at))

    if status_filter and status_filter.upper() != "ALL":
        query = query.where(RideRequest.status == status_filter.upper())

    res = await db.execute(query)
    rows = res.all()
    out = []
    for ride, cust, rider, rider_user in rows:
        out.append(RideOut(
            id=ride.id,
            booking_id=ride.booking_id,
            user_id=ride.user_id,
            rider_id=ride.rider_id,
            pickup=ride.pickup,
            drop=ride.drop,
            passengers=ride.passengers,
            preferred_time=ride.preferred_time,
            fare=ride.fare,
            status=ride.status,
            created_at=ride.created_at,
            accepted_at=ride.accepted_at,
            completed_at=ride.completed_at,
            customer_name=cust.name,
            customer_phone=cust.phone,
            rider_name=rider_user.name if rider_user else None,
            rider_phone=rider_user.phone if rider_user else None,
            vehicle_type=rider.vehicle_type if rider else None,
            vehicle_number=rider.vehicle_number if rider else None
        ))
    return out

@app.post("/api/rides/{ride_id}/accept")
async def accept_ride(
    ride_id: int,
    current_user: User = Depends(require_role(["RIDER"])),
    db: AsyncSession = Depends(get_db)
):
    rider_res = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
    rider = rider_res.scalars().first()
    if not rider:
        raise HTTPException(status_code=400, detail="Rider profile not found.")

    # Concurrency safe check & set
    result = await db.execute(select(RideRequest).where(RideRequest.id == ride_id).with_for_update())
    ride = result.scalars().first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride request not found.")
    
    if ride.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another rider has already accepted this request."
        )

    ride.status = "ACCEPTED"
    ride.rider_id = rider.id
    ride.accepted_at = datetime.datetime.utcnow()

    # User notification
    await send_notification(
        db, ride.user_id,
        "Ride Accepted ✓",
        f"Your ride {ride.booking_id} has been accepted by {current_user.name}. Vehicle: {rider.vehicle_type} ({rider.vehicle_number}). Phone: {current_user.phone}",
        "RIDE"
    )

    await db.commit()
    return {"message": "Ride accepted successfully", "booking_id": ride.booking_id, "status": ride.status}

@app.post("/api/rides/{ride_id}/status")
async def update_ride_status(
    ride_id: int,
    data: RideStatusUpdate,
    current_user: User = Depends(require_role(["RIDER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(RideRequest).where(RideRequest.id == ride_id))
    ride = result.scalars().first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    new_status = data.status.upper()
    valid_transitions = ["ACCEPTED", "RIDER_ON_WAY", "STARTED", "COMPLETED", "CANCELLED"]
    if new_status not in valid_transitions:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {valid_transitions}")

    ride.status = new_status
    if new_status == "COMPLETED":
        ride.completed_at = datetime.datetime.utcnow()

    status_labels = {
        "RIDER_ON_WAY": "Rider is on the way to your pickup location.",
        "STARTED": "Your ride has started.",
        "COMPLETED": "Ride completed! Thank you for using Campus Cab.",
        "CANCELLED": "Your ride has been cancelled."
    }
    msg = status_labels.get(new_status, f"Ride status updated to {new_status}")
    await send_notification(db, ride.user_id, f"Ride Update: {new_status}", msg, "RIDE")

    await db.commit()
    return {"message": "Status updated successfully", "status": ride.status}

@app.post("/api/rides/{ride_id}/cancel")
async def cancel_ride(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(RideRequest).where(RideRequest.id == ride_id))
    ride = result.scalars().first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")

    if current_user.role != "ADMIN" and ride.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to cancel this ride.")

    if ride.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Completed rides cannot be cancelled.")

    ride.status = "CANCELLED"
    await send_notification(
        db, ride.user_id,
        "Ride Cancelled",
        f"Ride request {ride.booking_id} has been cancelled.",
        "RIDE"
    )
    if ride.rider_id:
        rider_res = await db.execute(select(Rider).where(Rider.id == ride.rider_id))
        rider = rider_res.scalars().first()
        if rider:
            await send_notification(
                db, rider.user_id,
                "Ride Cancelled by Customer",
                f"Ride {ride.booking_id} was cancelled.",
                "RIDE"
            )
    await db.commit()
    return {"message": "Ride cancelled", "booking_id": ride.booking_id}

# -------------------------------------------------------------
# VEHICLE RENTAL ENDPOINTS
# -------------------------------------------------------------

RENTAL_PRICES = {
    3: 200.0,
    6: 270.0,
    12: 340.0,
    24: 420.0
}

@app.post("/api/rentals", response_model=RentalOut)
async def create_rental(
    req: RentalCreate,
    current_user: User = Depends(require_role(["USER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    price = RENTAL_PRICES.get(req.duration_hours)
    if not price:
        raise HTTPException(status_code=400, detail="Invalid rental duration. Choose 3, 6, 12, or 24 hours.")

    booking_id = generate_booking_id("RENT")
    rental = Rental(
        booking_id=booking_id,
        user_id=current_user.id,
        vehicle_type=req.vehicle_type,
        duration_hours=req.duration_hours,
        pickup_location=req.pickup_location.strip(),
        preferred_pickup_time=req.preferred_pickup_time.strip(),
        security_deposit=settings.RENTAL_SECURITY_DEPOSIT,  # ₹1000
        rental_charge=price,
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(rental)
    await db.commit()
    await db.refresh(rental)

    # Notify riders
    riders_res = await db.execute(select(Rider).where(Rider.availability_status == "Available"))
    avail_riders = riders_res.scalars().all()
    for r in avail_riders:
        await send_notification(
            db, r.user_id,
            "New Rental Request",
            f"New {rental.vehicle_type} rental request for {rental.duration_hours} hours at {rental.pickup_location}.",
            "RENTAL"
        )
    await db.commit()

    return RentalOut(
        id=rental.id,
        booking_id=rental.booking_id,
        user_id=rental.user_id,
        vehicle_type=rental.vehicle_type,
        duration_hours=rental.duration_hours,
        pickup_location=rental.pickup_location,
        preferred_pickup_time=rental.preferred_pickup_time,
        security_deposit=rental.security_deposit,
        rental_charge=rental.rental_charge,
        status=rental.status,
        created_at=rental.created_at,
        customer_name=current_user.name,
        customer_phone=current_user.phone
    )

@app.get("/api/rentals/my", response_model=List[RentalOut])
async def get_my_rentals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Rental, CustomerUser, Rider, RiderUser).select_from(Rental)\
        .join(CustomerUser, Rental.user_id == CustomerUser.id)\
        .outerjoin(Rider, Rental.rider_id == Rider.id)\
        .outerjoin(RiderUser, Rider.user_id == RiderUser.id)\
        .where(Rental.user_id == current_user.id)\
        .order_by(desc(Rental.created_at))

    res = await db.execute(query)
    rows = res.all()
    out = []
    for rent, cust, rider, rider_user in rows:
        out.append(RentalOut(
            id=rent.id,
            booking_id=rent.booking_id,
            user_id=rent.user_id,
            rider_id=rent.rider_id,
            vehicle_type=rent.vehicle_type,
            duration_hours=rent.duration_hours,
            pickup_location=rent.pickup_location,
            preferred_pickup_time=rent.preferred_pickup_time,
            security_deposit=rent.security_deposit,
            rental_charge=rent.rental_charge,
            actual_return_time=rent.actual_return_time,
            refund_amount=rent.refund_amount,
            status=rent.status,
            created_at=rent.created_at,
            customer_name=cust.name,
            customer_phone=cust.phone,
            rider_name=rider_user.name if rider_user else None,
            rider_phone=rider_user.phone if rider_user else None,
            vehicle_number=rider.vehicle_number if rider else None
        ))
    return out

@app.get("/api/rentals/pending", response_model=List[RentalOut])
async def get_pending_rentals(
    current_user: User = Depends(require_role(["RIDER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Rental, CustomerUser).join(CustomerUser, Rental.user_id == CustomerUser.id)\
        .where(Rental.status == "PENDING")\
        .order_by(desc(Rental.created_at))
    res = await db.execute(query)
    rows = res.all()
    out = []
    for rent, cust in rows:
        out.append(RentalOut(
            id=rent.id,
            booking_id=rent.booking_id,
            user_id=rent.user_id,
            vehicle_type=rent.vehicle_type,
            duration_hours=rent.duration_hours,
            pickup_location=rent.pickup_location,
            preferred_pickup_time=rent.preferred_pickup_time,
            security_deposit=rent.security_deposit,
            rental_charge=rent.rental_charge,
            status=rent.status,
            created_at=rent.created_at,
            customer_name=cust.name,
            customer_phone=cust.phone
        ))
    return out

@app.get("/api/rentals/all", response_model=List[RentalOut])
async def get_all_rentals(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Rental, CustomerUser, Rider, RiderUser).select_from(Rental)\
        .join(CustomerUser, Rental.user_id == CustomerUser.id)\
        .outerjoin(Rider, Rental.rider_id == Rider.id)\
        .outerjoin(RiderUser, Rider.user_id == RiderUser.id)\
        .order_by(desc(Rental.created_at))

    if status_filter and status_filter.upper() != "ALL":
        query = query.where(Rental.status == status_filter.upper())

    res = await db.execute(query)
    rows = res.all()
    out = []
    for rent, cust, rider, rider_user in rows:
        out.append(RentalOut(
            id=rent.id,
            booking_id=rent.booking_id,
            user_id=rent.user_id,
            rider_id=rent.rider_id,
            vehicle_type=rent.vehicle_type,
            duration_hours=rent.duration_hours,
            pickup_location=rent.pickup_location,
            preferred_pickup_time=rent.preferred_pickup_time,
            security_deposit=rent.security_deposit,
            rental_charge=rent.rental_charge,
            actual_return_time=rent.actual_return_time,
            refund_amount=rent.refund_amount,
            status=rent.status,
            created_at=rent.created_at,
            customer_name=cust.name,
            customer_phone=cust.phone,
            rider_name=rider_user.name if rider_user else None,
            rider_phone=rider_user.phone if rider_user else None,
            vehicle_number=rider.vehicle_number if rider else None
        ))
    return out

@app.post("/api/rentals/{rental_id}/accept")
async def accept_rental(
    rental_id: int,
    current_user: User = Depends(require_role(["RIDER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    rider_res = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
    rider = rider_res.scalars().first()
    if not rider:
        raise HTTPException(status_code=400, detail="Rider profile not found.")

    result = await db.execute(select(Rental).where(Rental.id == rental_id).with_for_update())
    rental = result.scalars().first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found.")
    if rental.status != "PENDING":
        raise HTTPException(status_code=409, detail="This rental has already been accepted.")

    rental.status = "ACCEPTED"
    rental.rider_id = rider.id

    await send_notification(
        db, rental.user_id,
        "Rental Request Accepted ✓",
        f"Your {rental.vehicle_type} rental {rental.booking_id} has been accepted by {current_user.name}. Phone: {current_user.phone}. Vehicle: {rider.vehicle_number}.",
        "RENTAL"
    )
    await db.commit()
    return {"message": "Rental accepted successfully", "booking_id": rental.booking_id, "status": rental.status}

@app.post("/api/rentals/{rental_id}/status")
async def update_rental_status(
    rental_id: int,
    status_val: str = Query(..., alias="status"),
    current_user: User = Depends(require_role(["RIDER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Rental).where(Rental.id == rental_id))
    rental = result.scalars().first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found.")

    rental.status = status_val.upper()
    await send_notification(
        db, rental.user_id,
        f"Rental Status: {rental.status}",
        f"Your rental {rental.booking_id} status has been updated to {rental.status}.",
        "RENTAL"
    )
    await db.commit()
    return {"message": "Status updated", "status": rental.status}

@app.post("/api/rentals/{rental_id}/return")
async def return_rental(
    rental_id: int,
    data: RentalReturnRequest,
    current_user: User = Depends(require_role(["RIDER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Rental).where(Rental.id == rental_id))
    rental = result.scalars().first()
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found.")

    return_time_str = data.actual_return_time or datetime.datetime.utcnow().strftime("%I:%M %p")
    rental.actual_return_time = return_time_str

    if data.actual_duration_hours and data.actual_duration_hours in RENTAL_PRICES:
        rental.rental_charge = RENTAL_PRICES[data.actual_duration_hours]

    refund = max(0.0, rental.security_deposit - rental.rental_charge)
    rental.refund_amount = refund
    rental.status = "COMPLETED"

    await send_notification(
        db, rental.user_id,
        "Vehicle Returned — Refund Processed ✓",
        f"Rental {rental.booking_id} returned. Initial Deposit: ₹{int(rental.security_deposit)}, Rental Charge: ₹{int(rental.rental_charge)}. Refund Amount: ₹{int(refund)}.",
        "RENTAL"
    )

    if current_user.role == "ADMIN":
        await log_admin_action(
            db, current_user, "RENTAL_RETURN", rental.booking_id,
            f"Returned. Charge: ₹{rental.rental_charge}, Refund: ₹{refund}"
        )

    await db.commit()
    return {
        "message": "Vehicle returned and refund calculated",
        "booking_id": rental.booking_id,
        "security_deposit": rental.security_deposit,
        "rental_charge": rental.rental_charge,
        "refund_amount": rental.refund_amount,
        "status": rental.status
    }

# -------------------------------------------------------------
# LAUNDRY MANAGEMENT ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/laundry", response_model=LaundryOut)
async def create_laundry(
    req: LaundryCreate,
    current_user: User = Depends(require_role(["USER", "ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    # Pricing formula: Weight * ₹65 + ₹25 extra charge
    rate = settings.LAUNDRY_RATE_PER_KG
    extra = settings.LAUNDRY_EXTRA_CHARGE
    total = (req.weight_kg * rate) + extra

    booking_id = generate_booking_id("LAUNDRY")
    order = LaundryOrder(
        booking_id=booking_id,
        user_id=current_user.id,
        name=req.name.strip(),
        phone=req.phone.strip(),
        pickup_location=req.pickup_location.strip(),
        hostel=req.hostel.strip() if req.hostel else None,
        room_number=req.room_number.strip() if req.room_number else None,
        weight_kg=req.weight_kg,
        rate_per_kg=rate,
        extra_charge=extra,
        total_amount=total,
        pickup_day=req.pickup_day,
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Notify Admin
    admin_res = await db.execute(select(User).where(User.role == "ADMIN"))
    admins = admin_res.scalars().all()
    for adm in admins:
        await send_notification(
            db, adm.id,
            "New Laundry Order",
            f"New laundry order {order.booking_id} ({order.weight_kg}kg, ₹{int(order.total_amount)}) from {order.pickup_location}.",
            "LAUNDRY"
        )
    await db.commit()
    return order

@app.get("/api/laundry/my", response_model=List[LaundryOut])
async def get_my_laundry(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(LaundryOrder).where(LaundryOrder.user_id == current_user.id).order_by(desc(LaundryOrder.created_at))
    )
    return res.scalars().all()

@app.get("/api/laundry/admin", response_model=List[LaundryOut])
async def get_all_laundry(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(LaundryOrder).order_by(desc(LaundryOrder.created_at))
    if status_filter and status_filter.upper() != "ALL":
        query = query.where(LaundryOrder.status == status_filter.upper())
    res = await db.execute(query)
    return res.scalars().all()

LAUNDRY_STATUS_FLOW = [
    "PENDING",
    "PICKUP_SCHEDULED",
    "COLLECTED",
    "PROCESSING",
    "READY",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED"
]

@app.patch("/api/laundry/{laundry_id}/status")
async def update_laundry_status(
    laundry_id: int,
    data: LaundryStatusUpdate,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(LaundryOrder).where(LaundryOrder.id == laundry_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Laundry order not found.")

    new_status = data.status.upper()
    if new_status not in LAUNDRY_STATUS_FLOW:
        raise HTTPException(status_code=400, detail=f"Invalid laundry status. Allowed: {LAUNDRY_STATUS_FLOW}")

    order.status = new_status

    status_messages = {
        "PICKUP_SCHEDULED": f"Laundry pickup scheduled for upcoming {order.pickup_day}.",
        "COLLECTED": f"Your laundry ({order.weight_kg}kg) has been collected by our team.",
        "PROCESSING": "Your laundry is currently being washed and dried.",
        "READY": "Your clean laundry is packed and ready for delivery.",
        "DELIVERED": "Your laundry has been delivered to your campus location.",
        "COMPLETED": "Laundry order completed. Thank you for choosing Campus Cab!",
        "CANCELLED": "Laundry order has been cancelled."
    }
    msg = status_messages.get(new_status, f"Status updated to {new_status}")
    await send_notification(db, order.user_id, f"Laundry Update: {new_status.replace('_', ' ')}", msg, "LAUNDRY")

    await log_admin_action(
        db, current_user, "LAUNDRY_STATUS_UPDATE", order.booking_id,
        f"Changed status to {new_status}"
    )

    await db.commit()
    return {"message": "Laundry status updated", "booking_id": order.booking_id, "status": order.status}

# -------------------------------------------------------------
# NOTIFICATIONS ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/notifications", response_model=List[NotificationOut])
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id).order_by(desc(Notification.created_at))
    )
    return res.scalars().all()

@app.patch("/api/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id)
    )
    notif = res.scalars().first()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"status": "ok"}

@app.post("/api/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    for n in res.scalars().all():
        n.is_read = True
    await db.commit()
    return {"status": "ok"}

# -------------------------------------------------------------
# RIDER DASHBOARD & AVAILABILITY ENDPOINTS
# -------------------------------------------------------------

@app.patch("/api/rider/availability")
async def update_rider_availability(
    status_val: str = Query(..., alias="status"),
    current_user: User = Depends(require_role(["RIDER"])),
    db: AsyncSession = Depends(get_db)
):
    val = status_val.capitalize()
    if val not in ["Available", "Busy", "Offline"]:
        raise HTTPException(status_code=400, detail="Allowed statuses: Available, Busy, Offline")

    res = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
    rider = res.scalars().first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider profile not found.")

    rider.availability_status = val
    await db.commit()
    return {"status": "ok", "availability_status": rider.availability_status}

@app.get("/api/rider/stats")
async def get_rider_stats(
    current_user: User = Depends(require_role(["RIDER"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Rider).where(Rider.user_id == current_user.id))
    rider = res.scalars().first()
    if not rider:
        raise HTTPException(status_code=404, detail="Rider profile not found.")

    # Pending rides count
    pending_rides_cnt = await db.scalar(
        select(func.count(RideRequest.id)).where(RideRequest.status == "PENDING")
    )
    # Pending rentals count
    pending_rentals_cnt = await db.scalar(
        select(func.count(Rental.id)).where(Rental.status == "PENDING")
    )
    # Accepted active rides
    active_rides_cnt = await db.scalar(
        select(func.count(RideRequest.id)).where(
            RideRequest.rider_id == rider.id,
            RideRequest.status.in_(["ACCEPTED", "RIDER_ON_WAY", "STARTED"])
        )
    )
    # Completed rides
    completed_rides_res = await db.execute(
        select(RideRequest).where(
            RideRequest.rider_id == rider.id,
            RideRequest.status == "COMPLETED"
        )
    )
    completed_rides = completed_rides_res.scalars().all()
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_earnings = sum(r.fare for r in completed_rides)
    today_earnings = sum(r.fare for r in completed_rides if r.completed_at and r.completed_at >= today_start)

    return {
        "pending_requests": (pending_rides_cnt or 0) + (pending_rentals_cnt or 0),
        "pending_rides": pending_rides_cnt or 0,
        "pending_rentals": pending_rentals_cnt or 0,
        "active_rides": active_rides_cnt or 0,
        "completed_rides": len(completed_rides),
        "today_earnings": today_earnings,
        "total_earnings": total_earnings,
        "availability_status": rider.availability_status,
        "rating": rider.rating,
        "vehicle_type": rider.vehicle_type,
        "vehicle_number": rider.vehicle_number
    }

# -------------------------------------------------------------
# ADMIN OPERATIONS & ANALYTICS ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/admin/analytics", response_model=AdminAnalyticsOut)
async def get_admin_analytics(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Rides
    all_rides_res = await db.execute(select(RideRequest))
    all_rides = all_rides_res.scalars().all()
    total_rides = len(all_rides)
    completed_rides = sum(1 for r in all_rides if r.status == "COMPLETED")
    pending_rides = sum(1 for r in all_rides if r.status == "PENDING")
    today_rides = sum(1 for r in all_rides if r.created_at >= today_start)

    # Rentals
    all_rentals_res = await db.execute(select(Rental))
    all_rentals = all_rentals_res.scalars().all()
    rental_requests = len(all_rentals)
    today_rentals = sum(1 for r in all_rentals if r.created_at >= today_start)

    # Laundry
    all_laundry_res = await db.execute(select(LaundryOrder))
    all_laundry = all_laundry_res.scalars().all()
    laundry_orders = len(all_laundry)
    today_laundry = sum(1 for l in all_laundry if l.created_at >= today_start)

    # Active riders
    active_riders_cnt = await db.scalar(
        select(func.count(Rider.id)).where(Rider.availability_status == "Available")
    ) or 0

    # REVENUE CALCULATION:
    # Ride revenue: sum of completed fares
    # Rental revenue: sum of rental charges (SECURITY DEPOSIT IS NEVER COUNTED AS REVENUE!)
    # Laundry revenue: sum of completed/in-progress total amounts
    ride_rev = sum(r.fare for r in all_rides if r.status in ["COMPLETED", "ACCEPTED", "STARTED"])
    rental_rev = sum(r.rental_charge for r in all_rentals if r.status in ["COMPLETED", "ACTIVE", "ACCEPTED", "RETURNED"])
    laundry_rev = sum(l.total_amount for l in all_laundry if l.status not in ["CANCELLED"])
    total_rev = ride_rev + rental_rev + laundry_rev

    today_ride_rev = sum(r.fare for r in all_rides if r.created_at >= today_start and r.status != "CANCELLED")
    today_rental_rev = sum(r.rental_charge for r in all_rentals if r.created_at >= today_start and r.status != "CANCELLED")
    today_laundry_rev = sum(l.total_amount for l in all_laundry if l.created_at >= today_start and l.status != "CANCELLED")
    today_revenue = today_ride_rev + today_rental_rev + today_laundry_rev

    # Daily charts (past 7 days)
    rides_by_day = []
    laundry_by_day = []
    rentals_by_day = []
    for i in range(6, -1, -1):
        day = now - datetime.timedelta(days=i)
        d_str = day.strftime("%b %d")
        d_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        d_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)

        r_cnt = sum(1 for r in all_rides if d_start <= r.created_at <= d_end)
        l_cnt = sum(1 for l in all_laundry if d_start <= l.created_at <= d_end)
        rent_cnt = sum(1 for r in all_rentals if d_start <= r.created_at <= d_end)

        rides_by_day.append({"date": d_str, "rides": r_cnt})
        laundry_by_day.append({"date": d_str, "orders": l_cnt})
        rentals_by_day.append({"date": d_str, "rentals": rent_cnt})

    revenue_by_service = [
        {"service": "Bike Rides", "revenue": round(ride_rev, 2)},
        {"service": "Laundry", "revenue": round(laundry_rev, 2)},
        {"service": "Rentals", "revenue": round(rental_rev, 2)},
    ]

    service_distribution = [
        {"name": "Bike Rides", "count": total_rides},
        {"name": "Laundry Orders", "count": laundry_orders},
        {"name": "Rentals", "count": rental_requests},
    ]

    return AdminAnalyticsOut(
        total_rides=total_rides,
        completed_rides=completed_rides,
        pending_rides=pending_rides,
        active_riders=active_riders_cnt,
        rental_requests=rental_requests,
        laundry_orders=laundry_orders,
        total_revenue=round(total_rev, 2),
        today_rides=today_rides,
        today_rentals=today_rentals,
        today_laundry=today_laundry,
        today_revenue=round(today_revenue, 2),
        rides_by_day=rides_by_day,
        laundry_by_day=laundry_by_day,
        rentals_by_day=rentals_by_day,
        revenue_by_service=revenue_by_service,
        service_distribution=service_distribution
    )

@app.get("/api/admin/reports")
async def get_admin_reports(
    period: str = "week",
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    if period == "day":
        days = 1
    elif period == "month":
        days = 30
    else:
        days = 7
    
    start_time = now - datetime.timedelta(days=days)

    rides_res = await db.execute(select(RideRequest).where(RideRequest.created_at >= start_time))
    rides = rides_res.scalars().all()
    completed_rides = [r for r in rides if r.status == "COMPLETED"]
    rides_revenue = sum(r.fare for r in completed_rides)

    laundry_res = await db.execute(select(LaundryOrder).where(LaundryOrder.created_at >= start_time))
    laundries = laundry_res.scalars().all()
    delivered_laundry = [l for l in laundries if l.status == "DELIVERED"]
    laundry_revenue = sum(l.total_amount for l in delivered_laundry)
    total_kg = sum(l.weight_kg for l in laundries)

    rentals_res = await db.execute(select(Rental).where(Rental.created_at >= start_time))
    rentals = rentals_res.scalars().all()
    returned_rentals = [rt for rt in rentals if rt.status == "RETURNED"]
    rentals_revenue = sum(rt.rental_charge for rt in returned_rentals)
    total_deposits = sum(rt.security_deposit for rt in rentals)
    total_refunds = sum(rt.refund_amount or 0 for rt in returned_rentals)

    total_revenue = round(rides_revenue + laundry_revenue + rentals_revenue, 2)
    total_services = len(rides) + len(laundries) + len(rentals)

    daily_breakdown = []
    for i in range(days - 1, -1, -1):
        d = (now - datetime.timedelta(days=i)).date()
        d_rides = [r for r in completed_rides if r.created_at.date() == d]
        d_laundry = [l for l in delivered_laundry if l.created_at.date() == d]
        d_rentals = [rt for rt in returned_rentals if rt.created_at.date() == d]
        
        all_d_rides = [r for r in rides if r.created_at.date() == d]
        all_d_laundry = [l for l in laundries if l.created_at.date() == d]
        all_d_rentals = [rt for rt in rentals if rt.created_at.date() == d]

        rev = sum(r.fare for r in d_rides) + sum(l.total_amount for l in d_laundry) + sum(rt.rental_charge for rt in d_rentals)
        daily_breakdown.append({
            "date": d.strftime("%b %d"),
            "rides": len(all_d_rides),
            "laundry": len(all_d_laundry),
            "rentals": len(all_d_rentals),
            "revenue": round(rev, 2)
        })

    return {
        "period": period,
        "days": days,
        "start_date": start_time.strftime("%Y-%m-%d"),
        "end_date": now.strftime("%Y-%m-%d"),
        "total_revenue": total_revenue,
        "total_services": total_services,
        "rides": {
            "count": len(rides),
            "completed": len(completed_rides),
            "revenue": round(rides_revenue, 2),
            "avg_fare": round(rides_revenue / max(len(completed_rides), 1), 2)
        },
        "laundry": {
            "count": len(laundries),
            "delivered": len(delivered_laundry),
            "revenue": round(laundry_revenue, 2),
            "total_kg": round(total_kg, 1)
        },
        "rentals": {
            "count": len(rentals),
            "returned": len(returned_rentals),
            "revenue": round(rentals_revenue, 2),
            "total_deposits": round(total_deposits, 2),
            "total_refunds": round(total_refunds, 2)
        },
        "daily_breakdown": daily_breakdown
    }

@app.get("/api/admin/users")
async def get_admin_users(
    search: Optional[str] = None,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).order_by(desc(User.created_at))
    if search:
        s = f"%{search.strip()}%"
        query = query.where(or_(User.name.ilike(s), User.email.ilike(s), User.phone.ilike(s)))
    res = await db.execute(query)
    users = res.scalars().all()
    
    out = []
    for u in users:
        rides_c = await db.scalar(select(func.count(RideRequest.id)).where(RideRequest.user_id == u.id)) or 0
        laundry_c = await db.scalar(select(func.count(LaundryOrder.id)).where(LaundryOrder.user_id == u.id)) or 0
        rent_c = await db.scalar(select(func.count(Rental.id)).where(Rental.user_id == u.id)) or 0
        out.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "hostel": u.hostel,
            "room_number": u.room_number,
            "is_active": u.is_active,
            "total_bookings": rides_c + laundry_c + rent_c,
            "created_at": u.created_at
        })
    return out

@app.get("/api/admin/riders")
async def get_admin_riders(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(Rider, User).join(User, Rider.user_id == User.id)
    res = await db.execute(query)
    rows = res.all()
    out = []
    for rider, u in rows:
        rides_c = await db.scalar(select(func.count(RideRequest.id)).where(RideRequest.rider_id == rider.id, RideRequest.status == "COMPLETED")) or 0
        out.append({
            "id": rider.id,
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "vehicle_type": rider.vehicle_type,
            "vehicle_number": rider.vehicle_number,
            "availability_status": rider.availability_status,
            "rating": rider.rating,
            "completed_rides": rides_c,
            "is_active": u.is_active,
            "created_at": rider.created_at
        })
    return out

@app.post("/api/admin/riders")
async def create_rider(
    data: RiderCreate,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone.strip(),
        password_hash=hash_password(data.password),
        role="RIDER",
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    rider = Rider(
        user_id=new_user.id,
        vehicle_type=data.vehicle_type,
        vehicle_number=data.vehicle_number.strip(),
        availability_status="Available",
        rating=5.0
    )
    db.add(rider)
    await db.commit()
    await db.refresh(rider)

    veh = Vehicle(
        rider_id=rider.id,
        type=data.vehicle_type.upper(),
        registration_number=data.vehicle_number.strip(),
        status="Active"
    )
    db.add(veh)

    await log_admin_action(
        db, current_user, "ADD_RIDER", new_user.name,
        f"Added rider with vehicle {data.vehicle_number}"
    )
    await db.commit()

    return {"message": "Rider added successfully", "rider_id": rider.id}

@app.patch("/api/admin/riders/{rider_id}")
async def update_rider(
    rider_id: int,
    data: RiderUpdate,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Rider, User).join(User, Rider.user_id == User.id).where(Rider.id == rider_id))
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Rider not found.")
    rider, u = row

    if data.name:
        u.name = data.name.strip()
    if data.phone:
        u.phone = data.phone.strip()
    if data.vehicle_type:
        rider.vehicle_type = data.vehicle_type
    if data.vehicle_number:
        rider.vehicle_number = data.vehicle_number.strip()
    if data.availability_status:
        rider.availability_status = data.availability_status
    if data.is_active is not None:
        u.is_active = data.is_active

    await log_admin_action(
        db, current_user, "UPDATE_RIDER", u.name,
        f"Updated rider {rider_id} details."
    )
    await db.commit()
    return {"message": "Rider updated successfully"}

# -------------------------------------------------------------
# FARE MANAGEMENT (ADMIN)
# -------------------------------------------------------------

@app.post("/api/admin/fares", response_model=FareRouteOut)
async def create_fare_route(
    data: FareRouteCreate,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    route = FareRoute(
        from_location=data.from_location.strip().upper(),
        to_location=data.to_location.strip().upper(),
        single_fare=data.single_fare,
        double_fare=data.double_fare,
        is_active=True
    )
    db.add(route)
    await log_admin_action(
        db, current_user, "ADD_FARE_ROUTE", f"{route.from_location} -> {route.to_location}",
        f"Single: ₹{data.single_fare}, Double: ₹{data.double_fare}"
    )
    await db.commit()
    await db.refresh(route)
    return route

@app.patch("/api/admin/fares/{route_id}", response_model=FareRouteOut)
async def update_fare_route(
    route_id: int,
    data: FareRouteUpdate,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(FareRoute).where(FareRoute.id == route_id))
    route = res.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found.")

    if data.single_fare is not None:
        route.single_fare = data.single_fare
    if data.double_fare is not None:
        route.double_fare = data.double_fare
    if data.is_active is not None:
        route.is_active = data.is_active

    await log_admin_action(
        db, current_user, "UPDATE_FARE_ROUTE", f"{route.from_location} -> {route.to_location}",
        f"Updated fares. Single: ₹{route.single_fare}, Double: ₹{route.double_fare}"
    )
    await db.commit()
    await db.refresh(route)
    return route

@app.get("/api/admin/audit-logs")
async def get_audit_logs(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(AdminAction).order_by(desc(AdminAction.created_at)).limit(50))
    return res.scalars().all()

# -------------------------------------------------------------
# DEMO MODE CONTROLS & RESET
# -------------------------------------------------------------

@app.post("/api/demo/reset")
async def reset_demo(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await seed_database(db)
    return {"message": "Demo database successfully reset to clean presentation state!"}

@app.post("/api/demo/prepare-ride")
async def prepare_demo_ride(db: AsyncSession = Depends(get_db)):
    student_res = await db.execute(select(User).where(User.email == "student@campuscab.demo"))
    student = student_res.scalars().first()
    if not student:
        await seed_database(db)
        student_res = await db.execute(select(User).where(User.email == "student@campuscab.demo"))
        student = student_res.scalars().first()

    booking_id = generate_booking_id("RIDE")
    new_ride = RideRequest(
        booking_id=booking_id,
        user_id=student.id,
        pickup="Boys Hostel",
        drop="Gate 2",
        passengers=1,
        preferred_time="10:30 AM",
        fare=30.0,
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_ride)
    await db.commit()
    return {"message": "Demo pending ride prepared", "booking_id": booking_id, "fare": 30.0}

@app.post("/api/demo/prepare-rental")
async def prepare_demo_rental(db: AsyncSession = Depends(get_db)):
    student_res = await db.execute(select(User).where(User.email == "student@campuscab.demo"))
    student = student_res.scalars().first()
    if not student:
        await seed_database(db)
        student_res = await db.execute(select(User).where(User.email == "student@campuscab.demo"))
        student = student_res.scalars().first()

    booking_id = generate_booking_id("RENT")
    new_rental = Rental(
        booking_id=booking_id,
        user_id=student.id,
        vehicle_type="Scooty",
        duration_hours=6,
        pickup_location="University",
        preferred_pickup_time="10:00 AM",
        security_deposit=1000.0,
        rental_charge=270.0,
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_rental)
    await db.commit()
    return {"message": "Demo pending rental prepared", "booking_id": booking_id, "deposit": 1000.0, "charge": 270.0}

@app.post("/api/demo/prepare-laundry")
async def prepare_demo_laundry(db: AsyncSession = Depends(get_db)):
    student_res = await db.execute(select(User).where(User.email == "student@campuscab.demo"))
    student = student_res.scalars().first()
    if not student:
        await seed_database(db)
        student_res = await db.execute(select(User).where(User.email == "student@campuscab.demo"))
        student = student_res.scalars().first()

    booking_id = generate_booking_id("LAUNDRY")
    new_laundry = LaundryOrder(
        booking_id=booking_id,
        user_id=student.id,
        name="Rahul Menon",
        phone="9876543210",
        pickup_location="Boys Hostel",
        hostel="Boys Hostel",
        room_number="B-204",
        weight_kg=2.0,
        rate_per_kg=65.0,
        extra_charge=25.0,
        total_amount=155.0,
        pickup_day="Saturday",
        status="PENDING",
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_laundry)
    await db.commit()
    return {"message": "Demo pending laundry prepared", "booking_id": booking_id, "total": 155.0}

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "Campus Cab API",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
