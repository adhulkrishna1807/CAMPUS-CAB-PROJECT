import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.datetime.utcnow()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="USER", nullable=False)  # USER, RIDER, ADMIN
    hostel = Column(String(100), nullable=True)
    room_number = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    is_active = Column(Boolean, default=True)

    rider_profile = relationship("Rider", back_populates="user", uselist=False)
    ride_requests = relationship("RideRequest", back_populates="user", foreign_keys="RideRequest.user_id")
    rentals = relationship("Rental", back_populates="user", foreign_keys="Rental.user_id")
    laundry_orders = relationship("LaundryOrder", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


class Rider(Base):
    __tablename__ = "riders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    vehicle_type = Column(String(50), default="Bike")  # Bike, Scooty
    vehicle_number = Column(String(50), nullable=False)
    availability_status = Column(String(20), default="Available")  # Available, Busy, Offline
    rating = Column(Float, default=4.9)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="rider_profile")
    vehicles = relationship("Vehicle", back_populates="rider")
    assigned_rides = relationship("RideRequest", back_populates="rider", foreign_keys="RideRequest.rider_id")
    assigned_rentals = relationship("Rental", back_populates="rider", foreign_keys="Rental.rider_id")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=True)
    type = Column(String(50), nullable=False)  # BIKE, SCOOTY
    registration_number = Column(String(50), unique=True, nullable=False)
    status = Column(String(50), default="Active")  # Active, Inactive, Maintenance

    rider = relationship("Rider", back_populates="vehicles")


class FareRoute(Base):
    __tablename__ = "fare_routes"

    id = Column(Integer, primary_key=True, index=True)
    from_location = Column(String(100), nullable=False, index=True)
    to_location = Column(String(100), nullable=False, index=True)
    single_fare = Column(Float, nullable=False)
    double_fare = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)


class RideRequest(Base):
    __tablename__ = "ride_requests"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=True)
    pickup = Column(String(100), nullable=False)
    drop = Column(String(100), nullable=False)
    passengers = Column(Integer, default=1, nullable=False)
    preferred_time = Column(String(50), nullable=False)
    fare = Column(Float, nullable=False)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, ACCEPTED, RIDER_ON_WAY, STARTED, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=utcnow)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="ride_requests", foreign_keys=[user_id])
    rider = relationship("Rider", back_populates="assigned_rides", foreign_keys=[rider_id])


class Rental(Base):
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rider_id = Column(Integer, ForeignKey("riders.id"), nullable=True)
    vehicle_type = Column(String(50), nullable=False)  # Bike, Scooty
    duration_hours = Column(Integer, nullable=False)  # 3, 6, 12, 24
    pickup_location = Column(String(100), nullable=False)
    preferred_pickup_time = Column(String(50), nullable=False)
    security_deposit = Column(Float, default=1000.0, nullable=False)
    rental_charge = Column(Float, nullable=False)
    actual_return_time = Column(String(50), nullable=True)
    refund_amount = Column(Float, nullable=True)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, ACCEPTED, ACTIVE, RETURNED, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="rentals", foreign_keys=[user_id])
    rider = relationship("Rider", back_populates="assigned_rentals", foreign_keys=[rider_id])


class LaundryOrder(Base):
    __tablename__ = "laundry_orders"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    pickup_location = Column(String(100), nullable=False)
    hostel = Column(String(100), nullable=True)
    room_number = Column(String(50), nullable=True)
    weight_kg = Column(Float, nullable=False)
    rate_per_kg = Column(Float, default=65.0, nullable=False)
    extra_charge = Column(Float, default=25.0, nullable=False)
    total_amount = Column(Float, nullable=False)
    pickup_day = Column(String(20), nullable=False)  # Wednesday, Saturday
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, PICKUP_SCHEDULED, COLLECTED, PROCESSING, READY, DELIVERED, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="laundry_orders")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO")  # RIDE, LAUNDRY, RENTAL, SYSTEM
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="notifications")


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(50), index=True, nullable=False)
    booking_type = Column(String(20), nullable=False)  # RIDE, RENTAL, LAUNDRY
    status = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=utcnow)
    note = Column(String(255), nullable=True)


class AdminAction(Base):
    __tablename__ = "admin_actions"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=False)
    admin_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    affected_item = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
