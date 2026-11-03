import datetime
from typing import Optional, List
import re
from pydantic import BaseModel, Field, field_validator

# --- Auth Schemas ---

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    hostel: Optional[str] = None
    room_number: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v):
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v.strip()):
            raise ValueError("Invalid email format")
        return v.strip().lower()

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = "".join(filter(str.isdigit, v))
        if len(digits) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return v

class RiderRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    vehicle_type: str = Field(..., pattern="^(Bike|Scooty|bike|scooty)$")
    vehicle_number: str = Field(..., min_length=3, max_length=50)
    driving_license: str = Field(..., min_length=3, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v):
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v.strip()):
            raise ValueError("Invalid email format")
        return v.strip().lower()

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = "".join(filter(str.isdigit, v))
        if len(digits) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return v

    @field_validator("vehicle_type")
    @classmethod
    def normalize_vehicle(cls, v):
        return v.capitalize()

class UserLogin(BaseModel):
    email: str
    password: str

class DemoLoginRequest(BaseModel):
    role: str  # USER, RIDER, ADMIN

class UserProfileUpdate(BaseModel):
    phone: Optional[str] = None
    hostel: Optional[str] = None
    room_number: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    hostel: Optional[str] = None
    room_number: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    rider: Optional[dict] = None

# --- Fare Schemas ---

class FareRouteOut(BaseModel):
    id: int
    from_location: str
    to_location: str
    single_fare: float
    double_fare: float
    is_active: bool

    class Config:
        from_attributes = True

class FareCalculationRequest(BaseModel):
    from_location: str
    to_location: str
    passengers: int = Field(1, ge=1, le=2)

class FareCalculationResponse(BaseModel):
    from_location: str
    to_location: str
    passengers: int
    fare: float
    is_available: bool
    message: Optional[str] = None

class FareRouteCreate(BaseModel):
    from_location: str
    to_location: str
    single_fare: float = Field(..., gt=0)
    double_fare: float = Field(..., gt=0)

class FareRouteUpdate(BaseModel):
    single_fare: Optional[float] = Field(None, gt=0)
    double_fare: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None

# --- Ride Schemas ---

class RideCreate(BaseModel):
    pickup: str
    drop: str
    passengers: int = Field(1, ge=1, le=2)
    preferred_time: str = Field(..., min_length=1)

class RiderInfoOut(BaseModel):
    id: int
    name: str
    phone: str
    vehicle_type: str
    vehicle_number: str
    driving_license: Optional[str] = None
    approval_status: str = "APPROVED"
    rating: float
    availability_status: str

class RideOut(BaseModel):
    id: int
    booking_id: str
    user_id: int
    rider_id: Optional[int] = None
    pickup: str
    drop: str
    passengers: int
    preferred_time: str
    fare: float
    status: str
    created_at: datetime.datetime
    accepted_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None

    class Config:
        from_attributes = True

class RideStatusUpdate(BaseModel):
    status: str  # ACCEPTED, RIDER_ON_WAY, STARTED, COMPLETED, CANCELLED

# --- Rental Schemas ---

class RentalCreate(BaseModel):
    vehicle_type: str = Field(..., pattern="^(Bike|Scooty|bike|scooty)$")
    duration_hours: int = Field(..., description="Must be 3, 6, 12, or 24")
    pickup_location: str
    preferred_pickup_time: str

    @field_validator("duration_hours")
    @classmethod
    def validate_duration(cls, v):
        if v not in [3, 6, 12, 24]:
            raise ValueError("Rental duration must be 3, 6, 12, or 24 hours")
        return v

    @field_validator("vehicle_type")
    @classmethod
    def normalize_vehicle(cls, v):
        return v.capitalize()

class RentalReturnRequest(BaseModel):
    actual_return_time: Optional[str] = None
    actual_duration_hours: Optional[int] = None

class RentalOut(BaseModel):
    id: int
    booking_id: str
    user_id: int
    rider_id: Optional[int] = None
    vehicle_type: str
    duration_hours: int
    pickup_location: str
    preferred_pickup_time: str
    security_deposit: float
    rental_charge: float
    actual_return_time: Optional[str] = None
    refund_amount: Optional[float] = None
    status: str
    created_at: datetime.datetime
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    rider_name: Optional[str] = None
    rider_phone: Optional[str] = None
    vehicle_number: Optional[str] = None

    class Config:
        from_attributes = True

# --- Notification Schemas ---

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Admin Rider Management & Approvals ---

class RiderCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str = "Rider@123"
    vehicle_type: str = "Bike"
    vehicle_number: str
    driving_license: Optional[str] = None

class RiderUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    driving_license: Optional[str] = None
    availability_status: Optional[str] = None
    approval_status: Optional[str] = None
    is_active: Optional[bool] = None

class RiderApprovalOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    phone: str
    vehicle_type: str
    vehicle_number: str
    driving_license: Optional[str] = None
    approval_status: str
    rating: float
    availability_status: str
    created_at: datetime.datetime

# --- Analytics & Reports ---

class AdminAnalyticsOut(BaseModel):
    total_rides: int
    completed_rides: int
    pending_rides: int
    active_riders: int
    rental_requests: int
    pending_rider_approvals: int = 0
    total_revenue: float
    today_rides: int
    today_rentals: int
    today_revenue: float
    rides_by_day: List[dict]
    rentals_by_day: List[dict]
    revenue_by_service: List[dict]
    service_distribution: List[dict]

class RiderApprovalAction(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$")
